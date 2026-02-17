import SignInPrompt from "@/components/auth/sign-in-prompt";
import { ModelsIndex } from "@/components/models/models-index";
import { getModels } from "@/lib/models";

export default async function ModelsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const params = await searchParams;

	// Remove status from API params - filtering is done on client side
	// Add includeAll to show all mappings in admin panel
	const apiParams: Record<string, string> = { ...params, includeAll: "true" };
	delete apiParams.status;

	const models = await getModels(apiParams);

	if (!models) {
		return <SignInPrompt />;
	}

	// Get all models without family filter for complete families list
	const paramsWithoutFamily: Record<string, string> = {
		...apiParams,
		includeAll: "true",
	};
	delete paramsWithoutFamily.family;
	const allModelsForFamilies = await getModels(paramsWithoutFamily);
	const allFamilies = allModelsForFamilies
		? Array.from(new Set(allModelsForFamilies.map((m) => m.family))).sort()
		: [];

	return <ModelsIndex models={models} allFamilies={allFamilies} />;
}
