"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CustomBadge as Badge } from "@/components/ui/custom-badge";
import { useOrgProjects } from "@/hooks/use-org-section-query";

import type { OrgProjectsResponse } from "@/lib/types";

interface OrgProjectsSectionProps {
	orgId: string;
	initialData: OrgProjectsResponse;
}

function statusVariant(status: string) {
	if (status === "active") {
		return "success";
	}
	if (status === "deleted") {
		return "error";
	}
	return "warning";
}

function modeVariant(mode: string) {
	if (mode === "credits") {
		return "blue";
	}
	if (mode === "hybrid") {
		return "purple";
	}
	return "default";
}

export function OrgProjectsSection({
	orgId,
	initialData,
}: OrgProjectsSectionProps) {
	const [page, setPage] = useState(1);

	const { data } = useOrgProjects(orgId, page, 20);
	const result = data ?? initialData;
	const projects = result.projects;
	const pagination = result.pagination;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted-foreground">
					{pagination.total} project{pagination.total !== 1 ? "s" : ""}
				</span>
			</div>

			<div className="rounded-md border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Name
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Status
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Mode
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Caching
							</th>
							<th className="px-4 py-3 text-right font-medium text-muted-foreground">
								Active Keys
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Created
							</th>
						</tr>
					</thead>
					<tbody>
						{projects.map((project) => (
							<tr
								key={project.id}
								className="border-b last:border-0 hover:bg-muted/30 transition-colors"
							>
								<td className="px-4 py-3 font-medium">{project.name}</td>
								<td className="px-4 py-3">
									<Badge variant={statusVariant(project.status)}>
										{project.status}
									</Badge>
								</td>
								<td className="px-4 py-3">
									<Badge variant={modeVariant(project.mode)}>
										{project.mode}
									</Badge>
								</td>
								<td className="px-4 py-3">
									{project.cachingEnabled ? (
										<Badge variant="success">Enabled</Badge>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</td>
								<td className="px-4 py-3 text-right tabular-nums">
									{project.activeApiKeysCount}
								</td>
								<td className="px-4 py-3 text-muted-foreground">
									{format(new Date(project.createdAt), "MMM d, yyyy")}
								</td>
							</tr>
						))}
						{projects.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									No projects found
								</td>
							</tr>
						)}
					</tbody>
				</table>
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
