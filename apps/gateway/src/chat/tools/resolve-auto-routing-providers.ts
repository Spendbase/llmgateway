import { cdb as db } from "@llmgateway/db";
import {
	hasProviderEnvironmentToken,
	providers,
	type Provider,
} from "@llmgateway/models";

interface Project {
	organizationId: string;
	mode: "api-keys" | "credits" | "hybrid";
}

/**
 * Resolves which provider IDs are available for a given project,
 * depending on project mode:
 * - api-keys:  providers that have an active key in the database
 * - credits:   providers that have an environment token configured
 * - hybrid:    union of both
 *
 * The virtual "llmapi" provider is always excluded.
 */
export async function resolveAutoRoutingProviders(
	project: Project,
): Promise<string[]> {
	const envProviders = providers
		.filter(
			(p) =>
				(p.id as string) !== "llmapi" &&
				hasProviderEnvironmentToken(p.id as Provider),
		)
		.map((p) => p.id);

	if (project.mode === "credits") {
		return envProviders;
	}

	const providerKeys = await db.query.providerKey.findMany({
		where: {
			status: { eq: "active" },
			organizationId: { eq: project.organizationId },
		},
	});
	const databaseProviders = providerKeys.map((key) => key.provider);

	if (project.mode === "api-keys") {
		return databaseProviders;
	}

	// hybrid: union of database keys + env tokens
	return [...new Set([...databaseProviders, ...envProviders])];
}
