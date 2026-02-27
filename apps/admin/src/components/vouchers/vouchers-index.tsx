"use client";

import { CreateVoucherDialog } from "@/components/vouchers/create-voucher-dialog";
import { VouchersPagination } from "@/components/vouchers/vouchers-pagination";
import { VouchersTable } from "@/components/vouchers/vouchers-table";

import type { paths } from "@/lib/api/v1";

type VouchersResponse =
	paths["/admin/vouchers"]["get"]["responses"]["200"]["content"]["application/json"];

export default function VouchersIndex({
	vouchersData,
}: {
	vouchersData: VouchersResponse;
}) {
	const { items, total, page, pageSize } = vouchersData;
	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="flex flex-1 flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Vouchers</h1>
					<p className="text-sm text-gray-500">View and manage all vouchers</p>
				</div>
				<CreateVoucherDialog />
			</div>

			{items.length === 0 ? (
				<div className="rounded-md border p-8 text-center text-gray-500">
					No vouchers found
				</div>
			) : (
				<VouchersTable vouchers={items} />
			)}
			{total > 0 && (
				<VouchersPagination
					currentPage={page}
					totalPages={totalPages}
					pageSize={pageSize}
					totalVouchers={total}
				/>
			)}
		</div>
	);
}
