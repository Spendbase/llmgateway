"use client";

import { useState } from "react";

import {
	DepositCreditsButton,
	DepositCreditsDialog,
} from "@/components/deposit-credits/deposit-credits-dialog";
import { useDashboardState } from "@/lib/dashboard-state";

import type { Organization } from "../../../../../packages/db/src/types";

export function OrganizationsTable({
	initialOrganizationsData,
}: {
	initialOrganizationsData?: unknown;
}) {
	const [selectedOrg, setSelectedOrg] = useState<Organization>(null!);

	const { organizations } = useDashboardState({
		initialOrganizationsData,
		selectedOrgId: selectedOrg?.id,
	});

	const handleOrganizationSelect = (org: Organization) => setSelectedOrg(org);

	return (
		<div className="rounded-md border">
			<table className="w-full text-sm text-left">
				<thead className="bg-gray-50 text-gray-700">
					<tr>
						<th className="p-4">Name</th>
						<th className="p-4">Email</th>
						<th className="p-4">Balance</th>
						<th className="p-4 text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{organizations.map((org) => (
						<tr key={org.id} className="border-t hover:bg-gray-50">
							<td className="p-4 font-medium">{org.name}</td>
							<td className="p-4">{org.billingEmail}</td>
							<td className="p-4 font-mono">
								${Number(org.credits).toFixed(2)}
							</td>
							<td className="p-4 text-right">
								<DepositCreditsDialog organization={selectedOrg}>
									<DepositCreditsButton
										onOrganizationSelect={handleOrganizationSelect}
									/>
								</DepositCreditsDialog>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
