"use client";

import { useApi } from "@/lib/fetch-client";

export function useOrgOverview(orgId: string) {
	const api = useApi();
	return api.useQuery(
		"get",
		"/admin/organizations/{id}",
		{
			params: { path: { id: orgId } },
		},
		{ refetchInterval: 30_000 },
	);
}

export function useOrgApiKeys(
	orgId: string,
	page: number,
	pageSize: number,
	status?: "active" | "inactive" | "deleted",
	search?: string,
) {
	const api = useApi();
	return api.useQuery(
		"get",
		"/admin/organizations/{id}/api-keys",
		{
			params: {
				path: { id: orgId },
				query: {
					page,
					pageSize,
					...(status ? { status } : {}),
					...(search ? { search } : {}),
				},
			},
		},
		{ refetchInterval: 30_000 },
	);
}

export function useOrgUsage(orgId: string, months = 12) {
	const api = useApi();
	return api.useQuery(
		"get",
		"/admin/organizations/{id}/usage",
		{
			params: {
				path: { id: orgId },
				query: { months },
			},
		},
		{ refetchInterval: 60_000 },
	);
}

export function useOrgMembers(
	orgId: string,
	page: number,
	pageSize: number,
	search?: string,
) {
	const api = useApi();
	return api.useQuery(
		"get",
		"/admin/organizations/{id}/members",
		{
			params: {
				path: { id: orgId },
				query: {
					page,
					pageSize,
					...(search ? { search } : {}),
				},
			},
		},
		{ refetchInterval: 30_000 },
	);
}

export function useOrgProjects(orgId: string, page: number, pageSize: number) {
	const api = useApi();
	return api.useQuery(
		"get",
		"/admin/organizations/{id}/projects",
		{
			params: {
				path: { id: orgId },
				query: { page, pageSize },
			},
		},
		{ refetchInterval: 30_000 },
	);
}

export interface OrgLogsFilters {
	apiKeyId?: string;
	from?: string;
	to?: string;
	unifiedFinishReason?: string;
	provider?: string;
	model?: string;
	customHeaderKey?: string;
	customHeaderValue?: string;
}

export function useOrgLogs(
	orgId: string,
	page: number,
	pageSize: number,
	filters: OrgLogsFilters = {},
) {
	const api = useApi();
	const {
		apiKeyId,
		from,
		to,
		unifiedFinishReason,
		provider,
		model,
		customHeaderKey,
		customHeaderValue,
	} = filters;
	return api.useQuery(
		"get",
		"/admin/organizations/{id}/logs",
		{
			params: {
				path: { id: orgId },
				query: {
					page,
					pageSize,
					...(apiKeyId ? { apiKeyId } : {}),
					...(from ? { from } : {}),
					...(to ? { to } : {}),
					...(unifiedFinishReason ? { unifiedFinishReason } : {}),
					...(provider ? { provider } : {}),
					...(model ? { model } : {}),
					...(customHeaderKey ? { customHeaderKey } : {}),
					...(customHeaderValue ? { customHeaderValue } : {}),
				},
			},
		},
		{ refetchInterval: 30_000 },
	);
}

export function useOrgLogsFilters(orgId: string) {
	const api = useApi();
	return api.useQuery(
		"get",
		"/admin/organizations/{id}/logs/filters",
		{
			params: { path: { id: orgId } },
		},
		{ staleTime: 5 * 60 * 1000 },
	);
}

export function useOrgDeposits(
	orgId: string,
	page: number,
	pageSize: number,
	from?: string,
	to?: string,
) {
	const api = useApi();
	return api.useQuery(
		"get",
		"/admin/organizations/{id}/deposits",
		{
			params: {
				path: { id: orgId },
				query: {
					page,
					pageSize,
					...(from ? { from } : {}),
					...(to ? { to } : {}),
				},
			},
		},
		{ refetchInterval: 60_000 },
	);
}
