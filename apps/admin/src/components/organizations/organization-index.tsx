"use client";

import SignInPrompt from "@/components/auth/sign-in-prompt";
import { useUser } from "@/hooks/useUser";

import { OrganizationsTable } from "./organizations-table";

import type { Organization } from "@/lib/types";

export default function OrganizationPage({
	organizations,
}: {
	organizations: Organization[];
}) {
	const { user, isLoading } = useUser();

	if ((!isLoading && !user?.isAdmin) || isLoading) {
		return <SignInPrompt />;
	}

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
			<header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Organizations
					</h1>
				</div>
			</header>
			<OrganizationsTable organizations={organizations} />
		</div>
	);
}
