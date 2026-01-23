import { cookies } from "next/headers";

const API_URL = process.env.API_BACKEND_URL || "http://localhost:4002";

interface ModelProviderMapping {
	id: string;
	createdAt: Date;
	modelId: string;
	providerId: string;
	modelName: string;
	inputPrice: string | null;
	outputPrice: string | null;
	cachedInputPrice: string | null;
	imageInputPrice: string | null;
	requestPrice: string | null;
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
	discount: string | null;
	stability: "stable" | "beta" | "unstable" | "experimental" | null;
	supportedParameters: string[] | null;
	deprecatedAt: Date | null;
	deactivatedAt: Date | null;
	status: "active" | "inactive";
}

export interface Model {
	id: string;
	createdAt: Date;
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

export async function getModels(): Promise<Model[] | null> {
	try {
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get("better-auth.session_token");

		if (!sessionCookie) {
			return null;
		}

		const response = await fetch(`${API_URL}/internal/models`, {
			headers: {
				Cookie: `better-auth.session_token=${sessionCookie.value}`,
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
	const models = await getModels();
	if (!models) {
		return null;
	}
	return models.find((m) => m.id === id) || null;
}
