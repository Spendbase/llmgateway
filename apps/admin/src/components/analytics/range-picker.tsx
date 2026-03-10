"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ANALYTICS_RANGE_OPTIONS } from "@/lib/analytics-constants";
import { cn } from "@/lib/utils";

import type { AnalyticsRange } from "@/lib/analytics-constants";

interface RangePickerProps {
	current: AnalyticsRange;
}

export function RangePicker({ current }: RangePickerProps): React.ReactElement {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function select(value: AnalyticsRange): void {
		const params = new URLSearchParams(searchParams.toString());
		params.set("range", value);
		params.delete("window");
		router.push(`${pathname}?${params.toString()}`);
	}

	return (
		<div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 p-1 text-xs">
			{ANALYTICS_RANGE_OPTIONS.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => select(opt.value)}
					className={cn(
						"rounded-full px-3 py-1 font-medium transition-colors",
						current === opt.value
							? "bg-foreground text-background"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}
