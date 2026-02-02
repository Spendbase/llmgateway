"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { useMemo, useCallback } from "react";

import { useUser } from "@/hooks/useUser";
import { useApi } from "@/lib/fetch-client";
import { buildOrganizationUrl, buildProjectUrl } from "@/lib/navigation-utils";

import type { Organization, Project } from "@/lib/types";

interface UseDashboardStateProps {
	initialOrganizationsData?: unknown;
	initialProjectsData?: unknown;
	selectedOrgId?: string;
	selectedProjectId?: string;
	onOrganizationChange?: (orgId: string) => void;
}

export function useDashboardState({
	initialOrganizationsData,
	initialProjectsData,
	selectedOrgId,
	selectedProjectId,
	onOrganizationChange,
}: UseDashboardStateProps = {}) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useParams();
	const api = useApi();

	useUser({ redirectTo: "/login", redirectWhen: "unauthenticated" });

	// Fetch organizations with shorter cache time and refetch on focus
	const { data: organizationsData } = api.useQuery(
		"get",
		"/orgs",
		{},
		{
			initialData: initialOrganizationsData as
				| { organizations: Organization[] }
				| undefined,
			staleTime: 30 * 1000, // 30 seconds (reduced from 5 minutes)
			refetchOnWindowFocus: true, // Enable refetch when tab regains focus
		},
	);
	const organizations = useMemo(
		() => organizationsData?.organizations || [],
		[organizationsData?.organizations],
	);

	// Derive selected organization from URL params or props or default to first
	const selectedOrganization = useMemo(() => {
		const activeOrgId = (params?.orgId as string) || selectedOrgId;
		const found = activeOrgId
			? organizations.find((org) => org.id === activeOrgId)
			: null;
		return found || organizations[0] || null;
	}, [params?.orgId, selectedOrgId, organizations]);

	// Fetch projects for selected organization
	const { data: projectsData } = api.useQuery(
		"get",
		"/orgs/{id}/projects",
		{
			params: {
				path: {
					id: selectedOrganization?.id || "",
				},
			},
		},
		{
			enabled: !!selectedOrganization?.id,
			initialData: initialProjectsData as { projects: Project[] } | undefined,
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchOnWindowFocus: false,
		},
	);

	// Get current projects from query data
	const projects = useMemo(
		() => projectsData?.projects || [],
		[projectsData?.projects],
	);

	// Derive selected project from props
	const selectedProject = useMemo(() => {
		if (selectedProjectId && projects.length > 0) {
			return (
				projects.find((project) => project.id === selectedProjectId) || null
			);
		}
		return projects[0] || null;
	}, [selectedProjectId, projects]);

	// Navigation functions for the new route structure (without /dashboard prefix)
	const handleOrganizationCreated = useCallback(
		(org: Organization) => {
			// Navigate to the new organization with first project
			router.push(buildOrganizationUrl(org.id));
		},
		[router],
	);

	const handleProjectCreated = useCallback(
		(project: Project) => {
			// Navigate to the new project
			router.push(buildProjectUrl(project.organizationId, project.id));
		},
		[router],
	);

	const handleOrganizationSelect = useCallback(
		(org: Organization | null) => {
			if (org?.id) {
				if (onOrganizationChange) {
					onOrganizationChange(org.id);
				} else {
					// Fallback to default navigation if no callback provided
					router.push(buildOrganizationUrl(org.id));
				}
			}
		},
		[router, onOrganizationChange],
	);

	const handleProjectSelect = useCallback(
		(project: Project | null) => {
			if (project?.id) {
				// Extract the current page from pathname (e.g., 'api-keys', 'provider-keys', etc.)
				// Normalized path: /[orgId]/[projectId]/[page]
				const normalizedPath = pathname.replace(/^\/dashboard/, "");
				const pathParts = normalizedPath.split("/").filter(Boolean);
				const currentPage = pathParts[2]; // [orgId]/[projectId]/[page]

				if (currentPage && pathParts.length > 2) {
					// Preserve the current page when changing projects
					router.push(
						buildProjectUrl(project.organizationId, project.id, currentPage),
					);
				} else {
					// Navigate to the new project dashboard
					router.push(buildProjectUrl(project.organizationId, project.id));
				}
			}
		},
		[router, pathname],
	);

	return {
		selectedOrganization,
		selectedProject,
		organizations,
		projects,
		handleOrganizationSelect,
		handleProjectSelect,
		handleOrganizationCreated,
		handleProjectCreated,
	};
}
