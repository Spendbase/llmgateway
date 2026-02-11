import type {
	ModelDefinition,
	ProviderDefinition,
	ProviderModelMapping,
} from "@llmgateway/models";

export function getUniqueModelEntries(
	models: ModelDefinition[],
	providers: ProviderDefinition[],
	now: Date = new Date(),
): {
	model: ModelDefinition;
	mapping: ProviderModelMapping;
	provider?: ProviderDefinition;
}[] {
	const out: {
		model: ModelDefinition;
		mapping: ProviderModelMapping;
		provider?: ProviderDefinition;
	}[] = [];

	for (const m of models) {
		if (m.id === "custom") {
			continue;
		}

		// Group mappings by providerId to avoid duplicates in the UI
		// Some models might have multiple mappings for the same provider (e.g. different internal names)
		const providerMappings = new Map<string, ProviderModelMapping>();
		for (const mp of m.providers) {
			const isDeactivated =
				mp.deactivatedAt && new Date(mp.deactivatedAt) <= now;
			if (isDeactivated) {
				continue;
			}

			const existing = providerMappings.get(mp.providerId);
			const isDeprecated = mp.deprecatedAt && new Date(mp.deprecatedAt) <= now;

			if (!existing) {
				providerMappings.set(mp.providerId, mp);
			} else {
				// Prefer non-deprecated mapping if multiple exist
				const existingIsDeprecated =
					existing.deprecatedAt && new Date(existing.deprecatedAt) <= now;
				if (existingIsDeprecated && !isDeprecated) {
					providerMappings.set(mp.providerId, mp);
				}
			}
		}

		for (const [providerId, mapping] of Array.from(providerMappings)) {
			out.push({
				model: m,
				mapping: mapping,
				provider: providers.find((p) => p.id === providerId),
			});
		}
	}
	return out;
}
