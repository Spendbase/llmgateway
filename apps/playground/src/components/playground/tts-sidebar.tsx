"use client";

import { CreditCard, LogOutIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TopUpCreditsDialog } from "@/components/credits/top-up-credits-dialog";
import { PlaygroundNavLinks } from "@/components/playground/playground-nav-links";
import { TtsSettingsPanel } from "@/components/playground/tts-settings-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";
import { clearLastUsedProjectCookiesAction } from "@/lib/actions/project";
import { useAuth } from "@/lib/auth-client";

import { ProjectSwitcher } from "./project-switcher";

import type { ApiModel } from "@/lib/fetch-models";
import type { Organization, Project } from "@/lib/types";

const OrganizationSwitcher = dynamic(
	() => import("./organization-switcher").then((m) => m.OrganizationSwitcher),
	{ ssr: false },
);

interface TtsSidebarProps {
	organizations: Organization[];
	selectedOrganization: Organization | null;
	projects: Project[];
	selectedProject: Project | null;
	onSelectOrganization: (org: Organization | null) => void;
	onSelectProject: (project: Project | null) => void;
	onOrganizationCreated: (org: Organization) => void;
	onProjectCreated: (project: Project) => void;
	// Settings
	audioModels: ApiModel[];
	model: string;
	voice: string;
	format: string;
	onModelChange: (value: string) => void;
	onVoiceChange: (value: string) => void;
	onFormatChange: (value: string) => void;
	disabled?: boolean;
}

function SidebarLogo() {
	return (
		<Link
			href="/"
			className="flex self-start items-center gap-2 my-2"
			prefetch={true}
		>
			<Logo className="h-10 w-10" />
			<h1 className="text-xl font-semibold">LLM API</h1>
			<Badge>Speech</Badge>
		</Link>
	);
}

export function TtsSidebar({
	organizations,
	selectedOrganization,
	projects,
	selectedProject,
	onSelectOrganization,
	onSelectProject,
	onOrganizationCreated,
	onProjectCreated,
	audioModels,
	model,
	voice,
	format,
	onModelChange,
	onVoiceChange,
	onFormatChange,
	disabled = false,
}: TtsSidebarProps) {
	const { user, isLoading: isUserLoading } = useUser();
	const { signOut } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	const logout = async () => {
		try {
			await clearLastUsedProjectCookiesAction();
		} catch {
			toast.error("Failed to clear last used project cookies");
		}
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push(
						process.env.NODE_ENV === "development"
							? "http://localhost:3003/login"
							: "https://chat.llmapi.ai/login",
					);
				},
			},
		});
	};

	const isAuthenticated = !isUserLoading && !!user;

	if (!isAuthenticated) {
		return (
			<Sidebar className="max-md:hidden">
				<SidebarHeader>
					<div className="flex flex-col gap-3">
						<SidebarLogo />
						<PlaygroundNavLinks pathname={pathname} />
						<div className="w-full rounded-md border p-4 text-sm">
							<div className="font-medium mb-2">Sign in required</div>
							<p className="text-muted-foreground mb-3">
								Please sign in to use text-to-speech.
							</p>
							<div className="flex flex-col gap-2">
								<GoogleSignInButton />
								<Button size="sm" variant="outline" className="w-full" asChild>
									<Link href="/login">Email Login</Link>
								</Button>
								<Button size="sm" variant="outline" className="w-full" asChild>
									<Link href="/signup">Sign up</Link>
								</Button>
							</div>
						</div>
					</div>
				</SidebarHeader>
			</Sidebar>
		);
	}

	return (
		<Sidebar className="max-md:hidden overflow-hidden">
			<SidebarHeader>
				<div className="flex flex-col gap-3">
					<SidebarLogo />
					<PlaygroundNavLinks pathname={pathname} />
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<OrganizationSwitcher
							organizations={organizations}
							selectedOrganization={selectedOrganization}
							onSelectOrganization={onSelectOrganization}
							onOrganizationCreated={onOrganizationCreated}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarMenu>
					<SidebarMenuItem>
						{selectedOrganization && (
							<ProjectSwitcher
								projects={projects}
								selectedProject={selectedProject}
								onSelectProject={onSelectProject}
								currentOrganization={selectedOrganization}
								onProjectCreated={onProjectCreated}
							/>
						)}
					</SidebarMenuItem>
				</SidebarMenu>

				<div className="py-2">
					<TtsSettingsPanel
						audioModels={audioModels}
						model={model}
						voice={voice}
						format={format}
						onModelChange={onModelChange}
						onVoiceChange={onVoiceChange}
						onFormatChange={onFormatChange}
						disabled={disabled}
					/>
				</div>
			</SidebarContent>

			<SidebarFooter className="border-t p-3 space-y-1">
				{/* Credits row */}
				<TopUpCreditsDialog organization={selectedOrganization}>
					<button
						type="button"
						className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
					>
						<CreditCard
							className={`h-3.5 w-3.5 shrink-0 ${
								selectedOrganization &&
								Number(selectedOrganization.credits) <= 0
									? "text-destructive"
									: selectedOrganization &&
										  Number(selectedOrganization.credits) < 1
										? "text-yellow-500"
										: "text-muted-foreground"
							}`}
						/>
						<span className="text-xs text-muted-foreground">Credits</span>
						<span
							className={`text-xs font-semibold tabular-nums ${
								selectedOrganization &&
								Number(selectedOrganization.credits) <= 0
									? "text-destructive"
									: selectedOrganization &&
										  Number(selectedOrganization.credits) < 1
										? "text-yellow-600"
										: "text-foreground"
							}`}
						>
							$
							{selectedOrganization
								? Number(selectedOrganization.credits).toFixed(2)
								: "0.00"}
						</span>
						<span className="ml-auto text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
							Add
						</span>
					</button>
				</TopUpCreditsDialog>

				{/* User row */}
				<div className="flex items-center gap-2 px-2 py-1.5">
					<Avatar className="h-6 w-6 shrink-0 border border-border">
						<AvatarFallback className="bg-muted text-[10px]">
							{user?.name?.slice(0, 2)?.toUpperCase() ?? "AU"}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<div className="text-xs font-medium truncate">{user?.name}</div>
						<div className="text-[10px] text-muted-foreground truncate">
							{user?.email}
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={logout}
						className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground"
						title="Sign out"
					>
						<LogOutIcon className="h-3.5 w-3.5" />
					</Button>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
