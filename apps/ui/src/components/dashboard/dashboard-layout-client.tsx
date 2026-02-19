"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { type ReactNode, useEffect, useCallback, useState } from "react";

import { FreeCreditsBanner } from "@/components/api-keys/free-credits-banner";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { TopBar } from "@/components/dashboard/top-bar";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { DashboardProvider } from "@/lib/dashboard-context";
import { useDashboardState } from "@/lib/dashboard-state";
import { useApi } from "@/lib/fetch-client";
import { buildOrganizationUrl } from "@/lib/navigation-utils";

interface DashboardLayoutClientProps {
	children: ReactNode;
	initialOrganizationsData?: unknown;
	initialProjectsData?: unknown;
	selectedOrgId?: string;
	selectedProjectId?: string;
}

export function DashboardLayoutClient({
	children,
	initialOrganizationsData,
	initialProjectsData,
	selectedOrgId,
	selectedProjectId,
}: DashboardLayoutClientProps) {
	const posthog = usePostHog();
	const router = useRouter();
	const api = useApi();
	const queryClient = useQueryClient();

	const handleOrganizationChange = useCallback(
		(orgId: string) => {
			// Trigger navigation
			router.push(buildOrganizationUrl(orgId));

			// Mark as stale and refetch active observers immediately
			const orgsQueryKey = api.queryOptions("get", "/orgs", {}).queryKey;
			queryClient.invalidateQueries({ queryKey: orgsQueryKey });
		},
		[router, api, queryClient],
	);

	const [isFreeCreditsBannerVisible, setIsFreeCreditsBannerVisible] =
		useState(true);

	const handleCloseFreeCreditsBanner = () => {
		setIsFreeCreditsBannerVisible(false);
	};

	const { data: bannersData } = api.useQuery(
		"get",
		"/admin/banners",
		undefined,
		{
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false,
		},
	);

	const freeCreditsBanner = bannersData?.banners?.find(
		(b) => b.id === "free-credits",
	);

	const shouldShowBanner =
		freeCreditsBanner?.enabled && isFreeCreditsBannerVisible;

	const {
		organizations,
		projects,
		selectedProject,
		selectedOrganization,
		handleOrganizationSelect,
		handleProjectSelect,
		handleOrganizationCreated,
		handleProjectCreated,
	} = useDashboardState({
		initialOrganizationsData,
		initialProjectsData,
		selectedOrgId,
		selectedProjectId,
		onOrganizationChange: handleOrganizationChange,
	});

	useEffect(() => {
		posthog.capture("page_viewed_dashboard");
	}, [posthog]);

	return (
		<DashboardProvider
			value={{
				organizations,
				projects,
				selectedOrganization,
				selectedProject,
				handleOrganizationSelect,
				handleProjectSelect,
				handleOrganizationCreated,
				handleProjectCreated,
				isFreeCreditsBannerVisible,
			}}
		>
			<div className="flex min-h-screen w-full flex-col">
				<MobileHeader />
				<div className="flex flex-1">
					<DashboardSidebar
						organizations={organizations}
						onSelectOrganization={handleOrganizationSelect}
						onOrganizationCreated={handleOrganizationCreated}
						selectedOrganization={selectedOrganization}
					/>
					<div className="flex flex-1 flex-col justify-center">
						<TopBar
							projects={projects}
							selectedProject={selectedProject}
							onSelectProject={handleProjectSelect}
							selectedOrganization={selectedOrganization}
							onProjectCreated={handleProjectCreated}
						/>
						<EmailVerificationBanner />
						{shouldShowBanner && (
							<FreeCreditsBanner
								handleCloseFreeCreditsBanner={handleCloseFreeCreditsBanner}
							/>
						)}
						<main className="relative bg-background w-full flex-1 overflow-y-auto pt-10 pb-4 px-4 md:p-6 lg:p-8">
							{children}
						</main>
					</div>
				</div>
			</div>
		</DashboardProvider>
	);
}
