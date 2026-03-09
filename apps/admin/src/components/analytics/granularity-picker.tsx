"use client";

import {
	GRANULARITY_LABELS,
	GRANULARITY_OPTIONS_PER_WINDOW,
} from "@/lib/analytics-constants";
import { cn } from "@/lib/utils";

import type {
	AnalyticsGranularity,
	AnalyticsWindow,
} from "@/lib/analytics-constants";

interface GranularityPickerProps {
	window: AnalyticsWindow;
	value: AnalyticsGranularity;
	onChange: (g: AnalyticsGranularity) => void;
}

export function GranularityPicker({
	window,
	value,
	onChange,
}: GranularityPickerProps): React.ReactElement {
	const options = GRANULARITY_OPTIONS_PER_WINDOW[window];
	return (
		<div className="flex items-center gap-0.5 rounded-md border border-border/60 p-0.5 bg-muted/30">
			{options.map((g) => (
				<button
					key={g}
					onClick={() => onChange(g)}
					className={cn(
						"px-2 py-0.5 rounded text-xs font-medium transition-colors",
						g === value
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{GRANULARITY_LABELS[g]}
				</button>
			))}
		</div>
	);
}
