import { cache } from "react";

import { getConfig } from "./config-server";

export interface ApiProvider {
	id: string;
	createdAt: string;
	name?: string;
	description?: string;
	streaming?: boolean;
	cancellation?: boolean;
	color?: string;
	website?: string;
	announcement?: string;
	status: "active" | "inactive";
}

export interface PricingTier {
	name: string;
	upToTokens: number;
	inputPrice: number;
	outputPrice: number;
}

export interface ApiModelProviderMapping {
	id: string;
	createdAt: string;
	modelId: string;
	providerId: string;
	modelName: string;
	inputPrice?: number;
	outputPrice?: number;
	cachedInputPrice?: number;
	imageInputPrice?: number;
	requestPrice?: number;
	contextSize?: number;
	maxOutput?: number;
	streaming: boolean;
	vision?: boolean;
	reasoning?: boolean;
	reasoningOutput?: string;
	reasoningLevels?: ("minimal" | "low" | "medium" | "high")[];
	tools?: boolean;
	jsonOutput?: boolean;
	jsonOutputSchema?: boolean;
	webSearch?: boolean;
	webSearchPrice?: number;
	discount?: number;
	pricingTiers?: PricingTier[];
	stability?: "stable" | "beta" | "unstable" | "experimental";
	supportedParameters?: string[];
	deprecatedAt?: string;
	deactivatedAt?: string;
	deactivationReason?: string;
	status: "active" | "inactive" | "deactivated";
	providerInfo?: ApiProvider;
}

export interface ApiModel {
	id: string;
	createdAt: string;
	releasedAt?: string;
	name?: string;
	aliases?: string[];
	description?: string;
	family: string;
	free?: boolean;
	output?: string[];
	stability?: "stable" | "beta" | "unstable" | "experimental";
	status: "active" | "inactive";
	mappings: ApiModelProviderMapping[];
}

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
