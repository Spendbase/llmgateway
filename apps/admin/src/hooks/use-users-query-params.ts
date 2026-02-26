import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type SortBy =
	| "createdAt"
	| "name"
	| "email"
	| "status"
	| "emailVerified"
	| "id"
	| "referral";
export type SortOrder = "asc" | "desc";

export interface UsersQueryParams {
	page: number;
	pageSize: number;
	sortBy?: SortBy;
	order?: SortOrder;
	userId?: string;
	name?: string;
	email?: string;
	referral?: string;
	role?: "owner" | "admin" | "developer";
	emailStatus?: "verified" | "unverified";
	accountStatus?: "active" | "blocked";
	registeredAtFrom?: string;
	registeredAtTo?: string;
}

export function useUsersQueryParams() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const query = useMemo(() => {
		const parsedPage = parseInt(searchParams.get("page") || "1", 10);
		const parsedPageSize = parseInt(searchParams.get("pageSize") || "20", 10);

		const q: UsersQueryParams = {
			page: Number.isNaN(parsedPage) ? 1 : parsedPage,
			pageSize: Number.isNaN(parsedPageSize) ? 20 : parsedPageSize,
		};

		const sortBy = searchParams.get("sortBy");
		if (
			sortBy === "createdAt" ||
			sortBy === "name" ||
			sortBy === "email" ||
			sortBy === "status" ||
			sortBy === "emailVerified" ||
			sortBy === "id" ||
			sortBy === "referral"
		) {
			q.sortBy = sortBy as SortBy;
		}

		const order = searchParams.get("order");
		if (order === "asc" || order === "desc") {
			q.order = order as SortOrder;
		}

		const userId = searchParams.get("userId");
		if (userId) {
			q.userId = userId.trim();
		}

		const name = searchParams.get("name");
		if (name) {
			q.name = name.trim();
		}

		const email = searchParams.get("email");
		if (email) {
			q.email = email.trim();
		}

		const referral = searchParams.get("referral");
		if (referral) {
			q.referral = referral.trim();
		}

		const role = searchParams.get("role");
		if (role === "owner" || role === "admin" || role === "developer") {
			q.role = role;
		}

		const emailStatus = searchParams.get("emailStatus");
		if (emailStatus === "verified" || emailStatus === "unverified") {
			q.emailStatus = emailStatus;
		}

		const accountStatus = searchParams.get("accountStatus");
		if (accountStatus === "active" || accountStatus === "blocked") {
			q.accountStatus = accountStatus;
		}

		const registeredAtFrom = searchParams.get("registeredAtFrom");
		if (registeredAtFrom) {
			q.registeredAtFrom = registeredAtFrom;
		}

		const registeredAtTo = searchParams.get("registeredAtTo");
		if (registeredAtTo) {
			q.registeredAtTo = registeredAtTo;
		}

		return q;
	}, [searchParams]);

	const setQuery = useCallback(
		(
			updates: Partial<UsersQueryParams>,
			options?: { replace?: boolean; resetPage?: boolean },
		) => {
			const currentParams = new URLSearchParams(searchParams.toString());

			let filtersChanged = false;

			Object.entries(updates).forEach(([key, value]) => {
				if (value === undefined || value === null || value === "") {
					if (currentParams.has(key)) {
						currentParams.delete(key);
						if (key !== "page" && key !== "pageSize") {
							filtersChanged = true;
						}
					}
				} else {
					const stringValue = String(value).trim();
					if (currentParams.get(key) !== stringValue) {
						currentParams.set(key, stringValue);
						if (key !== "page" && key !== "pageSize") {
							filtersChanged = true;
						}
					}
				}
			});

			// If filters or sorting changed, map behavior is to reset page to 1
			// unless explicitly forbidden. By default, any non-pagination change resets page.
			const shouldResetPage =
				options?.resetPage !== undefined ? options.resetPage : filtersChanged;

			if (shouldResetPage) {
				currentParams.set("page", "1");
			}

			const url = `${pathname}?${currentParams.toString()}`;

			if (options?.replace) {
				router.replace(url);
			} else {
				router.push(url);
			}
		},
		[searchParams, pathname, router],
	);

	const clearAllFilters = useCallback(() => {
		const currentParams = new URLSearchParams(searchParams.toString());

		// Keep sorting and pagination
		const pageSize = currentParams.get("pageSize");
		const sortBy = currentParams.get("sortBy");
		const order = currentParams.get("order");

		// Clear everything
		const newParams = new URLSearchParams();

		if (sortBy) {
			newParams.set("sortBy", sortBy);
		}
		if (order) {
			newParams.set("order", order);
		}
		if (pageSize) {
			newParams.set("pageSize", pageSize);
		}

		// Reset page to 1 when clearing filters
		newParams.set("page", "1");

		router.push(`${pathname}?${newParams.toString()}`);
	}, [searchParams, pathname, router]);

	const hasActiveFilters = useMemo(() => {
		return (
			!!query.userId ||
			!!query.name ||
			!!query.email ||
			!!query.role ||
			!!query.emailStatus ||
			!!query.accountStatus ||
			!!query.registeredAtFrom ||
			!!query.registeredAtTo
		);
	}, [query]);

	return {
		query,
		setQuery,
		clearAllFilters,
		hasActiveFilters,
	};
}
