import VouchersIndex from "@/components/vouchers/vouchers-index";
import { PAGESIZE } from "@/lib/constants";
import { fetchServerData } from "@/lib/server-api";

import type { paths } from "@/lib/api/v1";

type VouchersResponse =
	paths["/admin/vouchers"]["get"]["responses"]["200"]["content"]["application/json"];

export default async function VouchersPage({
	searchParams,
}: {
	searchParams: {
		page?: string;
		pageSize?: string;
	};
}) {
	const params = searchParams;
	const page = parseInt(params.page || "1", 10);
	const pageSize = parseInt(params.pageSize || String(PAGESIZE), 10);

	const vouchersData = (await fetchServerData<VouchersResponse>(
		"GET",
		"/admin/vouchers",
		{
			params: {
				query: {
					page,
					pageSize,
				},
			},
		},
	)) || {
		items: [],
		total: 0,
		page: 1,
		pageSize,
	};

	return <VouchersIndex vouchersData={vouchersData} />;
}
