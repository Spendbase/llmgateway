import { cookies } from "next/headers";

import TtsPageClient from "@/components/playground/tts-page-client";
import { fetchModels } from "@/lib/fetch-models";
import { fetchServerData } from "@/lib/server-api";

import type { ApiModel } from "@/lib/fetch-models";
import type { Organization, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TtsPage({
	searchParams,
}: {
	searchParams: Promise<{ orgId?: string; projectId?: string }>;
}) {
	const params = await searchParams;
	const { orgId, projectId } = params;

	const audioModels: ApiModel[] = await fetchModels("audio");

	const initialOrganizationsData = await fetchServerData("GET", "/orgs");

	const organizations = (
		initialOrganizationsData &&
		typeof initialOrganizationsData === "object" &&
		"organizations" in initialOrganizationsData
			? (initialOrganizationsData as { organizations: Organization[] })
					.organizations
			: []
	) as Organization[];

	const selectedOrganization =
		(orgId ? organizations.find((o) => o.id === orgId) : organizations[0]) ??
		null;

	let initialProjectsData: { projects: Project[] } | null = null;
	if (selectedOrganization?.id) {
		try {
			initialProjectsData = (await fetchServerData(
				"GET",
				"/orgs/{id}/projects",
				{
					params: {
						path: {
							id: selectedOrganization.id,
						},
					},
				},
			)) as { projects: Project[] };
		} catch {
			// continue without projects
		}
	}

	const projects = (initialProjectsData?.projects || []) as Project[];

	let selectedProject: Project | null = null;
	if (projectId) {
		selectedProject = projects.find((p) => p.id === projectId) || null;
	} else if (selectedOrganization?.id) {
		const cookieStore = await cookies();
		const cookieName = `llmgateway-last-used-project-${selectedOrganization.id}`;
		const lastUsed = cookieStore.get(cookieName)?.value;
		if (lastUsed) {
			selectedProject = projects.find((p) => p.id === lastUsed) || null;
		}
	}
	if (!selectedProject) {
		selectedProject = projects[0] || null;
	}

	return (
		<TtsPageClient
			organizations={organizations}
			selectedOrganization={selectedOrganization}
			projects={projects}
			selectedProject={selectedProject}
			audioModels={audioModels}
		/>
	);
}
