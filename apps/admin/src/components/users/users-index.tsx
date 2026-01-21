"use client";

import { UsersPagination } from "@/components/users/users-pagination";
import { UsersTable } from "@/components/users/users-table";

import type { UsersPaginationResponse } from "@/lib/types";

export default function UsersIndex({
	usersData,
}: {
	usersData: UsersPaginationResponse;
}) {
	const { users, pagination } = usersData;

	return (
		<div className="flex flex-1 flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Users</h1>
					<p className="text-sm text-gray-500">
						Manage and view all users in the system
					</p>
				</div>
			</div>

			{users.length === 0 ? (
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
