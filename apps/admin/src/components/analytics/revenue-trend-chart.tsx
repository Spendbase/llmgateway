"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { DEFAULT_GRANULARITY } from "@/lib/analytics-constants";
import { useApi } from "@/lib/fetch-client";
import { cn } from "@/lib/utils";

import {
	windowLabels,
	formatAxisLabel,
	formatTooltipLabel,
	dateToNoon,
} from "./chart-utils";
import { GranularityPicker } from "./granularity-picker";

import type { ChartConfig } from "@/components/ui/chart";
import type {
	AnalyticsGranularity,
	AnalyticsWindow,
} from "@/lib/analytics-constants";
import type { RevenueTrendPoint } from "@/lib/types";
import type { TooltipProps } from "recharts";

const chartConfig = {
	creditTopups: { label: "Credits", color: "#0ea5e9" },
} satisfies ChartConfig;

function CustomTooltip({
	active,
	payload,
	label,
	granularity,
}: TooltipProps<number, string> & { granularity: AnalyticsGranularity }) {
	if (!active || !payload?.length) {
		return null;
	}
	const credits =
		(payload.find((p) => p.dataKey === "creditTopups")?.value as number) ?? 0;

	return (
		<div className="bg-popover text-popover-foreground border border-border rounded-md shadow-md px-3 py-2 text-xs whitespace-nowrap">
			<p className="font-semibold mb-1.5">
				{formatTooltipLabel(dateToNoon(label as string), granularity)}
			</p>
			<div className="flex flex-col gap-0.5">
				<p className="text-muted-foreground">
					Credits:{" "}
					<span className="font-medium" style={{ color: "#0ea5e9" }}>
						${credits.toFixed(2)}
					</span>
				</p>
			</div>
		</div>
	);
}

interface RevenueTrendChartProps {
	initialRevenueTrend: RevenueTrendPoint[];
	window: AnalyticsWindow;
}

export function RevenueTrendChart({
	initialRevenueTrend,
	window,
}: RevenueTrendChartProps): React.ReactElement {
	const [granularity, setGranularity] = useState<AnalyticsGranularity>(
		DEFAULT_GRANULARITY[window],
	);

	useEffect(() => {
		setGranularity(DEFAULT_GRANULARITY[window]);
	}, [window]);

	const api = useApi();
	const { data, isFetching } = api.useQuery(
		"get",
		"/admin/analytics/time-series",
		{ params: { query: { window, granularity } } },
		{ staleTime: 30_000 },
	);

	const revenueTrend = data?.revenueTrend ?? initialRevenueTrend;

	return (
		<div className="rounded-xl border border-border/60 overflow-hidden">
			<div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
				<div>
					<h2 className="text-sm font-semibold">Revenue Trend</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						Last {windowLabels[window]} — credit top-ups
					</p>
				</div>
				<GranularityPicker
					window={window}
					value={granularity}
					onChange={setGranularity}
				/>
			</div>

			<div
				className={cn(
					"px-2 pt-2 pb-4 transition-opacity",
					isFetching && "opacity-60",
				)}
			>
				{revenueTrend.length === 0 ? (
					<div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
						No revenue data for this period
					</div>
				) : (
					<ChartContainer config={chartConfig} className="h-[220px] w-full">
						<AreaChart
							data={revenueTrend}
							margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="rt-fillCredits" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
									<stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickFormatter={(v) =>
									formatAxisLabel(dateToNoon(v), granularity)
								}
								interval="preserveStartEnd"
								minTickGap={40}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={(v: number) =>
									`$${v >= 1 ? v.toFixed(0) : v.toFixed(2)}`
								}
								width={48}
							/>
							<ChartTooltip
								content={<CustomTooltip granularity={granularity} />}
							/>
							<Area
								dataKey="creditTopups"
								stroke="#0ea5e9"
								strokeWidth={2}
								fill="url(#rt-fillCredits)"
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</div>

			<div className="px-5 py-2 border-t border-border/40 flex items-center gap-4 text-xs text-muted-foreground">
				<span className="flex items-center gap-1">
					<span
						className="inline-block h-2.5 w-2.5 rounded-sm"
						style={{ background: "#0ea5e9" }}
					/>
					Credit top-ups
				</span>
			</div>
		</div>
	);
}
