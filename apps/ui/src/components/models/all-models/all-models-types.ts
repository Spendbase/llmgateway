import type { ApiModel, ApiProvider } from "@/lib/fetch-models";

export type ModelWithProviders = ApiModel;

export type SortField =
	| "name"
	| "providers"
	| "contextSize"
	| "inputPrice"
	| "outputPrice"
	| "cachedInputPrice"
	| "requestPrice";

export type SortDirection = "asc" | "desc";

export interface FiltersState {
	category: string;
	capabilities: {
		streaming: boolean;
		vision: boolean;
		tools: boolean;
		reasoning: boolean;
		jsonOutput: boolean;
		jsonOutputSchema: boolean;
		imageGeneration: boolean;
		audioTts: boolean;
		webSearch: boolean;
		free: boolean;
		discounted: boolean;
	};
	selectedProvider: string;
	inputPrice: { min: string; max: string };
	outputPrice: { min: string; max: string };
	contextSize: { min: string; max: string };
}

export interface AllModelsProps {
	children: React.ReactNode;
	models: ApiModel[];
	providers: ApiProvider[];
}
