"use client";

import { ArrowUpDown, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useState } from "react";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { ModelAnalyticsItem } from "@/lib/types";

type SortKey =
	| "logsCount"
	| "errorRate"
	| "cacheHitRate"
	| "avgTimeToFirstToken";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const numberFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
	style: "percent",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

function formatTtft(ms: number | null): string {
	if (ms === null || ms === undefined) {
		return "—";
	}
	return `${Math.round(ms)} ms`;
}

function SortButton({
	label,
	sortKey,
	currentKey,
	onClick,
}: {
	label: string;
	sortKey: SortKey;
	currentKey: SortKey;
	onClick: (k: SortKey) => void;
}) {
	const isActive = currentKey === sortKey;
	return (
		<button
			type="button"
			className={cn(
				"flex w-full items-center justify-end gap-1 text-xs font-medium select-none",
				isActive
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
			onClick={() => onClick(sortKey)}
		>
			{label}
			<ArrowUpDown
				className={cn("h-3 w-3", isActive ? "opacity-100" : "opacity-40")}
			/>
		</button>
	);
}

interface ModelStatsTableProps {
	models: ModelAnalyticsItem[];
}

export function ModelStatsTable({ models }: ModelStatsTableProps) {
	const [sortKey, setSortKey] = useState<SortKey>("logsCount");
	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [page, setPage] = useState(1);

	const handleSort = (key: SortKey) => {
		if (key === sortKey) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("desc");
		}
		setPage(1);
	};

	const filtered = models;

	const sorted = [...filtered].sort((a, b) => {
		const aVal = a[sortKey] ?? -1;
		const bVal = b[sortKey] ?? -1;
		return sortDir === "asc"
			? (aVal as number) - (bVal as number)
			: (bVal as number) - (aVal as number);
	});

	// Active models stay on top when not sorting by traffic explicitly
	const withTraffic = sorted.filter((m) => m.logsCount > 0);
	const noTraffic = sorted.filter((m) => m.logsCount === 0);
	const ordered =
		sortKey === "logsCount" ? sorted : [...withTraffic, ...noTraffic];

	const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const pageRows = ordered.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	return (
		<div className="rounded-xl border border-border/60 overflow-hidden">
			<div className="px-5 py-4 border-b border-border/60 flex items-center justify-between flex-wrap gap-3">
				<div>
					<h2 className="text-sm font-semibold">Model Performance</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						All-time stats per model from pre-aggregated counters
					</p>
				</div>
				<span className="text-xs text-muted-foreground">
					{models.length} models
				</span>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border/60 bg-muted/30">
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Model
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Family
							</th>
							<th className="px-4 py-3 text-right">
								<SortButton
									label="Requests"
									sortKey="logsCount"
									currentKey={sortKey}
									onClick={handleSort}
								/>
							</th>
							<th className="px-4 py-3 text-right">
								<SortButton
									label="Error Rate"
									sortKey="errorRate"
									currentKey={sortKey}
									onClick={handleSort}
								/>
							</th>
							<th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
								<span className="flex items-center justify-end gap-1">
									Error Breakdown
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-3 w-3 cursor-help text-muted-foreground/60" />
										</TooltipTrigger>
										<TooltipContent side="top" className="text-left">
											<p className="font-semibold mb-1">Error types</p>
											<p className="text-blue-400">C — Client error</p>
											<p className="text-yellow-400">G — Gateway error</p>
											<p className="text-red-400">U — Upstream error</p>
										</TooltipContent>
									</Tooltip>
								</span>
							</th>
							<th className="px-4 py-3 text-right">
								<SortButton
									label="Cache Rate"
									sortKey="cacheHitRate"
									currentKey={sortKey}
									onClick={handleSort}
								/>
							</th>
							<th className="px-4 py-3 text-right">
								<SortButton
									label="Avg TTFT"
									sortKey="avgTimeToFirstToken"
									currentKey={sortKey}
									onClick={handleSort}
								/>
							</th>
						</tr>
					</thead>
					<tbody>
						{pageRows.map((model) => {
							const isHighError = model.errorRate > 0.05;
							const isMidError = model.errorRate > 0.01;
							return (
								<tr
									key={model.id}
									className={cn(
										"border-b border-border/40 last:border-0 hover:bg-muted/20",
										model.logsCount === 0 && "opacity-40",
									)}
								>
									<td className="px-4 py-3 font-mono text-xs">{model.id}</td>
									<td className="px-4 py-3 text-xs text-muted-foreground capitalize">
										{model.family}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-xs">
										{numberFormatter.format(model.logsCount)}
									</td>
									<td
										className={cn(
											"px-4 py-3 text-right tabular-nums text-xs font-medium",
											isHighError && "text-red-400",
											isMidError && !isHighError && "text-yellow-400",
											!isMidError && model.logsCount > 0 && "text-emerald-400",
										)}
									>
										{model.logsCount > 0
											? percentFormatter.format(model.errorRate)
											: "—"}
									</td>
									<td className="px-4 py-3 text-right">
										{model.logsCount > 0 ? (
											<div className="flex items-center justify-end gap-2 text-xs text-muted-foreground whitespace-nowrap">
												<span title="Client errors" className="text-sky-400">
													C:{model.clientErrorsCount}
												</span>
												<span
													title="Gateway errors"
													className="text-yellow-400"
												>
													G:{model.gatewayErrorsCount}
												</span>
												<span title="Upstream errors" className="text-red-400">
													U:{model.upstreamErrorsCount}
												</span>
											</div>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">
										{model.logsCount > 0
											? percentFormatter.format(model.cacheHitRate)
											: "—"}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">
										{formatTtft(model.avgTimeToFirstToken)}
									</td>
								</tr>
							);
						})}
						{pageRows.length === 0 && (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-8 text-center text-xs text-muted-foreground"
								>
									No models found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			{totalPages > 1 && (
				<div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						{(safePage - 1) * PAGE_SIZE + 1}–
						{Math.min(safePage * PAGE_SIZE, ordered.length)} of {ordered.length}
					</span>
					<div className="flex items-center gap-1">
						<button
							type="button"
							disabled={safePage === 1}
							onClick={() => setPage((p) => p - 1)}
							className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<ChevronLeft className="h-3.5 w-3.5" />
						</button>
						<span className="px-2 text-xs tabular-nums text-muted-foreground">
							{safePage} / {totalPages}
						</span>
						<button
							type="button"
							disabled={safePage === totalPages}
							onClick={() => setPage((p) => p + 1)}
							className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<ChevronRight className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
