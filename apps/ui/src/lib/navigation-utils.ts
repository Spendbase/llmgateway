import type { Route } from "next";
import type { ReadonlyURLSearchParams } from "next/navigation";

export function buildUrlWithParams(
	basePath: string,
	searchParams: ReadonlyURLSearchParams,
	additionalParams?: Record<string, string | undefined>,
): string {
	const params = new URLSearchParams(searchParams.toString());

	// Add any additional parameters
	if (additionalParams) {
		Object.entries(additionalParams).forEach(([key, value]) => {
			if (value !== undefined) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		});
	}

	const queryString = params.toString();
	return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * @deprecated Use buildDashboardUrl instead. This function is kept for compatibility with old search param structure.
 */
export function preserveOrgAndProjectParams(
	basePath: string,
	searchParams: ReadonlyURLSearchParams,
): string {
	const params = new URLSearchParams();

	// Only preserve orgId and projectId
	const orgId = searchParams.get("orgId");
	const projectId = searchParams.get("projectId");

	if (orgId) {
		params.set("orgId", orgId);
	}
	if (projectId) {
		params.set("projectId", projectId);
	}

	const queryString = params.toString();
	return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Build a dashboard URL with the new route structure
 * Routes are now at root level (e.g., /orgId/projectId instead of /dashboard/orgId/projectId)
 */
export function buildDashboardUrl(
	orgId?: string | null,
	projectId?: string | null,
	subPath?: string,
): Route {
	if (!orgId || !projectId) {
		// Fallback to root (will redirect to proper structure)
		return "/";
	}

	const basePath = `/${orgId}/${projectId}`;
	return subPath ? (`${basePath}/${subPath}` as Route) : (basePath as Route);
}

/**
 * Build an organization-scoped URL (without project ID)
 * Routes are now at root level (e.g., /orgId instead of /dashboard/orgId)
 */
export function buildOrgUrl(orgId?: string | null, subPath?: string): string {
	if (!orgId) {
		// Fallback to root (will redirect to proper structure)
		return "/";
	}

	const basePath = `/${orgId}`;
	return subPath ? `${basePath}/${subPath}` : basePath;
}

/**
 * Build an organization URL with proper Route typing for router.push()
 * Routes are now at root level (e.g., /orgId)
 */
export function buildOrganizationUrl(orgId: string): Route {
	return `/${orgId}` as Route;
}

/**
 * Build a project URL with proper Route typing for router.push()
 * Routes are now at root level (e.g., /orgId/projectId)
 */
export function buildProjectUrl(
	organizationId: string,
	projectId: string,
	subPath?: string,
): Route {
	const basePath = `/${organizationId}/${projectId}`;
	return (subPath ? `${basePath}/${subPath}` : basePath) as Route;
}

/**
 * Extract orgId and projectId from current pathname
 * Updated to support both old /dashboard/ paths and new root-level paths
 */
export function extractOrgAndProjectFromPath(pathname: string): {
	orgId: string | null;
	projectId: string | null;
} {
	// Remove /dashboard prefix if present (for backward compatibility)
	const normalizedPath = pathname.replace(/^\/dashboard/, "");

	// Org-only pages (all under /org/ path)
	const orgOnlyMatch = normalizedPath.match(/^\/([^\/]+)\/org\//);
	if (orgOnlyMatch) {
		return {
			orgId: orgOnlyMatch[1],
			projectId: null,
		};
	}

	// Project pages (e.g., /orgId/projectId)
	const projectMatch = normalizedPath.match(/^\/([^\/]+)\/([^\/]+)/);
	if (projectMatch) {
		return {
			orgId: projectMatch[1],
			projectId: projectMatch[2],
		};
	}

	// Just org ID (e.g., /orgId)
	const orgMatch = normalizedPath.match(/^\/([^\/]+)$/);
	if (orgMatch) {
		return {
			orgId: orgMatch[1],
			projectId: null,
		};
	}

	return {
		orgId: null,
		projectId: null,
	};
}
