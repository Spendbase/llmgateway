import type { RefObject } from "react";

// Converts total seconds to a "M:SS" display string (e.g. 65 → "1:05")
export function formatDuration(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

// Appends transcribed text to the textarea (space-separated if it already has content),
// then fires a native "input" event so React picks up the change via event delegation,
// and calls onTranscriptionChange to propagate the new value to the parent.
export function appendTranscript(
	text: string,
	textareaRef: RefObject<HTMLTextAreaElement | null> | undefined,
	onTranscriptionChange: ((value: string) => void) | undefined,
): void {
	const textarea = textareaRef?.current;
	const newValue = textarea?.value ? `${textarea.value} ${text}` : text;

	if (textarea) {
		textarea.value = newValue;
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
	}

	onTranscriptionChange?.(newValue);
}
