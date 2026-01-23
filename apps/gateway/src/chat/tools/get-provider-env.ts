import { HTTPException } from "hono/http-exception";

import {
	getGoogleVertexToken,
	hasGoogleVertexCredentials,
} from "@/lib/google-auth.js";
import { getRoundRobinValue } from "@/lib/round-robin-env.js";

import { logger } from "@llmgateway/logger";
import {
	getProviderEnvVar,
	getProviderEnvConfig,
	type Provider,
} from "@llmgateway/models";

export interface ProviderEnvResult {
	token: string;
	configIndex: number;
	envVarName: string;
	isOAuth2?: boolean; // Flag to indicate OAuth2 token (vs API key)
}

/**
 * Get provider token from environment variables with round-robin support
 * Supports comma-separated values in environment variables for load balancing
 *
 * For Google Vertex AI: Uses OAuth2 authentication via Application Default Credentials
 * if GOOGLE_APPLICATION_CREDENTIALS is set, otherwise falls back to API key.
 *
 * @param usedProvider The provider to get the token for
 * @returns Object containing the token and the config index used
 */
export async function getProviderEnv(
	usedProvider: Provider,
): Promise<ProviderEnvResult> {
	// Special handling for Google Vertex AI - try OAuth2 first
	if (usedProvider === "google-vertex") {
		if (await hasGoogleVertexCredentials()) {
			try {
				logger.debug(
					"Using Google Vertex AI OAuth2 authentication with Application Default Credentials",
				);
				const accessToken = await getGoogleVertexToken();
				return {
					token: accessToken,
					configIndex: 0,
					envVarName: "GOOGLE_APPLICATION_CREDENTIALS",
					isOAuth2: true,
				};
			} catch (error) {
				logger.warn(
					"Failed to get Google Vertex OAuth2 token, falling back to API key",
					error instanceof Error ? error : new Error(String(error)),
				);
				// Fall through to API key logic below
			}
		}
	}

	// Standard API key authentication
	const envVar = getProviderEnvVar(usedProvider);
	if (!envVar) {
		throw new HTTPException(500, {
			message: `No environment variable set for provider: ${usedProvider}`,
		});
	}
	const envValue = process.env[envVar];
	if (!envValue) {
		throw new HTTPException(500, {
			message: `No API key set in environment for provider: ${usedProvider}`,
		});
	}

	// Validate required env vars for the provider
	const config = getProviderEnvConfig(usedProvider);
	if (config?.required) {
		for (const [key, envVarName] of Object.entries(config.required)) {
			if (key === "apiKey" || !envVarName) {
				continue;
			} // Already validated above
			if (!process.env[envVarName]) {
				throw new HTTPException(500, {
					message: `${envVarName} environment variable is required for ${usedProvider} provider`,
				});
			}
		}
	}

	// Get the next token using round-robin
	const result = getRoundRobinValue(envVar, envValue);

	return {
		token: result.value,
		configIndex: result.index,
		envVarName: envVar,
		isOAuth2: false,
	};
}
