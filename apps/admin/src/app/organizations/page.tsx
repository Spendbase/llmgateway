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
		sort?: string;
		order?: string;
		from?: string;
		to?: string;
	}>;
}) {
	const params = await searchParams;
	const pageRaw = Number.parseInt(params.page || "1", 10);
	const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
	const pageSizeRaw = Number.parseInt(params.pageSize || String(PAGESIZE), 10);
	const pageSizeCandidate =
		Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : PAGESIZE;
	const pageSize = Math.min(100, pageSizeCandidate);
	const search = params.search?.trim() || "";
	const plans = parseList(params.plans);
	const statuses = parseList(params.statuses);
	const sort = params.sort || "createdAt";
	const order = params.order || "desc";
	const from = params.from;
	const to = params.to;

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
					sort,
					order,
					from,
					to,
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
		/>
	);
}
