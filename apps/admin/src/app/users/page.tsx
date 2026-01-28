import UsersIndex from "@/components/users/users-index";
import { fetchServerData } from "@/lib/server-api";

import type { UsersPaginationResponse } from "@/lib/types";

export default async function UsersPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
	const params = await searchParams;
	const page = params.page || "1";
	const pageSize = params.pageSize || "20";

	const usersData: UsersPaginationResponse = (await fetchServerData(
		"GET",
		"/admin/users",
		{
			params: {
				query: {
					page,
					pageSize,
				},
			},
		},
	)) || {
		users: [],
		pagination: {
			page: 1,
			pageSize: 20,
			totalUsers: 0,
			totalPages: 0,
		},
	};

	return <UsersIndex usersData={usersData} />;
}
