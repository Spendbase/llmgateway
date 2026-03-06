/**
 * Compute the next reset date strictly based on UTC boundaries.
 * Used by both the API (when creating/editing keys) and the Worker (reset loop).
 */
export function computeNextResetAt(
	period: "daily" | "weekly" | "monthly" | "none",
	now: Date = new Date(),
): Date | null {
	if (period === "none") {
		return null;
	}
	const next = new Date(now);

	if (period === "daily") {
		next.setUTCDate(next.getUTCDate() + 1);
	} else if (period === "weekly") {
		next.setUTCDate(next.getUTCDate() + 7);
	} else if (period === "monthly") {
		// Remember the original day-of-month before advancing (e.g., 31)
		const targetDay = next.getUTCDate();

		// Advance to the 1st of the next month (safe — every month has a 1st)
		next.setUTCMonth(next.getUTCMonth() + 1, 1);

		// Determine the last day of the new month
		const lastDayOfMonth = new Date(
			Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
		).getUTCDate();

		// Use the original day, but cap at the last day of the month
		// to avoid overflow (e.g., Jan 31 → Feb 28/29, not Mar 3)
		next.setUTCDate(Math.min(targetDay, lastDayOfMonth));
	}

	return next;
}
