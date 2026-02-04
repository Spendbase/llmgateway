import { useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/lib/fetch-client";

export const useHubSpot = () => {
	const queryClient = useQueryClient();
	const api = useApi();

	const submitHubSpotFormMutation = api.useMutation(
		"post",
		"/user/me/submit-hubspot-form",
		{
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: ["user"] });
				void queryClient.invalidateQueries({ queryKey: ["session"] });
			},
		},
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
