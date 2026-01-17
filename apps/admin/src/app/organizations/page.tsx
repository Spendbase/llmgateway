import { OrganizationsTable } from "@/components/organizations/organizations-table";
import { fetchServerData } from "@/lib/server-api";

export default async function OrganizationsPage() {
	const initialOrganizationsData = await fetchServerData(
		"GET",
		"/admin/organizations",
	);

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Organizations</h1>
			<OrganizationsTable initialOrganizationsData={initialOrganizationsData} />
		</div>
	);
}
