import OrganizationClient from "@/components/organizations/organization-client";
import { PAGESIZE } from "@/lib/constants";
import { fetchServerData } from "@/lib/server-api";

import type { OrganizationsPaginationResponse } from "@/lib/types";

const parseList = (value?: string) =>
	value
		?.split(",")
		.map((item) => item.trim())
		.filter(Boolean) || [];

export default async function OrganizationsPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		pageSize?: string;
		search?: string;
		plans?: string;
		statuses?: string;
		retentionLevels?: string;
	}>;
}) {
	const params = await searchParams;
	const page = Number.parseInt(params.page || "1", 10) || 1;
	const pageSize =
		Number.parseInt(params.pageSize || String(PAGESIZE), 10) || PAGESIZE;
	const search = params.search?.trim() || "";
	const plans = parseList(params.plans);
	const statuses = parseList(params.statuses);
	const retentionLevels = parseList(params.retentionLevels);

	const data = (await fetchServerData<OrganizationsPaginationResponse>(
		"GET",
		"/admin/organizations",
		{
			params: {
				query: {
					page,
					pageSize,
					search,
					plans: plans.join(","),
					statuses: statuses.join(","),
					retentionLevels: retentionLevels.join(","),
				},
			},
		},
	)) || {
		organizations: [],
		suggestions: [],
		pagination: {
			page: 1,
			pageSize,
			totalOrganizations: 0,
			totalPages: 1,
		},
	};

	return (
		<OrganizationClient
			organizationsData={data}
			search={search}
			plans={plans}
			statuses={statuses}
			retentionLevels={retentionLevels}
		/>
	);
}
