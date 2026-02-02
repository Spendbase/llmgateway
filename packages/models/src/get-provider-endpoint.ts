import { models, type ProviderModelMapping } from "./models.js";
import { getProviderEnvValue, getProviderEnvConfig } from "./provider.js";

import type { ProviderId } from "./providers.js";
import type { ProviderKeyOptions } from "@llmgateway/db";

/**
 * Get the endpoint URL for a provider API call
 */
export function getProviderEndpoint(
	provider: ProviderId,
	baseUrl?: string,
	model?: string,
	token?: string,
	stream?: boolean,
	supportsReasoning?: boolean,
	hasExistingToolCalls?: boolean,
	providerKeyOptions?: ProviderKeyOptions,
	configIndex?: number,
	imageGenerations?: boolean,
	isOAuth2?: boolean,
): string {
	let modelName = model;
	if (model && model !== "custom") {
		const modelInfo = models.find((m) => m.id === model);
		if (modelInfo) {
			const providerMapping = modelInfo.providers.find(
				(p) => p.providerId === provider,
			);
			if (providerMapping) {
				modelName = providerMapping.modelName;
			}
		}
	}
	let url: string | undefined;

	if (baseUrl) {
		url = baseUrl;
	} else {
		switch (provider) {
			case "openai":
				url = "https://api.openai.com";
				break;
			case "anthropic":
				url = "https://api.anthropic.com";
				break;
			case "google-ai-studio":
				url = "https://generativelanguage.googleapis.com";
				break;
			case "google-vertex":
				url = "https://aiplatform.googleapis.com";
				break;
			// case "inference.net":
			// 	url = "https://api.inference.net";
			// 	break;
			// case "together.ai":
			// 	url = "https://api.together.ai";
			// 	break;
			// case "cloudrift":
			// 	url = "https://inference.cloudrift.ai";
			// 	break;
			// case "mistral":
			// 	url = "https://api.mistral.ai";
			// 	break;
			// case "xai":
			// 	url = "https://api.x.ai";
			// 	break;
			// case "groq":
			// 	url = "https://api.groq.com/openai";
			// 	break;
			// case "cerebras":
			// 	url = "https://api.cerebras.ai";
			// 	break;
			// case "deepseek":
			// 	url = "https://api.deepseek.com";
			// 	break;
			// case "elevenlabs":
			// 	url = "https://api.elevenlabs.io";
			// 	break;
			// case "perplexity":
			// 	url = "https://api.perplexity.ai";
			// 	break;
			// case "novita":
			// 	url = "https://api.novita.ai/v3/openai";
			// 	break;
			case "moonshot":
				url = "https://api.moonshot.ai";
				break;
			case "alibaba":
				// Use different base URL for image generation vs chat completions
				if (imageGenerations) {
					url = "https://dashscope-intl.aliyuncs.com";
				} else {
					url = "https://dashscope-intl.aliyuncs.com/compatible-mode";
				}
				break;
			// case "nebius":
			// 	url = "https://api.studio.nebius.com";
			// 	break;
			// case "zai":
			// 	url = "https://api.z.ai";
			// 	break;
			// case "routeway":
			// 	url = "https://api.routeway.ai";
			// 	break;
			// case "nanogpt":
			// 	url = "https://nano-gpt.com/api";
			// 	break;
			case "aws-bedrock":
				url =
					getProviderEnvValue(
						"aws-bedrock",
						"baseUrl",
						configIndex,
						"https://bedrock-runtime.us-east-1.amazonaws.com",
					) || "https://bedrock-runtime.us-east-1.amazonaws.com";
				break;
			default:
				throw new Error(`Provider ${provider} requires a baseUrl`);
		}
	}

	if (!url) {
		throw new Error(`Failed to determine base URL for provider ${provider}`);
	}

	switch (provider) {
		case "anthropic":
			return `${url}/v1/messages`;
		case "google-ai-studio": {
			const endpoint = stream ? "streamGenerateContent" : "generateContent";
			const baseEndpoint = modelName
				? `${url}/v1beta/models/${modelName}:${endpoint}`
				: `${url}/v1beta/models/gemini-2.0-flash:${endpoint}`;
			const queryParams = [];
			if (token) {
				queryParams.push(`key=${token}`);
			}
			if (stream) {
				queryParams.push("alt=sse");
			}
			return queryParams.length > 0
				? `${baseEndpoint}?${queryParams.join("&")}`
				: baseEndpoint;
		}
		case "google-vertex": {
			const endpoint = stream ? "streamGenerateContent" : "generateContent";
			const model = modelName || "gemini-2.5-flash-lite";

			// Special handling for some models which require a non-global location
			let baseEndpoint: string;
			if (
				model === "gemini-2.0-flash-lite" ||
				model === "gemini-2.5-flash-lite"
			) {
				baseEndpoint = `${url}/v1/publishers/google/models/${model}:${endpoint}`;
			} else {
				const projectId = getProviderEnvValue(
					"google-vertex",
					"project",
					configIndex,
				);

				const region =
					getProviderEnvValue(
						"google-vertex",
						"region",
						configIndex,
						"global",
					) || "global";

				if (!projectId) {
					const vertexEnv = getProviderEnvConfig("google-vertex");
					throw new Error(
						`${vertexEnv?.required.project || "LLM_GOOGLE_CLOUD_PROJECT"} environment variable is required for Vertex model "${model}"`,
					);
				}

				baseEndpoint = `${url}/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:${endpoint}`;
			}

			const queryParams = [];
			// Only add API key to URL for non-OAuth2 authentication
			// OAuth2 tokens go in Authorization header instead
			if (token && !isOAuth2) {
				queryParams.push(`key=${token}`);
			}
			if (stream) {
				queryParams.push("alt=sse");
			}
			return queryParams.length > 0
				? `${baseEndpoint}?${queryParams.join("&")}`
				: baseEndpoint;
		}
		case "aws-bedrock": {
			const prefix =
				providerKeyOptions?.aws_bedrock_region_prefix ||
				getProviderEnvValue("aws-bedrock", "region", configIndex, "global.") ||
				"global.";

			const endpoint = stream ? "converse-stream" : "converse";
			return `${url}/model/${prefix}${modelName}/${endpoint}`;
		}
		case "openai": {
			// Use responses endpoint for models that support responses API
			if (model) {
				// Look up by model ID first, then fall back to provider modelName
				const modelDef = models.find(
					(m) =>
						m.id === model ||
						m.providers.some(
							(p) => p.modelName === model && p.providerId === "openai",
						),
				);
				const providerMapping = modelDef?.providers.find(
					(p) => p.providerId === "openai",
				);
				const supportsResponsesApi =
					(providerMapping as ProviderModelMapping)?.supportsResponsesApi ===
					true;

				if (supportsResponsesApi) {
					return `${url}/v1/responses`;
				}
			}
			return `${url}/v1/chat/completions`;
		}
		default:
			return `${url}/v1/chat/completions`;
	}
}
