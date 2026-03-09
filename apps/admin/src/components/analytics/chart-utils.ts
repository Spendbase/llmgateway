import type {
	AnalyticsGranularity,
	AnalyticsWindow,
} from "@/lib/analytics-constants";

export const windowLabels: Record<AnalyticsWindow, string> = {
	"6h": "6 hours",
	"24h": "24 hours",
	"7d": "7 days",
	"30d": "30 days",
	"90d": "90 days",
	all: "all time",
};

/** Appends T12:00:00 to a plain date string (YYYY-MM-DD) to avoid midnight UTC→local timezone shift. */
export function dateToNoon(date: string): string {
	return `${date}T12:00:00`;
}

export function formatCompact(n: number): string {
	if (n >= 1_000_000) {
		return `${(n / 1_000_000).toFixed(1)}M`;
	}
	if (n >= 1_000) {
		return `${(n / 1_000).toFixed(1)}K`;
	}
	return n.toString();
}

export function formatAxisLabel(
	ts: string,
	granularity: AnalyticsGranularity,
): string {
	const d = new Date(ts);
	switch (granularity) {
		case "month":
			return d.toLocaleDateString("en", { month: "short", year: "2-digit" });
		case "week":
		case "day":
		case "hour":
			return d.toLocaleDateString("en", { month: "short", day: "numeric" });
		case "minute":
			return d.toLocaleTimeString("en", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
	}
}

export function formatTooltipLabel(
	ts: string,
	granularity: AnalyticsGranularity,
): string {
	const d = new Date(ts);
	switch (granularity) {
		case "month":
			return d.toLocaleDateString("en", { month: "long", year: "numeric" });
		case "week": {
			const end = new Date(d);
			end.setDate(end.getDate() + 6);
			const startStr = d.toLocaleDateString("en", {
				month: "short",
				day: "numeric",
			});
			const endStr =
				end.getMonth() === d.getMonth()
					? end.toLocaleDateString("en", { day: "numeric" })
					: end.toLocaleDateString("en", { month: "short", day: "numeric" });
			return `${startStr} – ${endStr}`;
		}
		case "day":
			return d.toLocaleDateString("en", {
				weekday: "short",
				month: "short",
				day: "numeric",
			});
		case "hour":
			return d.toLocaleDateString("en", {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
		case "minute":
			return d.toLocaleTimeString("en", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
	}
}
