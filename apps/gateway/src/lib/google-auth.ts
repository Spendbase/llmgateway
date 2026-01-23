import { GoogleAuth } from "google-auth-library";

import { logger } from "@llmgateway/logger";

const GOOGLE_CLOUD_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

/**
 * Get OAuth2 access token for Google Vertex AI using Application Default Credentials (ADC)
 *
 * This function uses Google's official auth library which automatically discovers credentials from:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
 * 2. GOOGLE_APPLICATION_CREDENTIALS_JSON env var (inline JSON content)
 * 3. Attached service account (if running on GKE/Cloud Run/GCE)
 * 4. gcloud CLI credentials (for local development)
 *
 * The library handles:
 * - JWT generation and signing
 * - Token exchange with Google OAuth2 endpoint
 * - Automatic token caching and refresh
 * - Token expiry management
 *
 * @returns OAuth2 access token (valid for ~1 hour)
 * @throws Error if credentials cannot be found or token generation fails
 */
export async function getGoogleVertexToken(): Promise<string> {
	try {
		// Check for inline JSON credentials first (Docker/K8s friendly)
		const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

		const auth = credentialsJson
			? new GoogleAuth({
					credentials: JSON.parse(credentialsJson),
					scopes: GOOGLE_CLOUD_SCOPES,
				})
			: new GoogleAuth({
					scopes: GOOGLE_CLOUD_SCOPES,
					// Will use GOOGLE_APPLICATION_CREDENTIALS env var or other ADC sources
				});

		// Get authenticated client
		const client = await auth.getClient();

		// Get access token (library handles caching and refresh automatically)
		const tokenResponse = await client.getAccessToken();

		if (!tokenResponse.token) {
			throw new Error("Failed to get access token from Google Auth");
		}

		logger.debug("Successfully obtained Google Vertex AI access token", {
			tokenLength: tokenResponse.token.length,
		});

		return tokenResponse.token;
	} catch (error) {
		logger.error(
			"Failed to get Google Vertex AI access token",
			error instanceof Error ? error : new Error(String(error)),
		);

		// Provide helpful error messages
		if (
			error instanceof Error &&
			error.message.includes("Could not load the default credentials")
		) {
			throw new Error(
				"Google Vertex AI authentication failed: No credentials found. " +
					"Please set GOOGLE_APPLICATION_CREDENTIALS environment variable with path to service account JSON, " +
					"or GOOGLE_APPLICATION_CREDENTIALS_JSON with inline JSON content.",
			);
		}

		throw error;
	}
}

/**
 * Check if Google Vertex AI credentials are configured
 * @returns true if credentials are available
 */
export function hasGoogleVertexCredentials(): boolean {
	return !!(
		process.env.GOOGLE_APPLICATION_CREDENTIALS ||
		process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
	);
}
