import { useApi } from "@/lib/fetch-client";

export const useHubSpot = () => {
	const api = useApi();

	const submitHubSpotFormMutation = api.useMutation(
		"post",
		"/user/me/submit-hubspot-form",
	);

	const submitHubSpotForm = async (
		pageUri: string,
		pageName: string,
		referral: string,
	) => {
		return await submitHubSpotFormMutation.mutateAsync({
			body: { pageUri, pageName, referral },
		});
	};

	return {
		submitHubSpotForm,
	};
};
