import { DepositCreditsButton } from "@/components/deposit-credits/deposit-credits-dialog";
import { Badge } from "@/components/ui/badge";

import type { Organization } from "@/lib/types";

interface OrganizationsTableProps {
	organizations: Organization[];
	searchQuery: string;
}

const escapeRegExp = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightMatch = (value: string, query: string) => {
	if (!query.trim()) {
		return value;
	}

	const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi");
	const parts = value.split(pattern);

	return parts.map((part, index) =>
		part.toLowerCase() === query.toLowerCase() ? (
			<mark
				key={`${part}-${index}`}
				className="rounded bg-yellow-200 px-0.5 text-foreground"
			>
				{part}
			</mark>
		) : (
			part
		),
	);
};

export function OrganizationsTable({
	organizations,
	searchQuery,
}: OrganizationsTableProps) {
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
								Company
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Current Credit Balance
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Plan type
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Status
							</th>
							<th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/40">
						{organizations.map((org: Organization) => (
							<tr key={org.id} className="hover:bg-muted/30 transition-colors">
								<td className="px-4 py-4 font-medium">
									{highlightMatch(org.name, searchQuery)}
								</td>
								<td className="px-4 py-4">
									{highlightMatch(org.billingEmail, searchQuery)}
								</td>
								<td className="px-4 py-4">
									{org.billingCompany
										? highlightMatch(org.billingCompany, searchQuery)
										: "-"}
								</td>
								<td className="px-4 py-4 font-mono">
									${Number(org.credits).toFixed(2)}
								</td>
								<td className="px-4 py-4 font-mono">
									<Badge variant={org.plan === "pro" ? "default" : "outline"}>
										{org.plan ? org.plan.toUpperCase() : "-"}
									</Badge>
								</td>
								<td className="px-4 py-4">
									<Badge
										variant={
											org.status === "active"
												? "default"
												: org.status === "inactive"
													? "secondary"
													: org.status === "deleted"
														? "destructive"
														: "outline"
										}
									>
										{org.status || "-"}
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
