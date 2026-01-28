import { GoogleAuth } from "google-auth-library";

import { logger } from "@llmgateway/logger";

import type { AuthClient } from "google-auth-library";

const GOOGLE_CLOUD_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

/**
 * Cached Google Auth client promise to avoid recreating on every request
 * Initialized once and reused across all function calls
 */
let cachedAuthClientPromise: Promise<AuthClient> | null = null;

/**
 * Get or create the cached Google Auth client
 * Creates a single GoogleAuth instance and client for reuse across requests
 * Clears cache on error to allow retries
 */
async function getOrCreateAuthClient(): Promise<AuthClient> {
	if (cachedAuthClientPromise) {
		return await cachedAuthClientPromise;
	}

	// Create the auth client promise (only once)
	cachedAuthClientPromise = (async () => {
		try {
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

			// Get authenticated client once and cache it
			const client = await auth.getClient();
			logger.debug("Google Auth client initialized and cached");
			return client;
		} catch (error) {
			// Clear cache on error to allow retries
			cachedAuthClientPromise = null;
			throw error;
		}
	})();

	return await cachedAuthClientPromise;
}

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
		// Use cached auth client
		const client = await getOrCreateAuthClient();

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
 * Probes the full ADC (Application Default Credentials) chain by attempting
 * to create an authenticated client
 * @returns Promise<true> if credentials are available and valid, false otherwise
 */
export async function hasGoogleVertexCredentials(): Promise<boolean> {
	// Quick path: check env vars first
	if (
		process.env.GOOGLE_APPLICATION_CREDENTIALS ||
		process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
	) {
		return true;
	}

	// Full ADC probe: try to get a client from the entire credential chain
	// (includes gcloud CLI, metadata server, etc.)
	try {
		// Use the same cached client logic
		await getOrCreateAuthClient();
		return true;
	} catch {
		// Any error means no valid credentials in ADC chain
		return false;
	}
}
