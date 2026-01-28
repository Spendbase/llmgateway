import UsersIndex from "@/components/users/users-index";
import { PAGESIZE } from "@/lib/constants";
import { fetchServerData } from "@/lib/server-api";

import type { UsersPaginationResponse } from "@/lib/types";

export default async function UsersPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
	const params = await searchParams;
	const page = params.page || "1";
	const pageSize = params.pageSize || PAGESIZE;

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
			pageSize: PAGESIZE,
			totalUsers: 0,
			totalPages: 0,
		},
	};

	return <UsersIndex usersData={usersData} />;
}
