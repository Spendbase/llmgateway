"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Briefcase,
	Banknote,
	KeyRound,
	LayoutDashboard,
	LogOut,
	Megaphone,
	Server,
	Sparkles,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/lib/auth-client";

import { Logo } from "./ui/logo";

import type { ReactNode } from "react";

interface AdminShellProps {
	children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { signOut } = useAuth();
	const queryClient = useQueryClient();

	const isDashboard = pathname === "/" || pathname === "";
	const isTokens = pathname === "/tokens";
	const isOrganizations = pathname === "/organizations";
	const isDeposits =
		pathname === "/deposits" || pathname.startsWith("/deposits/");
	const isUsers = pathname === "/users";
	const isProviders = pathname.startsWith("/providers");
	const isModels = pathname.startsWith("/models");
	const isBanners = pathname === "/banners";

	const { user, isLoading } = useUser({
		redirectTo: pathname,
		redirectWhen: "unauthenticated",
	});

	const handleSignOut = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					queryClient.clear();
					router.push("/login");
				},
			},
		});
	};

	return (
		<SidebarProvider>
			<Sidebar variant="inset">
				<SidebarHeader className="border-b border-sidebar-border/60">
					<div className="flex h-12 items-center justify-between px-2">
						<div className="flex items-center gap-2 px-1">
							<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
								<Logo className="h-7 w-7" />
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-semibold leading-tight">
									LLM API
								</span>
								<span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									Admin
								</span>
							</div>
						</div>
						<SidebarTrigger />
					</div>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Main</SidebarGroupLabel>
						<SidebarMenu>
							<SidebarMenuItem>
								<Link href="/" className="block">
									<SidebarMenuButton isActive={isDashboard} size="lg">
										<LayoutDashboard className="h-4 w-4" />
										<span>Dashboard</span>
									</SidebarMenuButton>
								</Link>
								<Link href="/tokens" className="block">
									<SidebarMenuButton isActive={isTokens} size="lg">
										<KeyRound className="h-4 w-4" />
										<span>Tokens</span>
									</SidebarMenuButton>
								</Link>
								<Link href="/organizations" className="block">
									<SidebarMenuButton isActive={isOrganizations} size="lg">
										<Briefcase className="h-4 w-4" />
										<span>Organizations</span>
									</SidebarMenuButton>
								</Link>
								<Link href="/deposits" className="block">
									<SidebarMenuButton isActive={isDeposits} size="lg">
										<Banknote className="h-4 w-4" />
										<span>Deposits</span>
									</SidebarMenuButton>
								</Link>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
					<SidebarGroup>
						<SidebarGroupLabel>Platform</SidebarGroupLabel>
						<SidebarMenu>
							<SidebarMenuItem>
								<Link href="/providers" className="block">
									<SidebarMenuButton isActive={isProviders} size="lg">
										<Server className="h-4 w-4" />
										<span>Providers</span>
									</SidebarMenuButton>
								</Link>
								<Link href="/models" className="block">
									<SidebarMenuButton isActive={isModels} size="lg">
										<Sparkles className="h-4 w-4" />
										<span>Models</span>
									</SidebarMenuButton>
								</Link>
								<Link href="/banners" className="block">
									<SidebarMenuButton isActive={isBanners} size="lg">
										<Megaphone className="h-4 w-4" />
										<span>Banners</span>
									</SidebarMenuButton>
								</Link>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
					<SidebarGroup>
						<SidebarGroupLabel>People</SidebarGroupLabel>
						<SidebarMenu>
							<SidebarMenuItem>
								<Link href="/users" className="block">
									<SidebarMenuButton isActive={isUsers} size="lg">
										<Users className="h-4 w-4" />
										<span>Users</span>
									</SidebarMenuButton>
								</Link>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
				</SidebarContent>
				{!!user && !isLoading && (
					<SidebarFooter className="border-t border-sidebar-border/60">
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start gap-2 text-xs text-muted-foreground"
							onClick={handleSignOut}
						>
							<LogOut className="h-3.5 w-3.5" />
							<span>Sign out</span>
						</Button>
					</SidebarFooter>
				)}
			</Sidebar>
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
