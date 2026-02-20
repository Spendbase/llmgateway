import DepositsIndex from "@/components/deposits/deposits-index";
import { PAGESIZE } from "@/lib/constants";
import { fetchServerData } from "@/lib/server-api";

import type { paths } from "@/lib/api/v1";

type DepositsResponse =
	paths["/admin/deposits"]["get"]["responses"]["200"]["content"]["application/json"];

export default async function DepositsPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		pageSize?: string;
		status?: string;
		from?: string;
		to?: string;
		q?: string;
	}>;
}) {
	const params = await searchParams;
	const page = parseInt(params.page || "1", 10);
	const pageSize = parseInt(params.pageSize || String(PAGESIZE), 10);
	const validStatuses = ["pending", "completed", "failed"] as const;
	const statusParam = params.status;
	const status = validStatuses.includes(statusParam as any)
		? (statusParam as "pending" | "completed" | "failed")
		: undefined;
	const from = params.from;
	const to = params.to;
	const q = params.q;

	const depositsData = (await fetchServerData<DepositsResponse>(
		"GET",
		"/admin/deposits",
		{
			params: {
				query: {
					page,
					pageSize,
					status,
					from,
					to,
					q,
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
