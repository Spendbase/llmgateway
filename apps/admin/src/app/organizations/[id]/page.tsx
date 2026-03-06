import { notFound } from "next/navigation";

import { OrgAnalyticsLayout } from "@/components/organizations/analytics/org-analytics-layout";
import { fetchServerData } from "@/lib/server-api";

import type {
	OrgAnalyticsOverview,
	OrgApiKeysResponse,
	OrgDepositsResponse,
	OrgMember,
	OrgProject,
	OrgUsageResponse,
} from "@/lib/types";

export default async function OrgAnalyticsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const [overview, apiKeys, usage, members, projects, deposits] =
		await Promise.all([
			fetchServerData<OrgAnalyticsOverview>(
				"GET",
				"/admin/organizations/{id}",
				{ params: { path: { id } } },
			),
			fetchServerData<OrgApiKeysResponse>(
				"GET",
				"/admin/organizations/{id}/api-keys",
				{ params: { path: { id } } },
			),
			fetchServerData<OrgUsageResponse>(
				"GET",
				"/admin/organizations/{id}/usage",
				{
					params: { path: { id } },
				},
			),
			fetchServerData<{ members: OrgMember[] }>(
				"GET",
				"/admin/organizations/{id}/members",
				{ params: { path: { id } } },
			),
			fetchServerData<{ projects: OrgProject[] }>(
				"GET",
				"/admin/organizations/{id}/projects",
				{ params: { path: { id } } },
			),
			fetchServerData<OrgDepositsResponse>(
				"GET",
				"/admin/organizations/{id}/deposits",
				{ params: { path: { id } } },
			),
		]);

	if (!overview) {
		notFound();
	}

	return (
		<OrgAnalyticsLayout
			orgId={id}
			overview={overview}
			initialApiKeys={
				apiKeys ?? {
					items: [],
					pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
				}
			}
			initialUsage={
				usage ?? {
					months: [],
					totals: {
						requests: 0,
						promptTokens: 0,
						completionTokens: 0,
						reasoningTokens: 0,
						totalTokens: 0,
						cost: 0,
					},
				}
			}
			initialMembers={members?.members ?? []}
			initialProjects={projects?.projects ?? []}
			initialDeposits={
				deposits ?? {
					items: [],
					pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
				}
			}
		/>
	);
}
