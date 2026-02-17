"use client";

import { DepositsPagination } from "@/components/deposits/deposits-pagination";
import { DepositsTable } from "@/components/deposits/deposits-table";

import type { paths } from "@/lib/api/v1";

type DepositsResponse =
	paths["/admin/deposits"]["get"]["responses"]["200"]["content"]["application/json"];

export default function DepositsIndex({
	depositsData,
}: {
	depositsData: DepositsResponse;
}) {
	const { deposits, pagination } = depositsData;

	return (
		<div className="flex flex-1 flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Deposits</h1>
					<p className="text-sm text-gray-500">
						View and manage all organization deposits
					</p>
				</div>
			</div>

			{deposits.length === 0 ? (
				<div className="rounded-md border p-8 text-center text-gray-500">
					No deposits found
				</div>
			) : (
				<>
					<DepositsTable deposits={deposits} />
					<DepositsPagination
						currentPage={pagination.page}
						totalPages={pagination.totalPages}
						pageSize={pagination.pageSize}
						totalDeposits={pagination.totalDeposits}
					/>
				</>
			)}
		</div>
	);
}
