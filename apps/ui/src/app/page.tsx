import { redirect } from "next/navigation";

import { getLastUsedProjectId } from "@/lib/last-used-project-server";
import { fetchServerData } from "@/lib/server-api";

import type { User } from "@/lib/types";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default async function RootPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	// Fetch user data server-side
	const initialUserData = await fetchServerData<
		{ user: User } | undefined | null
	>("GET", "/user/me");

	// Redirect to login if not authenticated
	if (!initialUserData?.user) {
		redirect("/login");
	}

	const params = await searchParams;

	const emailVerifiedParam =
		typeof params.emailVerified === "string" ? params.emailVerified : undefined;

	const querySuffix = emailVerifiedParam
		? `?emailVerified=${encodeURIComponent(emailVerifiedParam)}`
		: "";

	// Fetch organizations server-side
	const initialOrganizationsData = await fetchServerData("GET", "/orgs");

	// Check if organizations data is null (API error)
	if (!initialOrganizationsData) {
		// Show error page or redirect to onboarding
		redirect("/onboarding");
	}

	// Determine default organization and project for redirect
	if (
		initialOrganizationsData &&
		typeof initialOrganizationsData === "object"
	) {
		const data = initialOrganizationsData as {
			organizations?: Array<{ id: string; name: string }>;
		};

		if (data.organizations && data.organizations.length > 0) {
			const defaultOrgId = data.organizations[0].id;

			// Fetch projects for the default organization
			const projectsData = await fetchServerData("GET", "/orgs/{id}/projects", {
				params: {
					path: {
						id: defaultOrgId,
					},
				},
			});

			// Check if projects data is null (API error)
			if (!projectsData) {
				redirect(`/${defaultOrgId}${querySuffix}`);
			}

			if (projectsData && typeof projectsData === "object") {
				const projects = projectsData as {
					projects?: Array<{ id: string; name: string }>;
				};

				if (projects.projects && projects.projects.length > 0) {
					// Check for last used project first, fallback to first project
					const lastUsedProjectId = await getLastUsedProjectId(defaultOrgId);
					const defaultProjectId =
						lastUsedProjectId &&
						projects.projects.some((p) => p.id === lastUsedProjectId)
							? lastUsedProjectId
							: projects.projects[0].id;

					// Redirect to the proper route structure (without /dashboard prefix)
					redirect(`/${defaultOrgId}/${defaultProjectId}${querySuffix}`);
				}
			}

			// If no projects found, redirect to organization level
			redirect(`/${defaultOrgId}${querySuffix}`);
		}
	}

	// If no organizations found, redirect to onboarding
	redirect(`/onboarding${querySuffix}`);
}
