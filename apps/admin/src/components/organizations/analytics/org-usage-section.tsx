"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrgUsage } from "@/hooks/use-org-section-query";
import { cn } from "@/lib/utils";

import type { OrgUsageResponse, OrgUsageMonth } from "@/lib/types";

type Metric = "requests" | "tokens" | "inputTokens" | "outputTokens" | "cost";

interface OrgUsageSectionProps {
	orgId: string;
	initialData: OrgUsageResponse;
	compact?: boolean;
}

function formatNumber(n: number): string {
	if (n >= 1_000_000) {
		return `${(n / 1_000_000).toFixed(1)}M`;
	}
	if (n >= 1_000) {
		return `${(n / 1_000).toFixed(1)}K`;
	}
	return n.toString();
}

function formatAxisLabel(n: number, metric: Metric): string {
	if (metric === "cost") {
		return `$${n >= 1 ? n.toFixed(0) : n.toFixed(3)}`;
	}
	return formatNumber(n);
}

function getMetricValue(m: OrgUsageMonth, metric: Metric): number {
	if (metric === "tokens") {
		return m.totalTokens;
	}
	if (metric === "inputTokens") {
		return m.promptTokens;
	}
	if (metric === "outputTokens") {
		return m.completionTokens + m.reasoningTokens;
	}
	if (metric === "cost") {
		return m.cost;
	}
	return m.requests;
}

function monthLabel(ym: string): string {
	return new Date(`${ym}-01`).toLocaleDateString("en", {
		month: "short",
		year: "2-digit",
	});
}

const CHART_HEIGHT = 200;
const Y_TICKS = 4;
const BAR_WIDTH = 40;
const BAR_GAP = 8;
const MIN_CHART_WIDTH = 320;

interface BarChartProps {
	months: OrgUsageMonth[];
	metric: Metric;
}

function BarTooltip({ month }: { month: OrgUsageMonth }) {
	return (
		<div className="bg-popover text-popover-foreground border border-border rounded-md shadow-md px-3 py-2 text-xs whitespace-nowrap">
			<p className="font-semibold mb-1.5">{monthLabel(month.month)}</p>
			<div className="flex flex-col gap-0.5">
				<p className="text-muted-foreground">
					Requests:{" "}
					<span className="text-foreground font-medium tabular-nums">
						{month.requests.toLocaleString()}
					</span>
				</p>
				<p className="text-muted-foreground">
					Tokens:{" "}
					<span className="text-foreground font-medium tabular-nums">
						{formatNumber(month.totalTokens)}
					</span>
				</p>
				<p className="text-muted-foreground">
					Cost:{" "}
					<span className="text-foreground font-medium tabular-nums">
						${month.cost.toFixed(4)}
					</span>
				</p>
			</div>
		</div>
	);
}

function BarChart({ months, metric }: BarChartProps) {
	const [hovered, setHovered] = useState<number | null>(null);

	const values = months.map((m) => getMetricValue(m, metric));
	const maxVal = Math.max(...values, 1);

	const tickValues = Array.from(
		{ length: Y_TICKS + 1 },
		(_, i) => (maxVal / Y_TICKS) * (Y_TICKS - i),
	);

	// Chart body width: each bar gets exactly BAR_WIDTH px, total is capped below MIN_CHART_WIDTH
	const chartBodyWidth = Math.max(
		MIN_CHART_WIDTH,
		months.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP,
	);

	return (
		<div className="flex gap-3 select-none">
			{/* Y-axis labels */}
			<div
				className="flex flex-col justify-between text-right shrink-0 w-10"
				style={{ height: CHART_HEIGHT }}
			>
				{tickValues.map((v, i) => (
					<span
						key={i}
						className="text-[10px] text-muted-foreground leading-none"
					>
						{formatAxisLabel(v, metric)}
					</span>
				))}
			</div>

			{/* Scrollable chart body */}
			<div className="flex-1 overflow-x-auto">
				<div
					className="relative"
					style={{ width: chartBodyWidth, height: CHART_HEIGHT + 24 }}
				>
					{/* Tooltip — rendered at chart body level to avoid overflow clipping */}
					{hovered !== null && (
						<div
							className="absolute top-2 z-20 pointer-events-none"
							style={{
								left: Math.max(
									4,
									hovered * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2 - 80,
								),
							}}
						>
							<BarTooltip month={months[hovered]} />
						</div>
					)}

					{/* Grid lines — span the full chart body width */}
					{tickValues.map((_, i) => (
						<div
							key={i}
							className="absolute left-0 right-0 border-t border-dashed border-border/40 pointer-events-none"
							style={{
								top: `${(i / Y_TICKS) * (CHART_HEIGHT / (CHART_HEIGHT + 24)) * 100}%`,
							}}
						/>
					))}

					{/* Bars row */}
					<div
						className="absolute left-0 bottom-6 flex items-end"
						style={{ gap: BAR_GAP, height: CHART_HEIGHT }}
					>
						{months.map((m, i) => {
							const heightPct = (values[i] / maxVal) * 100;
							const isHovered = hovered === i;

							return (
								<div
									key={m.month}
									className="relative flex flex-col items-center justify-end shrink-0"
									style={{ width: BAR_WIDTH, height: "100%" }}
									onMouseEnter={() => setHovered(i)}
									onMouseLeave={() => setHovered(null)}
								>
									<div
										className={cn(
											"w-full rounded-t-sm transition-colors duration-100 cursor-default",
											isHovered
												? "bg-primary"
												: "bg-primary/60 hover:bg-primary/80",
										)}
										style={{ height: `${Math.max(heightPct, 1.5)}%` }}
									/>
								</div>
							);
						})}
					</div>

					{/* X-axis labels */}
					<div
						className="absolute bottom-0 left-0 flex"
						style={{ gap: BAR_GAP }}
					>
						{months.map((m) => (
							<div
								key={m.month}
								className="shrink-0 text-center"
								style={{ width: BAR_WIDTH }}
							>
								<span className="text-[10px] text-muted-foreground leading-none">
									{monthLabel(m.month)}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export function OrgUsageSection({
	orgId,
	initialData,
	compact = false,
}: OrgUsageSectionProps) {
	const [months, setMonths] = useState(12);
	const [metric, setMetric] = useState<Metric>("requests");

	const { data } = useOrgUsage(orgId, months);
	const result = data ?? initialData;

	const metricLabel: Record<Metric, string> = {
		requests: "Requests",
		tokens: "Total Tokens",
		inputTokens: "Input Tokens",
		outputTokens: "Output Tokens",
		cost: "Cost",
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Stat cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				{(
					[
						{
							label: "Total Requests",
							value: formatNumber(result.totals.requests),
							sub: undefined,
							m: "requests" as Metric,
						},
						{
							label: "Total Tokens",
							value: formatNumber(result.totals.totalTokens),
							sub: undefined,
							m: "tokens" as Metric,
						},
						{
							label: "Input Tokens",
							value: formatNumber(result.totals.promptTokens),
							sub: undefined,
							m: "inputTokens" as Metric,
						},
						{
							label: "Output Tokens",
							value: formatNumber(
								result.totals.completionTokens + result.totals.reasoningTokens,
							),
							sub:
								result.totals.reasoningTokens > 0
									? `Includes ${formatNumber(result.totals.reasoningTokens)} reasoning tokens`
									: undefined,
							m: "outputTokens" as Metric,
						},
						{
							label: "Total Cost",
							value: `$${result.totals.cost.toFixed(4)}`,
							sub: undefined,
							m: "cost" as Metric,
						},
					] as const
				).map(({ label, value, sub, m }) => (
					<Card
						key={label}
						className={cn(
							"cursor-default transition-colors",
							m && metric === m && "ring-1 ring-primary bg-primary/5",
							m && "cursor-pointer hover:bg-muted/50",
						)}
						onClick={() => m && setMetric(m)}
					>
						<CardHeader className="pb-1 pt-3 px-4">
							<CardTitle className="text-xs font-medium text-muted-foreground">
								{label}
							</CardTitle>
						</CardHeader>
						<CardContent className="pb-3 px-4">
							<div className="flex items-center gap-1.5">
								<span className="text-xl font-bold tabular-nums">{value}</span>
								{sub && (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-help" />
											</TooltipTrigger>
											<TooltipContent side="top" className="text-xs">
												{sub}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Chart */}
			{result.months.length > 0 ? (
				<Card>
					<CardHeader className="pb-3 flex flex-row items-center justify-between">
						<CardTitle className="text-sm font-medium">
							{metricLabel[metric]} by Month
						</CardTitle>
						{!compact && (
							<Select
								value={String(months)}
								onValueChange={(v) => setMonths(Number(v))}
							>
								<SelectTrigger className="h-7 w-28 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="3">Last 3 mo</SelectItem>
									<SelectItem value="6">Last 6 mo</SelectItem>
									<SelectItem value="12">Last 12 mo</SelectItem>
									<SelectItem value="24">Last 24 mo</SelectItem>
								</SelectContent>
							</Select>
						)}
					</CardHeader>
					<CardContent className="pt-0">
						<BarChart months={result.months} metric={metric} />
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground text-sm">
						No usage data for this period
					</CardContent>
				</Card>
			)}

			{/* Breakdown table */}
			{!compact && result.months.length > 0 && (
				<div className="rounded-md border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-2 text-left font-medium text-muted-foreground">
									Month
								</th>
								<th className="px-4 py-2 text-right font-medium text-muted-foreground">
									Requests
								</th>
								<th className="px-4 py-2 text-right font-medium text-muted-foreground">
									Input Tokens
								</th>
								<th className="px-4 py-2 text-right font-medium text-muted-foreground">
									Output Tokens
								</th>
								<th className="px-4 py-2 text-right font-medium text-muted-foreground">
									Cost
								</th>
							</tr>
						</thead>
						<tbody>
							{result.months.map((m) => (
								<tr
									key={m.month}
									className="border-b last:border-0 hover:bg-muted/30"
								>
									<td className="px-4 py-2">{monthLabel(m.month)}</td>
									<td className="px-4 py-2 text-right tabular-nums">
										{m.requests.toLocaleString()}
									</td>
									<td className="px-4 py-2 text-right tabular-nums">
										{m.promptTokens.toLocaleString()}
									</td>
									<td className="px-4 py-2 text-right tabular-nums">
										<div className="flex items-center justify-end gap-1.5">
											<span>
												{(
													m.completionTokens + m.reasoningTokens
												).toLocaleString()}
											</span>
											{m.reasoningTokens > 0 && (
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-help" />
														</TooltipTrigger>
														<TooltipContent side="top" className="text-xs">
															Includes {m.reasoningTokens.toLocaleString()}{" "}
															reasoning tokens
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											)}
										</div>
									</td>
									<td className="px-4 py-2 text-right tabular-nums">
										${m.cost.toFixed(4)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
