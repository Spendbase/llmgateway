import { Suspense } from "react";

import { ModelStatsTable } from "@/components/analytics/model-stats-table";
import { PlatformKpiCards } from "@/components/analytics/platform-kpi-cards";
import { ProviderHealthGrid } from "@/components/analytics/provider-health-grid";
import { RangePicker } from "@/components/analytics/range-picker";
import { TimeSeriesSection } from "@/components/analytics/time-series-section";
import SignInPrompt from "@/components/auth/sign-in-prompt";
import {
	getAdminPlatformAnalytics,
	rangeToWindow,
} from "@/lib/admin-platform-analytics";
import { getAdminTimeSeries } from "@/lib/admin-time-series";

import type { AnalyticsRange } from "@/lib/admin-platform-analytics";

const VALID_RANGES: AnalyticsRange[] = ["24h", "7d", "30d", "90d", "all"];

export default async function AnalyticsPage({
	searchParams,
}: {
	searchParams?: Promise<{ range?: string }>;
}) {
	const params = await searchParams;
	const range = (
		VALID_RANGES.includes(params?.range as AnalyticsRange)
			? params!.range
			: "all"
	) as AnalyticsRange;

	const window = rangeToWindow(range);

	const [platform, timeSeries] = await Promise.all([
		getAdminPlatformAnalytics(range),
		getAdminTimeSeries(window),
	]);

	if (!platform) {
		return <SignInPrompt />;
	}

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
			<header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Global Analytics
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Platform-wide stats — models, providers, traffic, and revenue.
					</p>
				</div>
				<Suspense>
					<RangePicker current={range} />
				</Suspense>
			</header>

			<PlatformKpiCards
				models={platform.models}
				providers={platform.providers}
			/>

			{timeSeries ? (
				<Suspense>
					<TimeSeriesSection initialData={timeSeries} initialWindow={window} />
				</Suspense>
			) : (
				<div className="rounded-xl border border-border/60 px-5 py-8 text-center text-sm text-muted-foreground">
					Time series data unavailable — ensure the API server is running with
					the latest changes.
				</div>
			)}

			<ModelStatsTable models={platform.models} />

			<ProviderHealthGrid providers={platform.providers} />
		</div>
	);
}
