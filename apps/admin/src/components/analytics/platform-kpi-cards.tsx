import { Activity, Database, Gauge, Server } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ModelAnalyticsItem, ProviderAnalyticsItem } from "@/lib/types";

const numberFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
	style: "percent",
	maximumFractionDigits: 2,
});

function MetricCard({
	label,
	value,
	subtitle,
	icon,
	accent,
}: {
	label: string;
	value: string;
	subtitle?: string;
	icon: React.ReactNode;
	accent?: "green" | "blue" | "purple" | "red";
}) {
	return (
		<div className="bg-card text-card-foreground flex flex-col justify-between gap-3 rounded-xl border border-border/60 p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					<p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
					{subtitle ? (
						<p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
					) : null}
				</div>
				<div
					className={cn(
						"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs",
						accent === "green" &&
							"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
						accent === "blue" && "border-sky-500/30 bg-sky-500/10 text-sky-400",
						accent === "purple" &&
							"border-violet-500/30 bg-violet-500/10 text-violet-400",
						accent === "red" && "border-red-500/30 bg-red-500/10 text-red-400",
						!accent && "border-border bg-muted/30 text-muted-foreground",
					)}
				>
					{icon}
				</div>
			</div>
		</div>
	);
}

interface PlatformKpiCardsProps {
	models: ModelAnalyticsItem[];
	providers: ProviderAnalyticsItem[];
}

export function PlatformKpiCards({ models, providers }: PlatformKpiCardsProps) {
	const totalRequests = models.reduce((s, m) => s + m.logsCount, 0);
	const totalErrors = models.reduce((s, m) => s + m.errorsCount, 0);
	const totalCached = models.reduce((s, m) => s + m.cachedCount, 0);

	const globalErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
	const globalCacheRate = totalRequests > 0 ? totalCached / totalRequests : 0;

	const activeModels = models.filter(
		(m) => m.status === "active" && m.logsCount > 0,
	);
	const weightedTtftSum = activeModels.reduce(
		(s, m) =>
			m.avgTimeToFirstToken !== null && m.avgTimeToFirstToken !== undefined
				? s + m.avgTimeToFirstToken * m.logsCount
				: s,
		0,
	);
	const weightedTtftTotal = activeModels.reduce(
		(s, m) =>
			m.avgTimeToFirstToken !== null && m.avgTimeToFirstToken !== undefined
				? s + m.logsCount
				: s,
		0,
	);
	const avgTtft =
		weightedTtftTotal > 0 ? weightedTtftSum / weightedTtftTotal : null;

	const activeProviders = providers.filter((p) => p.logsCount > 0).length;

	return (
		<section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<MetricCard
				label="Total Requests"
				value={numberFormatter.format(totalRequests)}
				subtitle="All-time across all models"
				icon={<Activity className="h-4 w-4" />}
				accent="blue"
			/>
			<MetricCard
				label="Global Error Rate"
				value={percentFormatter.format(globalErrorRate)}
				subtitle="Errors / total requests (all-time)"
				icon={<Gauge className="h-4 w-4" />}
				accent={
					globalErrorRate > 0.05
						? "red"
						: globalErrorRate > 0.01
							? "purple"
							: "green"
				}
			/>
			<MetricCard
				label="Cache Hit Rate"
				value={percentFormatter.format(globalCacheRate)}
				subtitle="Cached responses / total requests"
				icon={<Database className="h-4 w-4" />}
				accent="blue"
			/>
			<MetricCard
				label="Avg TTFT"
				value={
					avgTtft !== null && avgTtft !== undefined
						? `${Math.round(avgTtft)} ms`
						: "—"
				}
				subtitle={
					activeProviders > 0
						? `Weighted avg across ${activeProviders} active provider${activeProviders !== 1 ? "s" : ""}`
						: "No traffic data yet"
				}
				icon={<Server className="h-4 w-4" />}
				accent="purple"
			/>
		</section>
	);
}
