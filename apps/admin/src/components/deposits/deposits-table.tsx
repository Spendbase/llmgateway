import { Badge } from "@/components/ui/badge";

import type { paths } from "@/lib/api/v1";

type Deposit =
	paths["/admin/deposits"]["get"]["responses"]["200"]["content"]["application/json"]["deposits"][number];

export function DepositsTable({ deposits }: { deposits: Deposit[] }) {
	return (
		<div className="rounded-md border">
			<table className="w-full text-sm text-left">
				<thead className="bg-gray-50 text-gray-700">
					<tr>
						<th className="p-4">Transaction ID</th>
						<th className="p-4">Organization Name</th>
						<th className="p-4">Amount</th>
						<th className="p-4">Credits</th>
						<th className="p-4">Payment Method</th>
						<th className="p-4">Date</th>
						<th className="p-4">Status</th>
					</tr>
				</thead>
				<tbody>
					{deposits.map((deposit) => (
						<tr key={deposit.id} className="border-t">
							<td
								className="p-4 font-mono text-xs max-w-[150px] truncate"
								title={deposit.id}
							>
								{deposit.id}
							</td>
							<td className="p-4">{deposit.organizationName}</td>
							<td className="p-4">
								{deposit.amount ? `${deposit.amount} ${deposit.currency}` : "-"}
							</td>
							<td className="p-4">{deposit.creditAmount}</td>
							<td className="p-4">{deposit.paymentMethod}</td>
							<td className="p-4">
								{new Date(deposit.createdAt).toLocaleDateString()}
							</td>
							<td className="p-4">
								{deposit.status === "completed" ? (
									<Badge className="bg-green-600">Completed</Badge>
								) : deposit.status === "pending" ? (
									<Badge variant="secondary">Pending</Badge>
								) : (
									<Badge variant="destructive">Failed</Badge>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
