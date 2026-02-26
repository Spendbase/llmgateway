import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { DeleteVoucherButton } from "./delete-voucher-button";

import type { paths } from "@/lib/api/v1";

type VoucherItem =
	paths["/admin/vouchers"]["get"]["responses"]["200"]["content"]["application/json"]["items"][number];

export function VouchersTable({ vouchers }: { vouchers: VoucherItem[] }) {
	return (
		<div className="rounded-md border overflow-x-auto max-w-full">
			<table className="min-w-[900px] w-max text-sm text-left">
				<thead className="bg-gray-50 text-gray-700 h-14">
					<tr>
						<th className="px-4 py-2 font-medium">Code</th>
						<th className="px-4 py-2 font-medium">Deposit Amount</th>
						<th className="px-4 py-2 font-medium">Global Limit</th>
						<th className="px-4 py-2 font-medium">Org Limit</th>
						<th className="px-4 py-2 font-medium">Total Redemptions</th>
						<th className="px-4 py-2 font-medium">Active</th>
						<th className="px-4 py-2 font-medium">Created At</th>
						<th className="px-4 py-2 font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{vouchers.length === 0 ? (
						<tr>
							<td colSpan={8} className="p-8 text-center text-muted-foreground">
								No vouchers found.
							</td>
						</tr>
					) : (
						vouchers.map((voucher) => (
							<tr key={voucher.id} className="border-t">
								<td className="p-4 font-mono text-xs">{voucher.code}</td>
								<td className="p-4">${voucher.depositAmount}</td>
								<td className="p-4">{voucher.globalUsageLimit}</td>
								<td className="p-4">{voucher.orgUsageLimit}</td>
								<td className="p-4">{voucher.totalRedemptionsAllOrgs}</td>
								<td className="p-4">
									{voucher.isActive ? (
										<Badge className="bg-green-600">Active</Badge>
									) : (
										<Badge variant="secondary">Inactive</Badge>
									)}
								</td>
								<td className="p-4">
									{new Date(voucher.createdAt).toLocaleDateString()}
								</td>
								<td className="p-4">
									<div className="flex items-center gap-2">
										<Link href={`/vouchers/${voucher.id}`}>
											<Button variant="outline" size="sm">
												View
											</Button>
										</Link>
										<DeleteVoucherButton
											voucherId={voucher.id}
											voucherCode={voucher.code}
										/>
									</div>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
