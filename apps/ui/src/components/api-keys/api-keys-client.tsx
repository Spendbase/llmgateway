"use client";

import {
	CreditCard,
	Key,
	Plus,
	PlusCircle,
	RefreshCcw,
	ShieldCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { FaSitemap } from "react-icons/fa";

import { ApiKeysList } from "@/components/api-keys/api-keys-list";
import { CreateApiKeyDialog } from "@/components/api-keys/create-api-key-dialog";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/lib/components/card";
import { useDashboardContext } from "@/lib/dashboard-context";
import { useApi } from "@/lib/fetch-client";
import { extractOrgAndProjectFromPath } from "@/lib/navigation-utils";
import { cn } from "@/lib/utils";

import type { Project, ApiKey } from "@/lib/types";

export function ApiKeysClient({ initialData }: { initialData: ApiKey[] }) {
	const pathname = usePathname();
	const { selectedOrganization, isFreeCreditsBannerVisible } =
		useDashboardContext();

	const { projectId, orgId } = useMemo(() => {
		const result = extractOrgAndProjectFromPath(pathname);
		return result;
	}, [pathname]);

	const api = useApi();

	const { data: projectsData } = api.useQuery(
		"get",
		"/orgs/{id}/projects",
		{
			params: {
				path: { id: orgId || "" },
			},
		},
		{
			enabled: !!orgId,
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false,
		},
	);

	const selectedProject = useMemo((): Project | null => {
		if (!projectId || !projectsData?.projects) {
			return null;
		}

		const actualProject = projectsData.projects.find(
			(p: Project) => p.id === projectId,
		);
		return actualProject || null;
	}, [projectId, projectsData]);

	const { data: apiKeysData } = api.useQuery(
		"get",
		"/keys/api",
		{
			params: {
				query: { projectId: selectedProject?.id || "" },
			},
		},
		{
			enabled: !!selectedProject?.id,
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false,
		},
	);

	const planLimits = apiKeysData?.planLimits;
	const hasApiKeys =
		(apiKeysData?.apiKeys && apiKeysData.apiKeys.length > 0) ||
		(initialData && initialData.length > 0);
	const showOrganizationCredits =
		selectedOrganization && Number(selectedOrganization.credits) > 0;

	return (
		<div className="flex flex-col">
			<div
				className={cn("space-y-4 p-4 pt-0 md:p-8", {
					"pt-10 md:pt-6": !isFreeCreditsBannerVisible,
				})}
			>
				<div>
					<h2 className="text-3xl font-bold tracking-tight">
						Welcome to LLM API 👋
					</h2>
				</div>

				<Card>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-8">
							<div className="flex flex-col gap-4">
								<div className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400">
									<Key className="h-4 w-4" />
								</div>
								<div className="flex flex-col gap-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">
											{hasApiKeys
												? "Create and manage API keys to authenticate requests to LLM API"
												: "Create your first API Key and run first request"}
										</h3>
										<p className="text-sm text-muted-foreground">
											One key for all routed models and providers
										</p>
									</div>
									{selectedProject && (
										<CreateApiKeyDialog
											selectedProject={selectedProject}
											disabled={
												planLimits
													? planLimits.currentCount >= planLimits.maxKeys
													: false
											}
											disabledMessage={
												planLimits
													? `${planLimits.plan === "pro" ? "Pro" : "Free"} plan allows maximum ${planLimits.maxKeys} API keys per project`
													: undefined
											}
										>
											<Button
												disabled={
													!selectedProject ||
													(planLimits
														? planLimits.currentCount >= planLimits.maxKeys
														: false)
												}
												className="cursor-pointer w-full md:w-1/5 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<Plus className="h-4 w-4" />
												Create Key to Start
											</Button>
										</CreateApiKeyDialog>
									)}
								</div>
							</div>

							<div className="-mx-6 -mb-6 rounded-b-xl border-t border-[#F3F4F6] bg-[#F9FAFB] p-6 dark:border-none dark:bg-background md:mx-0 md:mb-0 md:min-w-[240px] md:rounded-lg md:border">
								<p className="text-sm font-medium mb-3">
									With this key you can:
								</p>
								<div className="space-y-2 text-sm text-muted-foreground">
									<p className="flex items-center gap-2">
										<FaSitemap className="h-3 w-3" />
										Use 100+ models
									</p>
									<p className="flex items-center gap-2">
										<RefreshCcw className="h-3 w-3" />
										Route across providers
									</p>
									<p className="flex items-center gap-2">
										<PlusCircle className="h-3 w-3" />
										Add your own vendors
									</p>
									<p className="flex items-center gap-2">
										<ShieldCheck className="h-3 w-3" />
										Control fallback logic
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{showOrganizationCredits && (
					<div className="w-full md:w-1/3">
						<MetricCard
							label="Organization Credits"
							value={`$${
								selectedOrganization
									? Number(selectedOrganization.credits).toFixed(2)
									: "0.00"
							}`}
							subtitle="Available balance"
							icon={<CreditCard className="h-4 w-4" />}
							accent="green"
						/>
					</div>
				)}

				{hasApiKeys && (
					<Card className="gap-0">
						<CardHeader className="hidden md:block">
							<CardDescription>
								{!selectedProject && (
									<span className="text-amber-600">
										Loading project information...
									</span>
								)}
							</CardDescription>
						</CardHeader>
						{!selectedProject && (
							<div className="text-amber-600 mb-4 md:hidden p-4">
								Loading project information...
							</div>
						)}
						<CardContent className="md:pt-0">
							<ApiKeysList
								selectedProject={selectedProject}
								initialData={initialData}
							/>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
