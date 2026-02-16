import { cookies } from "next/headers";

const API_URL = process.env.API_BACKEND_URL || "http://localhost:4002";

export interface ModelProviderMapping {
	id: string;
	createdAt: Date;
	modelId: string;
	providerId: string;
	modelName: string;
	inputPrice: number | null;
	outputPrice: number | null;
	cachedInputPrice: number | null;
	imageInputPrice: number | null;
	requestPrice: number | null;
	contextSize: number | null;
	maxOutput: number | null;
	streaming: boolean;
	vision: boolean | null;
	reasoning: boolean | null;
	reasoningOutput: string | null;
	tools: boolean | null;
	jsonOutput: boolean | null;
	jsonOutputSchema: boolean | null;
	webSearch: boolean | null;
	discount: number | null;
	stability: "stable" | "beta" | "unstable" | "experimental" | null;
	supportedParameters: string[] | null;
	deprecatedAt: Date | null;
	deactivatedAt: Date | null;
	deactivationReason: string | null;
	status: "active" | "inactive" | "deactivated";
}

export interface Model {
	id: string;
	createdAt: Date;
	updatedAt?: Date;
	releasedAt: Date | null;
	name: string | null;
	aliases: string[] | null;
	description: string | null;
	family: string;
	free: boolean | null;
	output: string[] | null;
	stability: "stable" | "beta" | "unstable" | "experimental" | null;
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
