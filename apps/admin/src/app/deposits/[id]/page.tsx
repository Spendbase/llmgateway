import { notFound } from "next/navigation";

import { DepositDetailIndex } from "@/components/deposits/deposit-detail-index";
import { fetchServerData } from "@/lib/server-api";

import type { paths } from "@/lib/api/v1";

type DepositDetailResponse =
	paths["/admin/deposits/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export default async function DepositDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const data = await fetchServerData<DepositDetailResponse>(
		"GET",
		"/admin/deposits/{id}",
		{
			params: {
				path: {
					id,
				},
			},
		},
	);

	if (!data || !data.deposit) {
		notFound();
	}

	return <DepositDetailIndex data={data} />;
}
