import { cache } from "react";

import { getConfig } from "./config-server";

import type {
	ApiModel,
	ApiModelProviderMapping,
	ApiProvider,
} from "@llmgateway/shared";

export type { ApiModel, ApiModelProviderMapping, ApiProvider };

export const fetchModels = cache(async (): Promise<ApiModel[]> => {
	const config = getConfig();
	try {
		const response = await fetch(`${config.apiBackendUrl}/internal/models`, {
			next: { revalidate: 60 },
		});
		if (!response.ok) {
			console.error("Failed to fetch models:", response.statusText);
			return [];
		}
		const data = await response.json();
		return data.models || [];
	} catch (error) {
		console.error("Error fetching models:", error);
		return [];
	}
});

export const fetchProviders = cache(async (): Promise<ApiProvider[]> => {
	const config = getConfig();
	try {
		const response = await fetch(`${config.apiBackendUrl}/internal/providers`, {
			next: { revalidate: 60 },
		});
		if (!response.ok) {
			console.error("Failed to fetch providers:", response.statusText);
			return [];
		}
		const data = await response.json();
		return data.providers || [];
	} catch (error) {
		console.error("Error fetching providers:", error);
		return [];
	}
});
