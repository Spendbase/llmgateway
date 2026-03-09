import { RequestVolumeChart } from "./request-volume-chart";
import { RevenueTrendChart } from "./revenue-trend-chart";

import type { AnalyticsWindow } from "@/lib/analytics-constants";
import type { TimeSeriesAnalyticsResponse } from "@/lib/types";

interface TimeSeriesSectionProps {
	initialData: TimeSeriesAnalyticsResponse;
	initialWindow: AnalyticsWindow;
}

export function TimeSeriesSection({
	initialData,
	initialWindow,
}: TimeSeriesSectionProps): React.ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<RequestVolumeChart
				initialSeries={initialData.series}
				window={initialWindow}
			/>
			<RevenueTrendChart
				initialRevenueTrend={initialData.revenueTrend}
				window={initialWindow}
			/>
		</div>
	);
}
