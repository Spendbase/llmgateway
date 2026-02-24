import UsersIndex from "@/components/users/users-index";
import { PAGESIZE } from "@/lib/constants";
import { fetchServerData } from "@/lib/server-api";

import type { SortBy, SortOrder } from "@/hooks/use-users-query-params";
import type { paths } from "@/lib/api/v1";
import type { UsersPaginationResponse } from "@/lib/types";

type UsersQueryParams = NonNullable<
	paths["/admin/users"]["get"]["parameters"]["query"]
>;

export default async function UsersPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		pageSize?: string;
		sortBy?: string;
		order?: string;
		userId?: string;
		name?: string;
		email?: string;
		role?: string;
		emailStatus?: string;
		accountStatus?: string;
		registeredAtFrom?: string;
		registeredAtTo?: string;
	}>;
}) {
	const params = await searchParams;

	const page = parseInt(params.page || "1", 10);
	const pageSize = parseInt(params.pageSize || PAGESIZE.toString(), 10);

	const queryProps: UsersQueryParams = {
		page,
		pageSize,
	};

	if (params.sortBy) {
		queryProps.sortBy = params.sortBy as SortBy;
	}
	if (params.order) {
		queryProps.order = params.order as SortOrder;
	}

	if (params.userId) {
		queryProps.userId = params.userId;
	}
	if (params.name) {
		queryProps.name = params.name;
	}
	if (params.email) {
		queryProps.email = params.email;
	}

	if (params.role) {
		queryProps.role = params.role as "owner" | "admin" | "developer";
	}
	if (params.emailStatus) {
		queryProps.emailStatus = params.emailStatus as "verified" | "unverified";
	}
	if (params.accountStatus) {
		queryProps.accountStatus = params.accountStatus as "active" | "blocked";
	}

	if (params.registeredAtFrom) {
		queryProps.registeredAtFrom = params.registeredAtFrom;
	}
	if (params.registeredAtTo) {
		queryProps.registeredAtTo = params.registeredAtTo;
	}

	const usersData: UsersPaginationResponse = (await fetchServerData(
		"GET",
		"/admin/users",
		{
			params: {
				query: queryProps,
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
