export interface AppConfig {
	hosted: boolean;
	appUrl: string;
	apiUrl: string;
	apiBackendUrl: string;
	githubUrl: string;
	discordUrl: string;
	twitterUrl: string;
	docsUrl: string;
	playgroundUrl: string;
	adminUrl: string;
	posthogKey?: string;
	posthogHost?: string;
	crispId?: string;
	gtmId?: string;
	hubspotPortalId?: string;
	hubspotFormGuid?: string;
}

/**
 * Build an AppConfig object by reading environment variables and applying sensible defaults.
 *
 * Populates URLs, feature flags, and optional analytics/third-party IDs from environment variables; where an env var is not set a local default is used (e.g. local host URLs and default external links).
 *
 * @returns The constructed AppConfig with properties like `hosted`, `appUrl`, `apiUrl`, `apiBackendUrl`, social/docs/playground/admin URLs, and optional keys `posthogKey`, `posthogHost`, `crispId`, `gtmId`, `hubspotPortalId`, and `hubspotFormGuid`.
 */
export function getConfig(): AppConfig {
	const apiUrl = process.env.API_URL || "http://localhost:4002";
	return {
		hosted: process.env.HOSTED === "true",
		appUrl: process.env.APP_URL || "http://localhost:3002",
		apiUrl,
		apiBackendUrl: process.env.API_BACKEND_URL || apiUrl,
		githubUrl:
			process.env.GITHUB_URL || "https://github.com/Spendbase/llmgateway",
		discordUrl: process.env.DISCORD_URL || "https://discord.gg/gcqcZeYWEz",
		twitterUrl: process.env.TWITTER_URL || "https://x.com/llmgateway",
		docsUrl: process.env.DOCS_URL || "http://localhost:3005",
		playgroundUrl: process.env.PLAYGROUND_URL || "http://localhost:3003",
		adminUrl: process.env.ADMIN_URL || "http://localhost:3006",
		posthogKey: process.env.POSTHOG_KEY,
		posthogHost: process.env.POSTHOG_HOST,
		crispId: process.env.CRISP_ID,
		gtmId: process.env.GOOGLE_TAG_MANAGER_ID,
		hubspotPortalId: process.env.HUBSPOT_PORTAL_ID,
		hubspotFormGuid: process.env.HUBSPOT_FORM_GUID,
	};
}