import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { cookies } from "next/headers";

import { getUser } from "@/lib/getUser";

import { createLLMGateway } from "@llmgateway/ai-sdk-provider";

import type { LLMGatewayChatModelId } from "@llmgateway/ai-sdk-provider/internal";

export const maxDuration = 300; // 5 minutes

interface ChatRequestBody {
	messages: UIMessage[];
	chatId?: string | null;
	model?: LLMGatewayChatModelId;
	apiKey?: string;
	provider?: string; // optional provider override
	mode?: "image" | "chat"; // optional hint to force image generation path
	image_config?: {
		aspect_ratio?:
			| "auto"
			| "1:1"
			| "9:16"
			| "3:4"
			| "4:3"
			| "3:2"
			| "2:3"
			| "5:4"
			| "4:5"
			| "21:9";
		image_size?: "1K" | "2K" | "4K" | string; // string for Alibaba WIDTHxHEIGHT format
	};
	reasoning_effort?: "minimal" | "low" | "medium" | "high";
	web_search?: boolean;
}

export async function POST(req: Request) {
	const user = await getUser();

	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}

	const body = await req.json();
	const {
		messages,
		chatId,
		model,
		apiKey,
		provider,
		image_config,
		reasoning_effort,
		web_search,
	}: ChatRequestBody = body;

	if (!messages || !Array.isArray(messages)) {
		return new Response(JSON.stringify({ error: "Missing messages" }), {
			status: 400,
		});
	}

	const headerApiKey = req.headers.get("x-llmgateway-key") || undefined;
	const headerModel = req.headers.get("x-llmgateway-model") || undefined;
	const noFallbackHeader = req.headers.get("x-no-fallback") || undefined;

	const cookieStore = await cookies();
	const cookieApiKey =
		cookieStore.get("llmgateway_playground_key")?.value ||
		cookieStore.get("__Host-llmgateway_playground_key")?.value;
	const finalApiKey = apiKey ?? headerApiKey ?? cookieApiKey;
	if (!finalApiKey) {
		return new Response(JSON.stringify({ error: "Missing API key" }), {
			status: 400,
		});
	}

	const gatewayUrl =
		process.env.GATEWAY_URL ||
		(process.env.NODE_ENV === "development"
			? "http://localhost:4001/v1"
			: "https://api.llmapi.ai/v1");

	const llmgateway = createLLMGateway({
		apiKey: finalApiKey,
		baseUrl: gatewayUrl,
		headers: {
			"x-source": "chat.llmapi.ai",
			...(noFallbackHeader ? { "x-no-fallback": noFallbackHeader } : {}),
		},
		extraBody: {
			...(reasoning_effort ? { reasoning_effort } : {}),
			...(image_config ? { image_config } : {}),
			...(web_search ? { web_search } : {}),
		},
	});

	// Respect root model IDs passed from the client without adding a provider prefix.
	// Only apply provider-based prefixing when the client did NOT explicitly specify a model
	// (i.e. we're using a header/default model value).
	let selectedModel = (model ?? headerModel ?? "auto") as LLMGatewayChatModelId;
	if (!model && provider && typeof provider === "string") {
		const alreadyPrefixed = String(selectedModel).includes("/");
		if (!alreadyPrefixed) {
			selectedModel = `${provider}/${selectedModel}` as LLMGatewayChatModelId;
		}
	}

	const apiUrl =
		process.env.API_URL ||
		process.env.API_BACKEND_URL ||
		"http://localhost:4002";
	const cookieHeader = req.headers.get("cookie") ?? "";

	function buildAssistantMessageBody(msg: UIMessage) {
		const parts = msg.parts ?? [];
		const text = parts
			.filter((p) => p.type === "text")
			.map((p) => p.text)
			.join("");
		const reasoning = parts
			.filter((p) => p.type === "reasoning")
			.map((p) => p.text)
			.join("");
		const toolParts = parts.filter(
			(p: { type?: string }) => p.type === "dynamic-tool",
		);

		const imageParts = parts.filter(
			(p: { type?: string }) => p.type === "image_url" || p.type === "file",
		);
		const images = imageParts
			.map((p: Record<string, unknown>) => {
				if (
					p.type === "image_url" &&
					p.image_url &&
					typeof p.image_url === "object" &&
					"url" in p.image_url
				) {
					return {
						type: "image_url" as const,
						image_url: { url: (p.image_url as { url?: string }).url },
					};
				}
				const file = p.file as Record<string, unknown> | undefined;
				const url = (p.url ??
					p.data ??
					p.base64 ??
					file?.url ??
					file?.data ??
					file?.base64) as string | undefined;
				const mt = (p.mediaType ??
					p.mimeType ??
					file?.mediaType ??
					file?.mimeType) as string | undefined;
				if (typeof mt === "string" && mt.startsWith("image/") && url) {
					return { type: "image_url" as const, image_url: { url } };
				}
				return null;
			})
			.filter(Boolean) as { type: "image_url"; image_url: { url: string } }[];

		return {
			role: "assistant" as const,
			content: text || undefined,
			reasoning: reasoning || undefined,
			images: images.length > 0 ? JSON.stringify(images) : undefined,
			tools: toolParts.length > 0 ? JSON.stringify(toolParts) : undefined,
		};
	}

	try {
		const result = streamText({
			model: llmgateway.chat(selectedModel),
			messages: await convertToModelMessages(messages),
		});

		result.consumeStream();

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
			sendReasoning: true,
			sendSources: true,
			onFinish: async ({ responseMessage }) => {
				if (!chatId) {
					return;
				}
				const bodyToSave = buildAssistantMessageBody(responseMessage);
				if (
					!bodyToSave.content &&
					!bodyToSave.images &&
					!bodyToSave.reasoning &&
					!bodyToSave.tools
				) {
					return;
				}
				try {
					await fetch(`${apiUrl}/chats/${chatId}/messages`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Cookie: cookieHeader,
						},
						body: JSON.stringify(bodyToSave),
					});
				} catch {
					// Log in prod; client may retry or show toast
				}
			},
		});
	} catch (error: any) {
		const message = error.message || "LLM API request failed";
		const status = error.status || 500;
		return new Response(JSON.stringify({ error: message, details: error }), {
			status,
		});
	}
}
