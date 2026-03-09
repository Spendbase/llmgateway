import { fetchServerData } from "./server-api";

import type { AnalyticsRange } from "./analytics-constants";
import type { PlatformAnalyticsResponse } from "./types";

export type { AnalyticsRange } from "./analytics-constants";
export { ANALYTICS_RANGE_OPTIONS, rangeToWindow } from "./analytics-constants";

export async function getAdminPlatformAnalytics(
	range: AnalyticsRange = "all",
): Promise<PlatformAnalyticsResponse | null> {
	return await fetchServerData<PlatformAnalyticsResponse>(
		"GET",
		"/admin/analytics/platform",
		{ params: { query: { range } } },
	);
}
