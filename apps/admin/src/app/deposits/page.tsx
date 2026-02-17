import DepositsIndex from "@/components/deposits/deposits-index";
import { PAGESIZE } from "@/lib/constants";
import { fetchServerData } from "@/lib/server-api";

import type { paths } from "@/lib/api/v1";

type DepositsResponse =
	paths["/admin/deposits"]["get"]["responses"]["200"]["content"]["application/json"];

export default async function DepositsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
	const params = await searchParams;
	const page = parseInt(params.page || "1", 10);
	const pageSize = parseInt(params.pageSize || String(PAGESIZE), 10);

	const depositsData = (await fetchServerData<DepositsResponse>(
		"GET",
		"/admin/deposits",
		{
			params: {
				query: {
					page,
					pageSize,
				},
			},
		},
	)) || {
		deposits: [],
		pagination: {
			page: 1,
			pageSize,
			totalDeposits: 0,
			totalPages: 0,
		},
	};

	return <DepositsIndex depositsData={depositsData} />;
}
