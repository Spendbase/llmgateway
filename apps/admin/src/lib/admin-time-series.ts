import { fetchServerData } from "./server-api";

import type { AnalyticsWindow } from "./analytics-constants";
import type { TimeSeriesAnalyticsResponse } from "./types";

export type { AnalyticsWindow } from "./analytics-constants";

export async function getAdminTimeSeries(
	window: AnalyticsWindow,
): Promise<TimeSeriesAnalyticsResponse | null> {
	return await fetchServerData<TimeSeriesAnalyticsResponse>(
		"GET",
		"/admin/analytics/time-series",
		{
			params: {
				query: { window },
			},
		},
	);
}
