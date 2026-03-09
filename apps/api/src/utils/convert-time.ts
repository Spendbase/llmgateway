export const getTimeMessage = (milliseconds: number): string => {
	const seconds = Math.ceil(milliseconds / 1000);
	const minutes = Math.ceil(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const displayMinutes = minutes % 60;

	let timeMessage = "";
	if (hours > 0) {
		timeMessage = `${hours}h ${displayMinutes}m`;
	} else {
		timeMessage = `${displayMinutes}m`;
	}

	return timeMessage;
};
