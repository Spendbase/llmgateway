import type { ProviderId } from "./providers.js";

export interface ProviderHeaderOptions {
	/**
	 * Enable web search beta header for Anthropic
	 */
	webSearchEnabled?: boolean;
	/**
	 * Flag indicating OAuth2 authentication (vs API key)
	 * When true, token should be added to Authorization header
	 */
	isOAuth2?: boolean;
}

/**
 * Get the appropriate headers for a given provider API call
 */
export function getProviderHeaders(
	provider: ProviderId,
	token: string,
	options?: ProviderHeaderOptions,
): Record<string, string> {
	switch (provider) {
		case "anthropic": {
			const betaFeatures = ["tools-2024-04-04", "prompt-caching-2024-07-31"];
			if (options?.webSearchEnabled) {
				betaFeatures.push("web-search-2025-03-05");
			}
			return {
				"x-api-key": token,
				"anthropic-version": "2023-06-01",
				"anthropic-beta": betaFeatures.join(","),
			};
		}
		case "google-ai-studio":
			// Google AI Studio uses API key in URL query parameter
			return {};
		case "google-vertex":
			// For OAuth2 authentication, add Bearer token to Authorization header
			if (options?.isOAuth2) {
				return {
					Authorization: `Bearer ${token}`,
				};
			}
			// For API key authentication, token goes in URL query parameter
			return {};
		case "obsidian":
			return {
				Authorization: `Bearer ${token}`,
			};
		case "aws-bedrock":
			return {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
		case "elevenlabs":
			return {
				"xi-api-key": token,
			};
		// case "azure":
		// 	return {
		// 		"api-key": token,
		// 	};
		case "openai":
		case "alibaba":
		default:
			return {
				Authorization: `Bearer ${token}`,
			};
	}
}
