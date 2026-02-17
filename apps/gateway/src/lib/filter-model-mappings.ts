import { eq } from "drizzle-orm";

import { cdb as db, tables } from "@llmgateway/db";

import type { ModelDefinition, ProviderModelMapping } from "@llmgateway/models";

/**
 * Fetches mapping statuses from DB and filters model providers
 * @param modelId - Model ID
 * @param includeInactive - Whether to include inactive and deactivated mappings (for admin panel)
 * @returns Map with mapping statuses
 */
export async function getModelMappingStatuses(
	modelId: string,
): Promise<Map<string, string>> {
	const mappings = await db
		.select({
			modelId: tables.modelProviderMapping.modelId,
			providerId: tables.modelProviderMapping.providerId,
			status: tables.modelProviderMapping.status,
		})
		.from(tables.modelProviderMapping)
		.where(eq(tables.modelProviderMapping.modelId, modelId));

	const statusMap = new Map<string, string>();
	for (const mapping of mappings) {
		statusMap.set(`${mapping.modelId}:${mapping.providerId}`, mapping.status);
	}

	return statusMap;
}

/**
 * Filters model providers by status from DB
 * @param modelInfo - Model information
 * @param mappingStatusMap - Map with mapping statuses
 * @param includeInactive - Whether to include inactive and deactivated mappings
 * @returns Filtered list of providers
 */
export function filterProvidersByStatus(
	modelInfo: ModelDefinition,
	mappingStatusMap: Map<string, string>,
	includeInactive = false,
): ProviderModelMapping[] {
	const now = new Date();

	return modelInfo.providers.filter((provider) => {
		// Check static deactivatedAt
		if (
			(provider as ProviderModelMapping).deactivatedAt &&
			now > (provider as ProviderModelMapping).deactivatedAt!
		) {
			return false;
		}

		// Check status from DB
		const mappingKey = `${modelInfo.id}:${provider.providerId}`;
		const dbStatus = mappingStatusMap.get(mappingKey);

		// If DB record exists
		if (dbStatus) {
			// If including all statuses (for admin panel)
			if (includeInactive) {
				return true;
			}
			// Otherwise show only active
			return dbStatus === "active";
		}

		// If no DB record, consider mapping as active
		return true;
	});
}

/**
 * Gets list of active providers for a model
 * @param modelInfo - Model information
 * @param includeInactive - Whether to include inactive and deactivated mappings
 * @returns Model with filtered providers
 */
export async function getActiveProvidersForModel(
	modelInfo: ModelDefinition,
	includeInactive = false,
): Promise<ModelDefinition> {
	const mappingStatusMap = await getModelMappingStatuses(modelInfo.id);
	const activeProviders = filterProvidersByStatus(
		modelInfo,
		mappingStatusMap,
		includeInactive,
	);

	return {
		...modelInfo,
		providers: activeProviders,
	};
}
