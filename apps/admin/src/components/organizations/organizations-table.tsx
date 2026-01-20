import { DepositCreditsButton } from "@/components/deposit-credits/deposit-credits-dialog";

import type { Organization } from "@/lib/types";

export function OrganizationsTable({
	organizations,
}: {
	organizations: Organization[];
}) {
	return (
		<div className="rounded-md border">
			<table className="w-full text-sm text-left">
				<thead className="bg-gray-50 text-gray-700">
					<tr>
						<th className="p-4">Organization Name</th>
						<th className="p-4">Billing Email</th>
						<th className="p-4">Current Credit Balance</th>
						<th className="p-4">Plan type</th>
						<th className="p-4 text-center">Actions</th>
					</tr>
				</thead>
				<tbody>
					{organizations.map((org: Organization) => (
						<tr key={org.id} className="border-t-amber-400">
							<td className="p-4 font-medium">{org.name}</td>
							<td className="p-4">{org.billingEmail}</td>
							<td className="p-4 font-mono">
								${Number(org.credits).toFixed(2)}
							</td>
							<td className="p-4 font-mono">
								{org.plan ? org.plan.toUpperCase() : "-"}
							</td>
							<td className="p-4 flex justify-center">
								<DepositCreditsButton organization={org} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
