import { notFound } from "next/navigation";

import { VoucherDetailIndex } from "@/components/vouchers/voucher-detail-index";
import { fetchServerData } from "@/lib/server-api";

import type { paths } from "@/lib/api/v1";

type VoucherDetailResponse =
	paths["/admin/vouchers/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export default async function VoucherDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const { id } = params;

	const data = await fetchServerData<VoucherDetailResponse>(
		"GET",
		"/admin/vouchers/{id}",
		{
			params: {
				path: {
					id,
				},
			},
		},
	);

	if (!data || !data.voucher) {
		notFound();
	}

	return <VoucherDetailIndex data={data} />;
}
