import type { ChatMessage } from "@/chat/chat.js";

const ORGANIZATION_CONTEXT_TAG = "organization_context";
const CONTEXT_SEPARATOR = "\n\n";

function hasContextTag(messages: ChatMessage[]): boolean {
	const tagPattern = `<${ORGANIZATION_CONTEXT_TAG}>`;

	return messages.some((message) => {
		if (typeof message.content === "string") {
			return message.content.includes(tagPattern);
		}

		if (Array.isArray(message.content)) {
			return message.content.some(
				(part) => part.type === "text" && part.text.includes(tagPattern),
			);
		}

		return false;
	});
}

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
	const trimmedContext = organizationContext?.trim();

	if (!trimmedContext || hasContextTag(messages)) {
		return;
	}

	const contextBlock = `<${ORGANIZATION_CONTEXT_TAG}>${trimmedContext}</${ORGANIZATION_CONTEXT_TAG}>`;

	for (const message of messages) {
		if (typeof message.content === "string") {
			message.content = `${contextBlock}${CONTEXT_SEPARATOR}${message.content}`;
			return;
		}

		if (Array.isArray(message.content)) {
			const firstTextPart = message.content.find(
				(part) => part.type === "text",
			);

			if (firstTextPart) {
				firstTextPart.text = `${contextBlock}${CONTEXT_SEPARATOR}${firstTextPart.text}`;
				return;
			}

			message.content.unshift({ type: "text", text: contextBlock });
			return;
		}
	}

	messages.unshift({ role: "system", content: contextBlock });
}
