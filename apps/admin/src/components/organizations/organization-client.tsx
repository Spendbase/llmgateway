"use client";

import { Activity, Loader2 } from "lucide-react";

import SignInPrompt from "@/components/auth/sign-in-prompt";
import { CustomBadge as Badge } from "@/components/ui/custom-badge";
import { useUser } from "@/hooks/useUser";

import { OrganizationsFilters } from "./organizations-filters";
import { OrganizationsPagination } from "./organizations-pagination";
import { OrganizationsSearch } from "./organizations-search";
import { OrganizationsTable } from "./organizations-table";

import type { OrganizationsPaginationResponse } from "@/lib/types";

export default function OrganizationClient({
	organizationsData,
	search,
	plans,
	statuses,
}: {
	organizationsData: OrganizationsPaginationResponse;
	search: string;
	plans: string[];
	statuses: string[];
}) {
	const { user, isLoading } = useUser();
	const { organizations, suggestions, pagination } = organizationsData;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!user?.isAdmin) {
		return <SignInPrompt />;
	}

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
			<header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Organizations
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Search, filter and manage organizations
					</p>
				</div>
				<Badge variant="default">
					{pagination.totalOrganizations} organization
					{pagination.totalOrganizations !== 1 ? "s" : ""}
				</Badge>
			</header>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<OrganizationsSearch suggestions={suggestions} />
					<OrganizationsFilters plans={plans} statuses={statuses} />
				</div>
			</div>

			{organizations.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Activity className="mb-4 h-12 w-12 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">
						No organizations found for current search and filters
					</p>
				</div>
			) : (
				<div className="space-y-4">
					<OrganizationsTable
						organizations={organizations}
						searchQuery={search}
					/>
					<OrganizationsPagination
						currentPage={pagination.page}
						totalPages={pagination.totalPages}
						pageSize={pagination.pageSize}
						totalOrganizations={pagination.totalOrganizations}
					/>
				</div>
			)}
		</div>
	);
}
