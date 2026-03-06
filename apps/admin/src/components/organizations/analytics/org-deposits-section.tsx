"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CustomBadge as Badge } from "@/components/ui/custom-badge";
import { Input } from "@/components/ui/input";
import { useOrgDeposits } from "@/hooks/use-org-section-query";

import type { OrgDepositsResponse } from "@/lib/types";

interface OrgDepositsSectionProps {
	orgId: string;
	initialData: OrgDepositsResponse;
}

function statusVariant(status: string) {
	if (status === "completed") {
		return "success";
	}
	if (status === "failed") {
		return "error";
	}
	return "warning";
}

function formatType(type: string): string {
	return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrgDepositsSection({
	orgId,
	initialData,
}: OrgDepositsSectionProps) {
	const [page, setPage] = useState(1);
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");

	const { data } = useOrgDeposits(
		orgId,
		page,
		20,
		from ? new Date(from).toISOString() : undefined,
		to ? new Date(to).toISOString() : undefined,
	);

	const result = data ?? initialData;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2">
					<label className="text-sm text-muted-foreground">From</label>
					<Input
						type="date"
						className="w-36"
						value={from}
						onChange={(e) => {
							setFrom(e.target.value);
							setPage(1);
						}}
					/>
				</div>
				<div className="flex items-center gap-2">
					<label className="text-sm text-muted-foreground">To</label>
					<Input
						type="date"
						className="w-36"
						value={to}
						onChange={(e) => {
							setTo(e.target.value);
							setPage(1);
						}}
					/>
				</div>
				{(from || to) && (
					<button
						className="text-xs text-muted-foreground underline"
						onClick={() => {
							setFrom("");
							setTo("");
							setPage(1);
						}}
					>
						Clear
					</button>
				)}
				<span className="ml-auto text-sm text-muted-foreground">
					{result.pagination.total} transaction
					{result.pagination.total !== 1 ? "s" : ""}
				</span>
			</div>

			<div className="rounded-md border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Date
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Type
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Status
							</th>
							<th className="px-4 py-3 text-right font-medium text-muted-foreground">
								Amount
							</th>
							<th className="px-4 py-3 text-right font-medium text-muted-foreground">
								Credits
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Description
							</th>
						</tr>
					</thead>
					<tbody>
						{result.deposits.map((deposit) => (
							<tr
								key={deposit.id}
								className="border-b last:border-0 hover:bg-muted/30 transition-colors"
							>
								<td className="px-4 py-3 text-muted-foreground">
									{format(new Date(deposit.createdAt), "MMM d, yyyy")}
								</td>
								<td className="px-4 py-3">
									<Badge variant="info">{formatType(deposit.type)}</Badge>
								</td>
								<td className="px-4 py-3">
									<Badge variant={statusVariant(deposit.status)}>
										{deposit.status}
									</Badge>
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{deposit.amount
										? `$${Number(deposit.amount).toFixed(2)} ${deposit.currency.toUpperCase()}`
										: "—"}
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{deposit.creditAmount
										? `$${Number(deposit.creditAmount).toFixed(2)}`
										: "—"}
								</td>
								<td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
									{deposit.description ?? "—"}
								</td>
							</tr>
						))}
						{result.deposits.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									No transactions found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{result.pagination.totalPages > 1 && (
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<span>{result.pagination.total} total</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
						>
							Previous
						</Button>
						<span>
							{page} / {result.pagination.totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= result.pagination.totalPages}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
