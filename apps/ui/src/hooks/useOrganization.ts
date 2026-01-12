import { useApi } from "@/lib/fetch-client";

import type { Organization } from "@/lib/types";

export interface OrganizationsResponse {
	organizations: Organization[];
}

export function useDefaultOrganization() {
	const api = useApi();
	const { data, error } = api.useSuspenseQuery("get", "/orgs");

	if (!data?.organizations || data.organizations.length === 0) {
		return {
			data: null,
			error: error || new Error("No organizations found"),
		};
	}

	// Override plan to always be "pro" (paywall removed)
	const organization = data.organizations[0];
	return {
		data: organization ? { ...organization, plan: "pro" as const } : null,
		error,
	};
}
