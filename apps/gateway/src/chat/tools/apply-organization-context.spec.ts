import { describe, it, expect } from "vitest";

import { applyOrganizationContext } from "./apply-organization-context.js";

import type { ChatMessage } from "@/chat/chat.js";

const ORGANIZATION_CONTEXT_TAG = "organization_context";

describe("Organization Context", () => {
	describe("applyOrganizationContext", () => {
		it("should prepend context to string content with XML tag and separator", () => {
			const messages: ChatMessage[] = [
				{ role: "user", content: "Hello, how are you?" },
			];
			const context = "You are a helpful assistant for Acme Corp.";

			applyOrganizationContext(messages, context);

			expect(messages).toHaveLength(1);
			expect(messages[0].content).toBe(
				`<${ORGANIZATION_CONTEXT_TAG}>${context}</${ORGANIZATION_CONTEXT_TAG}>\n\nHello, how are you?`,
			);
		});

		it("should not add context if already present in string content", () => {
			const context = "You are a helpful assistant.";
			const messages: ChatMessage[] = [
				{
					role: "user",
					content: `<${ORGANIZATION_CONTEXT_TAG}>Existing context</${ORGANIZATION_CONTEXT_TAG}>\n\nOriginal prompt`,
				},
			];
			const originalContent = messages[0].content;

			applyOrganizationContext(messages, context);

			expect(messages[0].content).toBe(originalContent);
		});

		it("should skip injection if context is empty", () => {
			const messages: ChatMessage[] = [
				{ role: "user", content: "Hello, how are you?" },
			];
			const originalContent = messages[0].content;

			applyOrganizationContext(messages, "");
			expect(messages[0].content).toBe(originalContent);

			applyOrganizationContext(messages, "   ");
			expect(messages[0].content).toBe(originalContent);
		});

		it("should handle array content with text parts", () => {
			const messages: ChatMessage[] = [
				{
					role: "user",
					content: [
						{ type: "text", text: "What is in this image?" },
						{
							type: "image_url",
							image_url: { url: "data:image/png;base64,..." },
						},
					],
				},
			];
			const context = "You are an image analysis assistant.";

			applyOrganizationContext(messages, context);

			expect(messages).toHaveLength(1);
			expect(Array.isArray(messages[0].content)).toBe(true);
			const content = messages[0].content as Array<{
				type: string;
				text?: string;
			}>;
			expect(content[0].type).toBe("text");
			expect(content[0].text).toContain(
				`<${ORGANIZATION_CONTEXT_TAG}>${context}</${ORGANIZATION_CONTEXT_TAG}>`,
			);
			expect(content[0].text).toContain("What is in this image?");
			expect(content[1].type).toBe("image_url");
		});

		it("should not add context if tag already present in array content", () => {
			const context = "New context";
			const originalText = `<${ORGANIZATION_CONTEXT_TAG}>Existing</${ORGANIZATION_CONTEXT_TAG}>\n\nPrompt`;
			const messages: ChatMessage[] = [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: originalText,
						},
					],
				},
			];

			applyOrganizationContext(messages, context);

			const content = messages[0].content as Array<{
				type: string;
				text?: string;
			}>;
			expect(content[0].text).toBe(originalText);
		});

		it("should insert text part at beginning if no text part exists", () => {
			const messages: ChatMessage[] = [
				{
					role: "user",
					content: [
						{
							type: "image_url",
							image_url: { url: "data:image/png;base64,..." },
						},
					],
				},
			];
			const context = "Image context";

			applyOrganizationContext(messages, context);

			expect(messages).toHaveLength(1);
			const content = messages[0].content as Array<{
				type: string;
				text?: string;
			}>;
			expect(content).toHaveLength(2);
			expect(content[0].type).toBe("text");
			expect(content[0].text).toBe(
				`<${ORGANIZATION_CONTEXT_TAG}>${context}</${ORGANIZATION_CONTEXT_TAG}>`,
			);
		});

		it("should add a new system message if no suitable message found", () => {
			const messages: ChatMessage[] = [];
			const context = "Global context";

			applyOrganizationContext(messages, context);

			expect(messages).toHaveLength(1);
			expect(messages[0].role).toBe("system");
			expect(messages[0].content).toBe(
				`<${ORGANIZATION_CONTEXT_TAG}>${context}</${ORGANIZATION_CONTEXT_TAG}>`,
			);
		});

		it("should trim whitespace from context", () => {
			const messages: ChatMessage[] = [
				{ role: "user", content: "Hello, how are you?" },
			];
			const context = "  \n\n  Context with whitespace  \n\n  ";

			applyOrganizationContext(messages, context);

			expect(messages[0].content).toBe(
				`<${ORGANIZATION_CONTEXT_TAG}>Context with whitespace</${ORGANIZATION_CONTEXT_TAG}>\n\nHello, how are you?`,
			);
		});

		it("should handle multi-message conversation by prepending to first message", () => {
			const messages: ChatMessage[] = [
				{ role: "system", content: "You are helpful." },
				{ role: "user", content: "What is 2+2?" },
				{ role: "assistant", content: "4" },
				{ role: "user", content: "What is 3+3?" },
			];
			const context = "Math assistant";

			applyOrganizationContext(messages, context);

			expect(messages).toHaveLength(4);
			expect(messages[0].content).toContain(
				`<${ORGANIZATION_CONTEXT_TAG}>${context}</${ORGANIZATION_CONTEXT_TAG}>`,
			);
			expect(messages[1].content).toBe("What is 2+2?");
			expect(messages[2].content).toBe("4");
			expect(messages[3].content).toBe("What is 3+3?");
		});
	});
});
