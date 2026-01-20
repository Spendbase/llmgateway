import OrganizationsIndex from "@/components/organizations/organization-index";
import { fetchServerData } from "@/lib/server-api";

import type { Organization } from "@/lib/types";

export default async function OrganizationsPage() {
	const { organizations }: { organizations: Organization[] } =
		(await fetchServerData("GET", "/admin/organizations")) || {
			organizations: [],
		};

	return <OrganizationsIndex organizations={organizations} />;
}
