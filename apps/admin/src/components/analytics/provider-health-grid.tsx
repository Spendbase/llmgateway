import { cn } from "@/lib/utils";

import type { ProviderAnalyticsItem } from "@/lib/types";

const numberFormatter = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
	style: "percent",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

interface ProviderHealthGridProps {
	providers: ProviderAnalyticsItem[];
}

export function ProviderHealthGrid({ providers }: ProviderHealthGridProps) {
	const withTraffic = providers
		.filter((p) => p.logsCount > 0)
		.sort((a, b) => b.logsCount - a.logsCount);

	const noTraffic = providers
		.filter((p) => p.logsCount === 0)
		.sort((a, b) => a.name.localeCompare(b.name));

	const all = [...withTraffic, ...noTraffic];

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-sm font-semibold">Provider Health</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						All-time error and cache stats per provider
					</p>
				</div>
				<span className="text-xs text-muted-foreground">
					{providers.length} providers
				</span>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{all.map((p) => {
					const isHighError = p.errorRate > 0.05;
					const isMidError = p.errorRate > 0.01;
					const hasTraffic = p.logsCount > 0;

					return (
						<div
							key={p.id}
							className={cn(
								"bg-card rounded-xl border p-4 flex flex-col gap-3",
								hasTraffic && isHighError && "border-red-500/40",
								hasTraffic &&
									isMidError &&
									!isHighError &&
									"border-yellow-500/40",
								hasTraffic && !isMidError && "border-emerald-500/30",
								!hasTraffic && "border-border/40 opacity-50",
							)}
						>
							<div className="flex items-start justify-between gap-2">
								<div>
									<p className="text-sm font-semibold">{p.name}</p>
									<p className="text-xs text-muted-foreground font-mono">
										{p.id}
									</p>
								</div>
							</div>

							<dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
								<div>
									<dt className="text-muted-foreground">Requests</dt>
									<dd className="font-medium tabular-nums mt-0.5">
										{hasTraffic ? numberFormatter.format(p.logsCount) : "—"}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Error Rate</dt>
									<dd
										className={cn(
											"font-medium tabular-nums mt-0.5",
											hasTraffic && isHighError && "text-red-400",
											hasTraffic &&
												isMidError &&
												!isHighError &&
												"text-yellow-400",
											hasTraffic && !isMidError && "text-emerald-400",
										)}
									>
										{hasTraffic ? percentFormatter.format(p.errorRate) : "—"}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Cache Rate</dt>
									<dd className="font-medium tabular-nums mt-0.5">
										{hasTraffic ? percentFormatter.format(p.cacheHitRate) : "—"}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Avg TTFT</dt>
									<dd className="font-medium tabular-nums mt-0.5">
										{p.avgTimeToFirstToken !== null &&
										p.avgTimeToFirstToken !== undefined
											? `${Math.round(p.avgTimeToFirstToken)} ms`
											: "—"}
									</dd>
								</div>
							</dl>

							{hasTraffic && (
								<div className="flex gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
									<span className="text-sky-400" title="Client errors">
										C:{p.clientErrorsCount}
									</span>
									<span className="text-yellow-400" title="Gateway errors">
										G:{p.gatewayErrorsCount}
									</span>
									<span className="text-red-400" title="Upstream errors">
										U:{p.upstreamErrorsCount}
									</span>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
