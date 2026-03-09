"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useOrgLogs, useOrgLogsFilters } from "@/hooks/use-org-section-query";

import { LogCard } from "./log-card";

import type { OrgLogsResponse } from "@/lib/types";
import type { Log } from "@llmgateway/db";

const UNIFIED_FINISH_REASONS = [
	"completed",
	"length_limit",
	"content_filter",
	"tool_calls",
	"gateway_error",
	"upstream_error",
	"canceled",
	"unknown",
] as const;

interface OrgLogsSectionProps {
	orgId: string;
	initialData: OrgLogsResponse;
}

export function OrgLogsSection({ orgId, initialData }: OrgLogsSectionProps) {
	const [page, setPage] = useState(1);
	const [apiKeyId, setApiKeyId] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [unifiedFinishReason, setUnifiedFinishReason] = useState("");
	const [provider, setProvider] = useState("");
	const [model, setModel] = useState("");
	const [customHeaderKey, setCustomHeaderKey] = useState("");
	const [customHeaderValue, setCustomHeaderValue] = useState("");

	const { data: filtersData } = useOrgLogsFilters(orgId);

	const resetPage = () => setPage(1);

	const { data } = useOrgLogs(orgId, page, 20, {
		apiKeyId: apiKeyId || undefined,
		from: from ? new Date(from).toISOString() : undefined,
		to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
		unifiedFinishReason: unifiedFinishReason || undefined,
		provider: provider || undefined,
		model: model || undefined,
		customHeaderKey: customHeaderKey || undefined,
		customHeaderValue: customHeaderValue || undefined,
	});

	const result = data ?? initialData;
	const logs = result.logs as Partial<Log>[];
	const pagination = result.pagination;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-2 sticky top-0 bg-background z-10 py-2">
				<Input
					type="date"
					value={from}
					onChange={(e) => {
						setFrom(e.target.value);
						resetPage();
					}}
					className="h-9 w-[140px] text-xs"
					placeholder="From"
				/>
				<Input
					type="date"
					value={to}
					onChange={(e) => {
						setTo(e.target.value);
						resetPage();
					}}
					className="h-9 w-[140px] text-xs"
					placeholder="To"
				/>

				<Select
					value={unifiedFinishReason || "all"}
					onValueChange={(v) => {
						setUnifiedFinishReason(v === "all" ? "" : v);
						resetPage();
					}}
				>
					<SelectTrigger className="w-[190px]">
						<SelectValue placeholder="All unified reasons" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All unified reasons</SelectItem>
						{UNIFIED_FINISH_REASONS.map((r) => (
							<SelectItem key={r} value={r}>
								{r.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={provider || "all"}
					onValueChange={(v) => {
						setProvider(v === "all" ? "" : v);
						resetPage();
					}}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="All providers" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All providers</SelectItem>
						{(filtersData?.providers ?? []).map((p) => (
							<SelectItem key={p} value={p}>
								{p}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={model || "all"}
					onValueChange={(v) => {
						setModel(v === "all" ? "" : v);
						resetPage();
					}}
				>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="All models" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All models</SelectItem>
						{(filtersData?.models ?? []).map((m) => (
							<SelectItem key={m} value={m}>
								{m}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Input
					placeholder="Custom header key (e.g., uid)"
					value={customHeaderKey}
					onChange={(e) => {
						setCustomHeaderKey(e.target.value);
						resetPage();
					}}
					className="h-9 w-[200px] text-xs"
				/>

				<Input
					placeholder="Custom header value (e.g., 12345)"
					value={customHeaderValue}
					onChange={(e) => {
						setCustomHeaderValue(e.target.value);
						resetPage();
					}}
					className="h-9 w-[200px] text-xs"
				/>

				<Input
					className="h-9 w-[200px] font-mono text-xs"
					placeholder="Filter by API Key ID..."
					value={apiKeyId}
					onChange={(e) => {
						setApiKeyId(e.target.value);
						resetPage();
					}}
				/>

				<span className="text-sm text-muted-foreground self-center ml-auto">
					{pagination.total} request{pagination.total !== 1 ? "s" : ""}
				</span>
			</div>

			<div className="flex flex-col gap-3">
				{logs.map((log) => (
					<LogCard key={log.id} log={log} />
				))}
				{logs.length === 0 && (
					<div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
						No logs found
					</div>
				)}
			</div>

			{pagination.totalPages > 1 && (
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<span>{pagination.total} total</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
						>
							Previous
						</Button>
						<span>
							{page} / {pagination.totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= pagination.totalPages}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
