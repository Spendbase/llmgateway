import {
	type ModelDefinition,
	models,
	type ProviderModelMapping,
	type WebSearchTool,
} from "@llmgateway/models";

export interface AutoRouteCapabilities {
	no_reasoning: boolean;
	reasoning_effort: string | undefined;
	tools: any[] | undefined;
	tool_choice: any;
	webSearchTool: WebSearchTool | undefined;
	response_format: { type: string } | undefined | null;
	hasImages: boolean;
}

export interface AutoRouteModelSelection {
	model: ModelDefinition;
	providers: ProviderModelMapping[];
}

/**
 * Selects the cheapest model (and its eligible providers) from the
 * allowed auto-routing whitelist that satisfies the request's
 * capability requirements and fits within the required context size.
 *
 * Returns undefined when no whitelisted model meets the constraints.
 */
export function selectAutoRouteModel(
	availableProviders: string[],
	requiredContextSize: number,
	capabilities: AutoRouteCapabilities,
	allowedModels: readonly string[],
): AutoRouteModelSelection | undefined {
	const now = new Date();
	let selectedModel: ModelDefinition | undefined;
	let selectedProviders: ProviderModelMapping[] = [];
	let lowestPrice = Number.MAX_VALUE;

	for (const modelDef of models) {
		if (!allowedModels.includes(modelDef.id)) {
			continue;
		}

		const eligibleProviders = (modelDef.providers as ProviderModelMapping[])
			.filter((p) => availableProviders.includes(p.providerId))
			.filter((p) =>
				isProviderSuitable(p, requiredContextSize, capabilities, now),
			);

		if (eligibleProviders.length === 0) {
			continue;
		}

		for (const p of eligibleProviders) {
			const avgPrice = ((p.inputPrice || 0) + (p.outputPrice || 0)) / 2;
			if (avgPrice < lowestPrice) {
				lowestPrice = avgPrice;
				selectedModel = modelDef as ModelDefinition;
				selectedProviders = eligibleProviders;
			}
		}
	}

	if (!selectedModel) {
		return undefined;
	}

	return { model: selectedModel, providers: selectedProviders };
}

function isProviderSuitable(
	provider: ProviderModelMapping,
	requiredContextSize: number,
	capabilities: AutoRouteCapabilities,
	now: Date,
): boolean {
	const {
		no_reasoning,
		reasoning_effort,
		tools,
		tool_choice,
		webSearchTool,
		response_format,
		hasImages,
	} = capabilities;

	if (provider.deprecatedAt && now > provider.deprecatedAt) {
		return false;
	}

	if ((provider.contextSize ?? 8192) < requiredContextSize) {
		return false;
	}

	if (no_reasoning && provider.reasoning === true) {
		return false;
	}

	if (reasoning_effort !== undefined && provider.reasoning !== true) {
		return false;
	}

	if (
		(tools !== undefined || tool_choice !== undefined) &&
		provider.tools !== true
	) {
		return false;
	}

	if (webSearchTool && provider.webSearch !== true) {
		return false;
	}

	if (
		(response_format?.type === "json_object" ||
			response_format?.type === "json_schema") &&
		provider.jsonOutput !== true
	) {
		return false;
	}

	if (
		response_format?.type === "json_schema" &&
		provider.jsonOutputSchema !== true
	) {
		return false;
	}

	if (hasImages && provider.vision !== true) {
		return false;
	}

	return true;
}
