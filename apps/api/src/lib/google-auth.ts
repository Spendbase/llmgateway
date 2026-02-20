import { GoogleAuth } from "google-auth-library";

import { logger } from "@llmgateway/logger";

import type { AuthClient } from "google-auth-library";

const GOOGLE_CLOUD_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

let cachedAuthClientPromise: Promise<AuthClient> | null = null;

async function getOrCreateAuthClient(): Promise<AuthClient> {
	if (cachedAuthClientPromise) {
		return await cachedAuthClientPromise;
	}

	cachedAuthClientPromise = (async () => {
		try {
			const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

			const auth = credentialsJson
				? new GoogleAuth({
						credentials: JSON.parse(credentialsJson) as object,
						scopes: GOOGLE_CLOUD_SCOPES,
					})
				: new GoogleAuth({
						scopes: GOOGLE_CLOUD_SCOPES,
					});

			const client = await auth.getClient();
			return client;
		} catch (error) {
			cachedAuthClientPromise = null;
			throw error;
		}
	})();

	return await cachedAuthClientPromise;
}

export async function getGoogleAccessToken(): Promise<string> {
	try {
		const client = await getOrCreateAuthClient();
		const tokenResponse = await client.getAccessToken();

		if (!tokenResponse.token) {
			throw new Error("Failed to get access token from Google Auth");
		}

		return tokenResponse.token;
	} catch (error) {
		logger.error(
			"Failed to get Google access token",
			error instanceof Error ? error : new Error(String(error)),
		);

		if (
			error instanceof Error &&
			error.message.includes("Could not load the default credentials")
		) {
			throw new Error(
				"Google authentication failed: No credentials found. " +
					"Set GOOGLE_APPLICATION_CREDENTIALS_JSON with the service account JSON content.",
			);
		}

		throw error;
	}
}

export function hasGoogleCredentials(): boolean {
	return !!(
		process.env.GOOGLE_APPLICATION_CREDENTIALS ||
		process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
	);
}

// Reads project_id from the service account JSON credentials.
export function getGoogleProjectId(): string | null {
	const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
	if (!credentialsJson) {
		return null;
	}
	try {
		const parsed = JSON.parse(credentialsJson) as { project_id?: string };
		return parsed.project_id ?? null;
	} catch {
		return null;
	}
}

export function resetGoogleAuthCache(): void {
	cachedAuthClientPromise = null;
}
