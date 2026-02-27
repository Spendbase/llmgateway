"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Plus,
	MessageSquare,
	Edit2,
	Trash2,
	Loader2,
	MoreVerticalIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	useChats,
	useDeleteChat,
	useUpdateChat,
	type Chat,
} from "@/hooks/useChats";
import { useUser } from "@/hooks/useUser";
import { clearLastUsedProjectCookiesAction } from "@/lib/actions/project";
import { useAuth } from "@/lib/auth-client";

import { ChatSidebarSkeleton } from "./chat-sidebar-skeleton";
import { PlaygroundSidebarLayout } from "./playground-sidebar-layout";

import type { Organization, Project } from "@/lib/types";

interface ChatSidebarProps {
	currentChatId?: string;
	onChatSelect?: (chatId: string) => void;
	onNewChat?: () => void;
	clearMessages: () => void;
	className?: string;
	isLoading?: boolean;
	organizations: Organization[];
	selectedOrganization: Organization | null;
	onSelectOrganization: (organization: Organization | null) => void;
	onOrganizationCreated: (organization: Organization) => void;
	projects: Project[];
	selectedProject: Project | null;
	onSelectProject: (project: Project | null) => void;
	onProjectCreated: (project: Project) => void;
}

export function ChatSidebar({
	currentChatId,
	onChatSelect,
	onNewChat,
	clearMessages,
	className,
	isLoading: isPageLoading = false,
	organizations,
	selectedOrganization,
	onSelectOrganization,
	onOrganizationCreated,
	projects,
	selectedProject,
	onSelectProject,
	onProjectCreated,
}: ChatSidebarProps) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const posthog = usePostHog();
	const { isLoading: isUserLoading } = useUser();
	const { signOut } = useAuth();

	const { data: chatsData, isLoading: isChatsLoading } = useChats();
	const deleteChat = useDeleteChat();
	const updateChat = useUpdateChat();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");

	const chats = chatsData?.chats || [];

	const logout = async () => {
		posthog.reset();
		try {
			await clearLastUsedProjectCookiesAction();
		} catch {}
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					queryClient.clear();
					router.push(
						process.env.NODE_ENV === "development"
							? "http://localhost:3003/login"
							: "https://chat.llmapi.ai/login",
					);
				},
			},
		});
	};

	const handleEditTitle = (chat: Chat) => {
		setEditingId(chat.id);
		setEditTitle(chat.title);
	};

	const saveTitle = (chatId: string) => {
		if (editTitle.trim()) {
			updateChat.mutate({
				params: { path: { id: chatId } },
				body: { title: editTitle.trim() },
			});
		}
		setEditingId(null);
		setEditTitle("");
	};

	const handleDeleteChat = (chatId: string) => {
		deleteChat.mutate({ params: { path: { id: chatId } } });
		if (currentChatId === chatId) {
			clearMessages();
			onChatSelect?.("");
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
		if (diffInHours < 1) {
			return "Just now";
		}
		if (diffInHours < 24) {
			return `${Math.floor(diffInHours)}h ago`;
		}
		if (diffInHours < 48) {
			return "Yesterday";
		}
		return format(date, "MMM d");
	};

	const groupChatsByDate = (chats: Chat[]) => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const lastWeek = new Date(today);
		lastWeek.setDate(lastWeek.getDate() - 7);

		const groups = {
			today: [] as Chat[],
			yesterday: [] as Chat[],
			lastWeek: [] as Chat[],
			older: [] as Chat[],
		};

		chats.forEach((chat) => {
			const chatDate = new Date(chat.updatedAt);
			if (chatDate.toDateString() === today.toDateString()) {
				groups.today.push(chat);
			} else if (chatDate.toDateString() === yesterday.toDateString()) {
				groups.yesterday.push(chat);
			} else if (chatDate >= lastWeek) {
				groups.lastWeek.push(chat);
			} else {
				groups.older.push(chat);
			}
		});

		return groups;
	};

	const chatGroups = groupChatsByDate(
		[...chats].sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		),
	);

	const renderChatGroup = (title: string, groupChats: Chat[]) => {
		if (groupChats.length === 0) {
			return null;
		}
		return (
			<div key={title} className="mb-4">
				<div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
					{title}
				</div>
				<div className="space-y-1">
					{groupChats.map((chat) => (
						<SidebarMenuItem key={chat.id} className="relative">
							<SidebarMenuButton
								isActive={currentChatId === chat.id}
								onClick={() => onChatSelect?.(chat.id)}
								className="w-full justify-start gap-3 group relative pr-10 py-6"
								type="button"
								disabled={isPageLoading}
							>
								<MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
								{editingId === chat.id ? (
									<Input
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										onBlur={() => saveTitle(chat.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												saveTitle(chat.id);
											}
											if (e.key === "Escape") {
												setEditingId(null);
												setEditTitle("");
											}
										}}
										className="h-7 text-sm border-none px-1 focus-visible:ring-0 bg-transparent"
										autoFocus
									/>
								) : (
									<div className="flex-1 min-w-0">
										<div className="truncate text-sm font-medium mb-0.5">
											{chat.title}
										</div>
										<div className="text-xs text-muted-foreground">
											{chat.messageCount} messages •{" "}
											{formatDate(chat.updatedAt)}
										</div>
									</div>
								)}
							</SidebarMenuButton>
							{currentChatId === chat.id && editingId !== chat.id && (
								<div className="absolute right-0 top-2 bottom-0">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<SidebarMenuAction
												type="button"
												onClick={(e) => e.stopPropagation()}
												className="h-7 w-7 cursor-pointer"
											>
												<MoreVerticalIcon className="h-3.5 w-3.5" />
											</SidebarMenuAction>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleEditTitle(chat);
												}}
												className="flex items-center gap-2"
											>
												<Edit2 className="h-4 w-4" />
												Rename
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteChat(chat.id);
												}}
												className="flex items-center gap-2 text-destructive focus:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							)}
						</SidebarMenuItem>
					))}
				</div>
			</div>
		);
	};

	if (isUserLoading) {
		return (
			<Sidebar className={className}>
				<SidebarHeader>
					<Link href="/" className="flex items-center gap-2 my-2" prefetch>
						<Logo className="h-10 w-10" />
						<h1 className="text-xl font-semibold">LLM API</h1>
						<Badge>Chat</Badge>
					</Link>
				</SidebarHeader>
				<SidebarContent className="px-2 py-4">
					<div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading…
					</div>
				</SidebarContent>
			</Sidebar>
		);
	}

	if (isChatsLoading) {
		return (
			<ChatSidebarSkeleton
				organization={selectedOrganization}
				isOrgLoading={false}
			/>
		);
	}

	return (
		<PlaygroundSidebarLayout
			badge="Chat"
			className={className}
			organizations={organizations}
			selectedOrganization={selectedOrganization}
			onSelectOrganization={onSelectOrganization}
			onOrganizationCreated={onOrganizationCreated}
			projects={projects}
			selectedProject={selectedProject}
			onSelectProject={onSelectProject}
			onProjectCreated={onProjectCreated}
			onLogout={logout}
			headerExtra={
				<Button
					variant="outline"
					className="w-full flex items-center gap-2 cursor-pointer"
					onClick={onNewChat}
					disabled={isPageLoading}
				>
					{isPageLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Plus className="h-4 w-4" />
					)}
					New Chat
				</Button>
			}
		>
			<SidebarMenu>
				{renderChatGroup("Today", chatGroups.today)}
				{renderChatGroup("Yesterday", chatGroups.yesterday)}
				{renderChatGroup("Last 7 days", chatGroups.lastWeek)}
				{renderChatGroup("Older", chatGroups.older)}
				{chats.length === 0 && (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
						<p className="text-sm text-muted-foreground mb-2">
							No chat history
						</p>
						<p className="text-xs text-muted-foreground">
							Start a new conversation to see it here
						</p>
					</div>
				)}
			</SidebarMenu>
		</PlaygroundSidebarLayout>
	);
}
