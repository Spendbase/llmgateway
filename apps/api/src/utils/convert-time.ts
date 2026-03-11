export const getTimeMessage = (milliseconds: number): string => {
	const totalMinutes = Math.ceil(Math.max(0, milliseconds) / 60_000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}

	return `${minutes}m`;
};
