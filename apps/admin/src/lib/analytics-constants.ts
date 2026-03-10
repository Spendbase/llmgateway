export type AnalyticsRange = "12h" | "24h" | "7d" | "30d" | "90d" | "all";
export type AnalyticsWindow =
	| "6h"
	| "12h"
	| "24h"
	| "7d"
	| "30d"
	| "90d"
	| "all";
export type AnalyticsGranularity = "minute" | "hour" | "day" | "week" | "month";

export const ANALYTICS_RANGE_OPTIONS: {
	value: AnalyticsRange;
	label: string;
}[] = [
	{ value: "12h", label: "12h" },
	{ value: "24h", label: "24h" },
	{ value: "7d", label: "7d" },
	{ value: "30d", label: "30d" },
	{ value: "90d", label: "90d" },
	{ value: "all", label: "All time" },
];

export const GRANULARITY_LABELS: Record<AnalyticsGranularity, string> = {
	minute: "1m",
	hour: "1h",
	day: "1d",
	week: "1w",
	month: "1mo",
};

export const GRANULARITY_OPTIONS_PER_WINDOW: Record<
	AnalyticsWindow,
	AnalyticsGranularity[]
> = {
	"6h": ["minute", "hour"],
	"12h": ["minute", "hour"],
	"24h": ["minute", "hour"],
	"7d": ["hour", "day"],
	"30d": ["hour", "day"],
	"90d": ["day", "week"],
	all: ["hour", "day", "week", "month"],
};

export const DEFAULT_GRANULARITY: Record<
	AnalyticsWindow,
	AnalyticsGranularity
> = {
	"6h": "hour",
	"12h": "hour",
	"24h": "hour",
	"7d": "hour",
	"30d": "day",
	"90d": "week",
	all: "month",
};

export function rangeToWindow(range: AnalyticsRange): AnalyticsWindow {
	return range;
}
