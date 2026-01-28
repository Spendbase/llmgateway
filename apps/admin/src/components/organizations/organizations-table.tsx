import { DepositCreditsButton } from "@/components/deposit-credits/deposit-credits-dialog";
import { Badge } from "@/components/ui/badge";

import type { Organization } from "@/lib/types";

export function OrganizationsTable({
	organizations,
}: {
	organizations: Organization[];
}) {
	return (
		<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="border-b border-border/60 bg-muted/40">
						<tr>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Organization
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Billing Email
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Current Credit Balance
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Plan type
							</th>
							<th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/40">
						{organizations.map((org: Organization) => (
							<tr key={org.id} className="hover:bg-muted/30 transition-colors">
								<td className="px-4 py-4 font-medium">{org.name}</td>
								<td className="px-4 py-4 ">{org.billingEmail}</td>
								<td className="px-4 py-4 font-mono">
									${Number(org.credits).toFixed(2)}
								</td>
								<td className="px-4 py-4 font-mono">
									<Badge
										variant={org.plan === "pro" ? "default" : "destructive"}
									>
										{org.plan ? org.plan.toUpperCase() : "-"}
									</Badge>
								</td>
								<td className="px-4 py-4 flex justify-center">
									<DepositCreditsButton organization={org} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
