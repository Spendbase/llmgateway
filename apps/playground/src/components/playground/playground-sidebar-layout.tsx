"use client";

import { CreditCard, LogOutIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TopUpCreditsDialog } from "@/components/credits/top-up-credits-dialog";
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

import { PlaygroundNavLinks } from "./playground-nav-links";
import { ProjectSwitcher } from "./project-switcher";

import type { Organization, Project } from "@/lib/types";
import type { ReactNode } from "react";

const OrganizationSwitcher = dynamic(
	() => import("./organization-switcher").then((m) => m.OrganizationSwitcher),
	{ ssr: false },
);

interface PlaygroundSidebarLayoutProps {
	badge: string;
	className?: string;
	organizations: Organization[];
	selectedOrganization: Organization | null;
	onSelectOrganization: (org: Organization | null) => void;
	onOrganizationCreated: (org: Organization) => void;
	projects: Project[];
	selectedProject: Project | null;
	onSelectProject: (project: Project | null) => void;
	onProjectCreated: (project: Project) => void;
	headerExtra?: ReactNode;
	children?: ReactNode;
	onLogout?: () => Promise<void>;
}

export function PlaygroundSidebarLayout({
	badge,
	className,
	organizations,
	selectedOrganization,
	onSelectOrganization,
	onOrganizationCreated,
	projects,
	selectedProject,
	onSelectProject,
	onProjectCreated,
	headerExtra,
	children,
	onLogout,
}: PlaygroundSidebarLayoutProps) {
	const { user, isLoading: isUserLoading } = useUser();
	const { signOut } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	const isAuthenticated = !isUserLoading && !!user;

	const defaultLogout = async () => {
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

	const handleLogout = onLogout ?? defaultLogout;

	const logoBlock = (
		<Link
			href="/"
			className="flex self-start items-center gap-2 my-2"
			prefetch={true}
		>
			<Logo className="h-10 w-10" />
			<h1 className="text-xl font-semibold">LLM API</h1>
			<Badge>{badge}</Badge>
		</Link>
	);

	if (!isAuthenticated) {
		return (
			<Sidebar className={`max-md:hidden ${className ?? ""}`}>
				<SidebarHeader>
					<div className="flex flex-col gap-3">
						{logoBlock}
						<PlaygroundNavLinks pathname={pathname} />
						<div className="w-full rounded-md border p-4 text-sm">
							<div className="font-medium mb-2">Sign in required</div>
							<p className="text-muted-foreground mb-3">
								Please sign in to continue.
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
		<Sidebar className={`max-md:hidden overflow-hidden ${className ?? ""}`}>
			<SidebarHeader>
				<div className="flex flex-col gap-3">
					{logoBlock}
					<PlaygroundNavLinks pathname={pathname} />
					{headerExtra}
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2 overflow-x-hidden">
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

				{children}
			</SidebarContent>

			<SidebarFooter className="border-t p-2">
				<div className="flex items-center gap-2 px-1 py-1">
					<Avatar className="border-border h-7 w-7 border shrink-0">
						<AvatarFallback className="bg-muted text-[10px]">
							{user?.name?.slice(0, 2)?.toUpperCase() ?? "AU"}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<div className="text-xs font-medium truncate leading-tight">
							{user?.name}
						</div>
						<div className="text-[10px] text-muted-foreground truncate leading-tight">
							{user?.email}
						</div>
					</div>
					<TopUpCreditsDialog organization={selectedOrganization}>
						<button
							type="button"
							className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer shrink-0"
							title="Credits"
						>
							<CreditCard
								className={`h-3 w-3 ${
									selectedOrganization &&
									Number(selectedOrganization.credits) <= 0
										? "text-destructive"
										: selectedOrganization &&
											  Number(selectedOrganization.credits) < 1
											? "text-yellow-500"
											: "text-muted-foreground"
								}`}
							/>
							<span
								className={`text-[10px] font-semibold tabular-nums ${
									selectedOrganization &&
									Number(selectedOrganization.credits) <= 0
										? "text-destructive"
										: selectedOrganization &&
											  Number(selectedOrganization.credits) < 1
											? "text-yellow-600"
											: "text-muted-foreground"
								}`}
							>
								$
								{selectedOrganization
									? Number(selectedOrganization.credits).toFixed(2)
									: "0.00"}
							</span>
						</button>
					</TopUpCreditsDialog>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
						title="Sign out"
					>
						<LogOutIcon className="h-3.5 w-3.5" />
					</Button>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
