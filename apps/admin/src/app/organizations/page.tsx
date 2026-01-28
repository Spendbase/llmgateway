import OrganizationsIndex from "@/components/organizations/organization-index";
import { fetchServerData } from "@/lib/server-api";

import type { Organization } from "@/lib/types";

export default async function OrganizationsPage() {
	const data = await fetchServerData<{
		organizations: Organization[];
	} | null>("GET", "/admin/organizations");

	return <OrganizationsIndex organizations={data?.organizations || []} />;
}
