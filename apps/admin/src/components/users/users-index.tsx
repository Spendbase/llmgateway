"use client";

import { FilterX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UsersPagination } from "@/components/users/users-pagination";
import { UsersTable } from "@/components/users/users-table";
import { useUsersQueryParams } from "@/hooks/use-users-query-params";

import type { UsersPaginationResponse } from "@/lib/types";

export default function UsersIndex({
	usersData,
}: {
	usersData: UsersPaginationResponse;
}) {
	const { users, pagination } = usersData;
	const { hasActiveFilters, clearAllFilters } = useUsersQueryParams();

	return (
		<div className="flex flex-1 flex-col gap-4 p-6 min-w-0 overflow-x-hidden">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Users</h1>
					<p className="text-sm text-gray-500">
						Manage and view all users in the system
					</p>
				</div>
				{hasActiveFilters && (
					<Button
						variant="outline"
						size="sm"
						onClick={clearAllFilters}
						className="h-8 flex items-center gap-2"
					>
						<FilterX className="h-4 w-4" />
						Clear All Filters
					</Button>
				)}
			</div>

			{users.length === 0 && !hasActiveFilters ? (
				<div className="rounded-md border p-8 text-center text-gray-500">
					No users found
				</div>
			) : (
				<>
					<UsersTable users={users} />
					<UsersPagination
						currentPage={pagination.page}
						totalPages={pagination.totalPages}
						pageSize={pagination.pageSize}
						totalUsers={pagination.totalUsers}
					/>
				</>
			)}
		</div>
	);
}
