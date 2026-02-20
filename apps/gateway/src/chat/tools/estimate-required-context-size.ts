import { calculatePromptTokensFromMessages } from "./calculate-prompt-tokens.js";

/**
 * Estimates the total context size required for a request in tokens.
 *
 * Combines prompt tokens (from messages + tools) with the expected
 * completion size (max_tokens or a default buffer).
 */
export function estimateRequiredContextSize(
	messages: any[],
	tools: any[] | undefined,
	max_tokens: number | undefined | null,
	completionBuffer: number,
): number {
	let contextSize = 0;

	if (messages && messages.length > 0) {
		contextSize += calculatePromptTokensFromMessages(messages);
	}

	if (tools && tools.length > 0) {
		try {
			contextSize += Math.round(JSON.stringify(tools).length / 4);
		} catch {
			contextSize += tools.length * 100;
		}
	}

	contextSize += max_tokens ?? completionBuffer;

	return contextSize;
}
