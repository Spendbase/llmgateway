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
		next.setUTCMonth(next.getUTCMonth() + 1);
	}

	return next;
}
