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
	formatCompact,
} from "./chart-utils";
import { GranularityPicker } from "./granularity-picker";

import type { ChartConfig } from "@/components/ui/chart";
import type {
	AnalyticsGranularity,
	AnalyticsWindow,
} from "@/lib/analytics-constants";
import type { TimeSeriesPoint } from "@/lib/types";
import type { TooltipProps } from "recharts";

const chartConfig = {
	logsCount: { label: "Total requests", color: "#6366f1" },
	errorsCount: { label: "Errors", color: "#ef4444" },
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
	const total =
		(payload.find((p) => p.dataKey === "logsCount")?.value as number) ?? 0;
	const errors =
		(payload.find((p) => p.dataKey === "errorsCount")?.value as number) ?? 0;
	const errorRate = total > 0 ? ((errors / total) * 100).toFixed(1) : "0.0";
	const cached =
		(payload.find((p) => p.dataKey === "cachedCount")?.value as number) ?? 0;

	return (
		<div className="bg-popover text-popover-foreground border border-border rounded-md shadow-md px-3 py-2 text-xs whitespace-nowrap">
			<p className="font-semibold mb-1.5">
				{formatTooltipLabel(label as string, granularity)}
			</p>
			<div className="flex flex-col gap-0.5">
				<p className="text-muted-foreground">
					Total:{" "}
					<span className="text-foreground font-medium tabular-nums">
						{total.toLocaleString()}
					</span>
				</p>
				<p className="text-muted-foreground">
					Errors:{" "}
					<span
						className="font-medium tabular-nums"
						style={{ color: "#ef4444" }}
					>
						{errors.toLocaleString()} ({errorRate}%)
					</span>
				</p>
				{cached > 0 && (
					<p className="text-muted-foreground">
						Cached:{" "}
						<span className="text-foreground font-medium tabular-nums">
							{cached.toLocaleString()}
						</span>
					</p>
				)}
			</div>
		</div>
	);
}

interface RequestVolumeChartProps {
	initialSeries: TimeSeriesPoint[];
	window: AnalyticsWindow;
}

export function RequestVolumeChart({
	initialSeries,
	window,
}: RequestVolumeChartProps): React.ReactElement {
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

	const series = data?.series ?? initialSeries;

	return (
		<div className="rounded-xl border border-border/60 overflow-hidden">
			<div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
				<div>
					<h2 className="text-sm font-semibold">Request Volume</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						Requests and errors — last {windowLabels[window]}
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
				{series.length === 0 ? (
					<div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
						No traffic data for this period
					</div>
				) : (
					<ChartContainer config={chartConfig} className="h-[220px] w-full">
						<AreaChart
							data={series}
							margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="rv-fillSuccess" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
								</linearGradient>
								<linearGradient id="rv-fillErrors" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
									<stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="timestamp"
								tickLine={false}
								axisLine={false}
								tickFormatter={(v) => formatAxisLabel(v, granularity)}
								interval="preserveStartEnd"
								minTickGap={40}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={formatCompact}
								width={42}
							/>
							<ChartTooltip
								content={<CustomTooltip granularity={granularity} />}
							/>
							<Area
								dataKey="logsCount"
								stroke="#6366f1"
								strokeWidth={2}
								fill="url(#rv-fillSuccess)"
							/>
							<Area
								dataKey="errorsCount"
								stroke="#ef4444"
								strokeWidth={2}
								fill="url(#rv-fillErrors)"
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</div>

			<div className="px-5 py-2 border-t border-border/40 flex items-center gap-4 text-xs text-muted-foreground">
				<span className="flex items-center gap-1">
					<span
						className="inline-block h-2.5 w-2.5 rounded-sm"
						style={{ background: "#6366f1" }}
					/>
					Total requests
				</span>
				<span className="flex items-center gap-1">
					<span
						className="inline-block h-2.5 w-2.5 rounded-sm"
						style={{ background: "#ef4444" }}
					/>
					Errors
				</span>
			</div>
		</div>
	);
}
