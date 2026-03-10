"use client";

import { format } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CustomBadge as Badge } from "@/components/ui/custom-badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useOrgMembers } from "@/hooks/use-org-section-query";

import type { OrgMembersResponse } from "@/lib/types";

interface OrgMembersSectionProps {
	orgId: string;
	initialData: OrgMembersResponse;
}

function roleVariant(role: string) {
	if (role === "owner") {
		return "purple";
	}
	if (role === "admin") {
		return "blue";
	}
	return "default";
}

function statusVariant(status: string) {
	return status === "active" ? "success" : "error";
}

function initials(name: string | null, email: string): string {
	if (name) {
		return name
			.split(" ")
			.slice(0, 2)
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	}
	return email[0].toUpperCase();
}

export function OrgMembersSection({
	orgId,
	initialData,
}: OrgMembersSectionProps) {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const debouncedSearch = useDebounce(search, 300);

	const { data } = useOrgMembers(orgId, page, 20, debouncedSearch || undefined);
	const result = data ?? initialData;
	const members = result.members;
	const pagination = result.pagination;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-xs">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder="Search by name or email..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>
				<span className="text-sm text-muted-foreground ml-auto">
					{pagination.total} member{pagination.total !== 1 ? "s" : ""}
				</span>
			</div>

			<div className="rounded-md border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Member
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Role
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Status
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Last Login
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Joined
							</th>
						</tr>
					</thead>
					<tbody>
						{members.map((member) => (
							<tr
								key={member.userId}
								className="border-b last:border-0 hover:bg-muted/30 transition-colors"
							>
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<Avatar className="h-7 w-7">
											<AvatarFallback className="text-xs">
												{initials(member.name, member.email)}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span className="font-medium leading-tight">
												{member.name ?? member.email}
											</span>
											{member.name && (
												<span className="text-xs text-muted-foreground">
													{member.email}
												</span>
											)}
										</div>
									</div>
								</td>
								<td className="px-4 py-3">
									<Badge variant={roleVariant(member.role)}>
										{member.role}
									</Badge>
								</td>
								<td className="px-4 py-3">
									<Badge variant={statusVariant(member.status)}>
										{member.status}
									</Badge>
								</td>
								<td className="px-4 py-3 text-muted-foreground">
									{member.lastLoginAt
										? format(new Date(member.lastLoginAt), "MMM d, yyyy")
										: "—"}
								</td>
								<td className="px-4 py-3 text-muted-foreground">
									{format(new Date(member.joinedAt), "MMM d, yyyy")}
								</td>
							</tr>
						))}
						{members.length === 0 && (
							<tr>
								<td
									colSpan={5}
									className="px-4 py-8 text-center text-muted-foreground"
								>
									No members found
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
