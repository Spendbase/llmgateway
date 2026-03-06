"use client";

import { format } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";

import { CustomBadge as Badge } from "@/components/ui/custom-badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useOrgApiKeys } from "@/hooks/use-org-section-query";

import type { OrgApiKeysResponse } from "@/lib/types";

interface OrgApiKeysSectionProps {
	orgId: string;
	initialData: OrgApiKeysResponse;
}

function statusVariant(status: string) {
	if (status === "active") {
		return "success";
	}
	if (status === "deleted") {
		return "error";
	}
	return "warning";
}

export function OrgApiKeysSection({
	orgId,
	initialData,
}: OrgApiKeysSectionProps) {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<
		"all" | "active" | "inactive" | "deleted"
	>("all");
	const debouncedSearch = useDebounce(search, 300);

	const { data, isFetching } = useOrgApiKeys(
		orgId,
		page,
		20,
		status === "all" ? undefined : status,
		debouncedSearch || undefined,
	);

	const result = data ?? initialData;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-xs">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder="Search by description..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>
				<Select
					value={status}
					onValueChange={(v) => {
						setStatus(v as typeof status);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
						<SelectItem value="deleted">Deleted</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Description
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Project
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Status
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Created
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Last Used
							</th>
							<th className="px-4 py-3 text-right font-medium text-muted-foreground">
								Spend / Limit
							</th>
						</tr>
					</thead>
					<tbody>
						{isFetching && result.items.length === 0
							? Array.from({ length: 5 }).map((_, i) => (
									<tr key={i} className="border-b">
										<td colSpan={6} className="px-4 py-3">
											<Skeleton className="h-4 w-full" />
										</td>
									</tr>
								))
							: result.items.map((key) => (
									<tr
										key={key.id}
										className="border-b last:border-0 hover:bg-muted/30 transition-colors"
									>
										<td className="px-4 py-3 font-mono text-xs">
											{key.description ?? (
												<span className="text-muted-foreground italic">
													No description
												</span>
											)}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{key.projectName ?? key.projectId}
										</td>
										<td className="px-4 py-3">
											<Badge variant={statusVariant(key.status)}>
												{key.status}
											</Badge>
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{format(new Date(key.createdAt), "MMM d, yyyy")}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{key.lastUsedAt
												? format(new Date(key.lastUsedAt), "MMM d, yyyy")
												: "—"}
										</td>
										<td className="px-4 py-3 text-right tabular-nums">
											{key.usage !== null
												? `$${Number(key.usage).toFixed(4)}`
												: "—"}
											{key.usageLimit !== null ? (
												<span className="text-muted-foreground">
													{" / "}${Number(key.usageLimit).toFixed(2)}
												</span>
											) : null}
										</td>
									</tr>
								))}
						{!isFetching && result.items.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									No API keys found
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
						<button
							className="px-2 py-1 rounded border text-xs disabled:opacity-40"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
						>
							Previous
						</button>
						<span>
							{page} / {result.pagination.totalPages}
						</span>
						<button
							className="px-2 py-1 rounded border text-xs disabled:opacity-40"
							disabled={page >= result.pagination.totalPages}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
