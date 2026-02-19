import type { ChatMessage } from "@/chat/chat.js";

/**
 * Organization context tag name
 */
const ORGANIZATION_CONTEXT_TAG = "organization_context";

/**
 * Applies organization context to messages by prepending it to the first suitable message
 * Mutates the messages array in-place to preserve type compatibility
 * @param messages - Array of messages to process (will be mutated)
 * @param organizationContext - The context string to prepend
 */
export function applyOrganizationContext(
	messages: ChatMessage[],
	organizationContext: string,
): void {
	// Early return if context is empty or only whitespace
	if (!organizationContext || !organizationContext.trim()) {
		return;
	}

	// Build the context block with XML tag
	const contextBlock = `<${ORGANIZATION_CONTEXT_TAG}>${organizationContext.trim()}</${ORGANIZATION_CONTEXT_TAG}>`;

	// Check if context tag already exists in any message
	const tagPattern = `<${ORGANIZATION_CONTEXT_TAG}>`;
	for (const message of messages) {
		if (typeof message.content === "string") {
			if (message.content.includes(tagPattern)) {
				return; // Tag already present, skip injection
			}
		} else if (Array.isArray(message.content)) {
			for (const part of message.content) {
				if (
					typeof part === "object" &&
					part !== null &&
					"type" in part &&
					part.type === "text" &&
					"text" in part &&
					typeof part.text === "string" &&
					part.text.includes(tagPattern)
				) {
					return; // Tag already present, skip injection
				}
			}
		}
	}

	// Find first suitable message to prepend context to
	for (const message of messages) {
		// Handle string content
		if (typeof message.content === "string") {
			message.content = `${contextBlock}\n\n${message.content}`;
			return;
		}

		// Handle array content
		if (Array.isArray(message.content) && message.content.length > 0) {
			// Find first text part
			for (const part of message.content) {
				if (
					typeof part === "object" &&
					part !== null &&
					"type" in part &&
					part.type === "text" &&
					"text" in part &&
					typeof part.text === "string"
				) {
					// Prepend to existing text part
					part.text = `${contextBlock}\n\n${part.text}`;
					return;
				}
			}

			// No text part found, insert new text part at beginning
			message.content.unshift({
				type: "text",
				text: contextBlock,
			});
			return;
		}
	}

	// No suitable message found, add new system message at the beginning
	messages.unshift({
		role: "system",
		content: contextBlock,
	});
}
