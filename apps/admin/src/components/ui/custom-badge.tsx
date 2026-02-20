import { cn } from "@/lib/utils";

export function CustomBadge({
	children,
	variant = "default",
}: {
	children: React.ReactNode;
	variant?:
		| "default"
		| "success"
		| "error"
		| "warning"
		| "info"
		| "purple"
		| "blue";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
				variant === "success" &&
					"bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
				variant === "error" &&
					"bg-red-500/10 text-red-400 border border-red-500/30",
				variant === "warning" &&
					"bg-amber-500/10 text-amber-400 border border-amber-500/30",
				variant === "info" &&
					"bg-sky-500/10 text-sky-400 border border-sky-500/30",
				variant === "purple" &&
					"bg-violet-500/10 text-violet-400 border border-violet-500/30",
				variant === "blue" &&
					"bg-blue-500/10 text-blue-400 border border-blue-500/30",
				variant === "default" &&
					"bg-muted text-muted-foreground border border-border",
			)}
		>
			{children}
		</span>
	);
}
