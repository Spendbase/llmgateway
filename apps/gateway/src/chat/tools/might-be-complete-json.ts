/**
 * Quick heuristic to check if a string might be complete JSON.
 * This is used during SSE streaming to determine if we should attempt to parse
 * the accumulated data as JSON yet.
 *
 * Note: This is a heuristic, not a validator. It aims to minimize false positives
 * (saying JSON is complete when it isn't) while accepting some false negatives
 * (saying JSON is incomplete when it might actually parse).
 *
 * The function checks:
 * 1. Basic structure (starts with { or [)
 * 2. Balanced brackets/braces (ignoring those inside strings)
 * 3. No unclosed strings
 *
 * It does NOT validate:
 * - Whether the JSON is syntactically correct
 * - Whether keys are quoted
 * - Whether values are valid
 * - Trailing commas or other syntax errors
 */
export function mightBeCompleteJson(str: string): boolean {
	const trimmed = str.trim();

	// Must start with { or [
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
		return false;
	}

	// Count brackets/braces, skipping content inside strings
	let braces = 0;
	let brackets = 0;
	let inString = false;
	let i = 0;

	while (i < trimmed.length) {
		const c = trimmed[i];

		if (inString) {
			if (c === "\\") {
				// Skip escaped character
				i += 2;
				continue;
			} else if (c === '"') {
				inString = false;
			}
		} else {
			if (c === '"') {
				inString = true;
			} else if (c === "{") {
				braces++;
			} else if (c === "}") {
				braces--;
			} else if (c === "[") {
				brackets++;
			} else if (c === "]") {
				brackets--;
			}
		}
		i++;
	}

	// If still in string, the JSON is incomplete
	if (inString) {
		return false;
	}

	return braces === 0 && brackets === 0;
}
