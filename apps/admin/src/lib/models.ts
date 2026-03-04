import { cookies } from "next/headers";

const API_URL = process.env.API_BACKEND_URL || "http://localhost:4002";

export interface Provider {
	id: string;
	createdAt: Date;
	name: string | null;
	description: string | null;
	streaming: boolean | null;
	cancellation: boolean | null;
	color: string | null;
	website: string | null;
	announcement: string | null;
	status: "active" | "inactive";
}

export interface PricingTier {
	name: string;
	upToTokens?: number;
	inputPrice: number;
	outputPrice: number;
}

export interface AudioConfig {
	characterPrice: number;
	maxCharacters: number;
	languages?: number;
	latencyMs?: number;
}

export interface ModelProviderMapping {
	id: string;
	createdAt: Date;
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
	deprecatedAt?: Date;
	deactivatedAt?: Date;
	deactivationReason?: string;
	status: "active" | "inactive" | "deactivated";
	audioConfig?: AudioConfig;
	providerInfo?: Provider;
}

export interface Model {
	id: string;
	createdAt: Date;
	updatedAt?: Date;
	releasedAt?: Date;
	name?: string;
	aliases?: string[];
	description?: string;
	family: string;
	free?: boolean;
	output?: string[];
	stability?: "stable" | "beta" | "unstable" | "experimental";
	status: "active" | "inactive";
	mappings: ModelProviderMapping[];
	logsCount?: number;
	errorsCount?: number;
	avgTimeToFirstToken?: number | null;
}

export async function getModels(
	searchParams?: Record<string, string>,
): Promise<Model[] | null> {
	try {
		const cookieStore = await cookies();
		const key = "better-auth.session_token";
		const sessionCookie = cookieStore.get(key);
		const secureSessionCookie = cookieStore.get(`__Secure-${key}`);

		// Build query string from search params
		const queryParams = new URLSearchParams();

		if (searchParams) {
			Object.entries(searchParams).forEach(([key, value]) => {
				if (value) {
					queryParams.append(key, value);
				}
			});
		}

		const queryString = queryParams.toString();
		const url = `${API_URL}/internal/models${queryString ? `?${queryString}` : ""}`;
		const response = await fetch(url, {
			headers: {
				Cookie: secureSessionCookie
					? `__Secure-${key}=${secureSessionCookie.value}`
					: sessionCookie
						? `${key}=${sessionCookie.value}`
						: "",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return data.models || [];
	} catch (error) {
		console.error("Failed to fetch models:", error);
		return null;
	}
}

export async function getModel(id: string): Promise<Model | null> {
	const models = await getModels({ includeAll: "true" });
	if (!models) {
		return null;
	}
	return models.find((m) => m.id === id) || null;
}
