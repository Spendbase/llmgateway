import { cache } from "react";

import type {
	ApiModel,
	ApiModelProviderMapping,
	ApiProvider,
} from "@llmgateway/shared";

export type { ApiModel, ApiModelProviderMapping, ApiProvider };

const API_URL =
	process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:4002";

export const fetchModels = cache(async (type?: string): Promise<ApiModel[]> => {
	try {
		const url = new URL(`${API_URL}/internal/models`);
		if (type) {
			url.searchParams.set("type", type);
		}
		const response = await fetch(url, {
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
	try {
		const response = await fetch(`${API_URL}/internal/providers`, {
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
