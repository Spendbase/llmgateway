"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
	exportMultiSheetXlsx,
	exportAllSectionsCsv,
	type ExportSheet,
} from "@/lib/export-utils";
import { useFetchClient } from "@/lib/fetch-client";

function fmtDate(date: string | null | undefined) {
	if (!date) {
		return "";
	}
	return new Date(date).toLocaleDateString("en", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

type ExportFormat = "xlsx" | "csv";

async function fetchAllSections(
	fetchClient: ReturnType<typeof useFetchClient>,
	orgId: string,
) {
	const [apiKeysRes, usageRes, membersRes, projectsRes, depositsRes] =
		await Promise.all([
			fetchClient.GET("/admin/organizations/{id}/api-keys", {
				params: {
					path: { id: orgId },
					query: { page: 1, pageSize: 1000 },
				},
			}),
			fetchClient.GET("/admin/organizations/{id}/usage", {
				params: { path: { id: orgId }, query: { months: 24 } },
			}),
			fetchClient.GET("/admin/organizations/{id}/members", {
				params: { path: { id: orgId } },
			}),
			fetchClient.GET("/admin/organizations/{id}/projects", {
				params: { path: { id: orgId } },
			}),
			fetchClient.GET("/admin/organizations/{id}/deposits", {
				params: {
					path: { id: orgId },
					query: { page: 1, pageSize: 1000 },
				},
			}),
		]);

	const errors = [
		apiKeysRes.error && "API Keys",
		usageRes.error && "Usage",
		membersRes.error && "Members",
		projectsRes.error && "Projects",
		depositsRes.error && "Deposits",
	].filter(Boolean);

	if (errors.length > 0) {
		throw new Error(`Failed to fetch: ${errors.join(", ")}`);
	}

	return { apiKeysRes, usageRes, membersRes, projectsRes, depositsRes };
}

function buildSheets(
	data: Awaited<ReturnType<typeof fetchAllSections>>,
): ExportSheet[] {
	const { apiKeysRes, usageRes, membersRes, projectsRes, depositsRes } = data;

	return [
		{
			name: "API Keys",
			rows: (apiKeysRes.data?.apiKeys ?? []).map((k) => ({
				Description: k.description ?? "",
				Project: k.projectName ?? k.projectId,
				Status: k.status,
				Created: fmtDate(k.createdAt),
				"Last Used": fmtDate(k.lastUsedAt),
				"Spend ($)": k.usage !== null ? Number(k.usage).toFixed(4) : "",
				"Limit ($)":
					k.usageLimit !== null ? Number(k.usageLimit).toFixed(2) : "",
			})),
		},
		{
			name: "Usage",
			rows: (usageRes.data?.months ?? []).map((m) => ({
				Month: m.month,
				Requests: m.requests,
				"Input Tokens": m.promptTokens,
				"Output Tokens": m.completionTokens + m.reasoningTokens,
				"Total Tokens": m.totalTokens,
				"Cost ($)": m.cost,
			})),
		},
		{
			name: "Members",
			rows: (membersRes.data?.members ?? []).map((m) => ({
				Email: m.email,
				Name: m.name ?? "",
				Role: m.role,
				Status: m.status,
				"Last Login": fmtDate(m.lastLoginAt),
				Joined: fmtDate(m.joinedAt),
			})),
		},
		{
			name: "Projects",
			rows: (projectsRes.data?.projects ?? []).map((p) => ({
				Name: p.name,
				Status: p.status,
				Mode: p.mode,
				Caching: p.cachingEnabled ? "Yes" : "No",
				"Active API Keys": p.activeApiKeysCount,
				Created: fmtDate(p.createdAt),
			})),
		},
		{
			name: "Deposits",
			rows: (depositsRes.data?.deposits ?? []).map((d) => ({
				Date: fmtDate(d.createdAt),
				Type: d.type,
				Status: d.status,
				"Amount ($)": d.amount !== null ? Number(d.amount).toFixed(2) : "",
				"Credits ($)":
					d.creditAmount !== null ? Number(d.creditAmount).toFixed(2) : "",
				Currency: d.currency.toUpperCase(),
				Description: d.description ?? "",
			})),
		},
	];
}

export function useOrgExportAll(orgId: string, orgName: string) {
	const fetchClient = useFetchClient();
	const [loading, setLoading] = useState(false);

	const slug = orgName.replace(/\s+/g, "-").toLowerCase();

	const run = async (format: ExportFormat) => {
		setLoading(true);
		const toastId = toast.loading("Fetching data…");
		try {
			const data = await fetchAllSections(fetchClient, orgId);
			const sheets = buildSheets(data);

			const totalRows = sheets.reduce((s, sh) => s + sh.rows.length, 0);
			if (totalRows === 0) {
				toast.warning("No data to export", { id: toastId });
				return;
			}

			if (format === "xlsx") {
				exportMultiSheetXlsx(`org-${slug}-export`, sheets);
			} else {
				exportAllSectionsCsv(`org-${slug}-export`, sheets);
			}

			toast.success("Export ready", { id: toastId });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Export failed";
			toast.error(msg, { id: toastId });
		} finally {
			setLoading(false);
		}
	};

	return { run, loading };
}
