"use client";

import {
	AlertCircle,
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DepositCreditsButton } from "@/components/deposit-credits/deposit-credits-dialog";
import { CustomBadge as Badge } from "@/components/ui/custom-badge";

import type { Organization } from "@/lib/types";

type SortField =
	| "name"
	| "billingEmail"
	| "credits"
	| "plan"
	| "status"
	| "createdAt";

interface SortableHeaderProps {
	field: SortField;
	children: React.ReactNode;
	currentSort: SortField;
	currentOrder: string;
	onSort: (field: SortField) => void;
}

function SortableHeader({
	field,
	children,
	currentSort,
	currentOrder,
	onSort,
}: SortableHeaderProps) {
	const getSortIcon = () => {
		if (currentSort !== field) {
			return (
				<ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
			);
		}
		return currentOrder === "asc" ? (
			<ArrowUp className="h-3 w-3" />
		) : (
			<ArrowDown className="h-3 w-3" />
		);
	};

	return (
		<th
			scope="col"
			aria-sort={
				currentSort === field
					? currentOrder === "asc"
						? "ascending"
						: "descending"
					: "none"
			}
			className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
		>
			<button
				type="button"
				aria-label={`Sort by ${children}`}
				onClick={() => onSort(field)}
				className="cursor-pointer group flex w-full items-center gap-1 text-left transition-colors hover:bg-muted/50"
			>
				{children}
				{getSortIcon()}
			</button>
		</th>
	);
}

interface OrganizationsTableProps {
	organizations: Organization[];
	searchQuery: string;
}

const escapeRegExp = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightMatch = (value: string, query: string) => {
	if (!query.trim()) {
		return value;
	}

	const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi");
	const parts = value.split(pattern);

	return parts.map((part, index) =>
		part.toLowerCase() === query.toLowerCase() ? (
			<mark
				key={`${part}-${index}`}
				className="rounded bg-yellow-200/50 px-0.5 text-foreground"
			>
				{part}
			</mark>
		) : (
			part
		),
	);
};

export const getStatusVariant = (
	status: string | null,
): "success" | "warning" | "error" => {
	switch (status) {
		case "active":
			return "success";
		case "inactive":
			return "warning";
		case "deleted":
			return "error";
		default:
			return "warning";
	}
};

export const getStatusIcon = (status: string | null) => {
	switch (status) {
		case "active":
			return <CheckCircle2 className="h-3 w-3" />;
		case "inactive":
			return <AlertCircle className="h-3 w-3" />;
		case "deleted":
			return <XCircle className="h-3 w-3" />;
		default:
			return <AlertCircle className="h-3 w-3" />;
	}
};

export function OrganizationsTable({
	organizations,
	searchQuery,
}: OrganizationsTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentSort = (searchParams.get("sort") || "createdAt") as SortField;
	const currentOrder = searchParams.get("order") || "desc";

	const handleSort = (field: SortField) => {
		const params = new URLSearchParams(searchParams);

		if (currentSort === field) {
			const newOrder = currentOrder === "asc" ? "desc" : "asc";
			params.set("order", newOrder);
		} else {
			params.set("sort", field);
			params.set("order", "desc");
		}

		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="border-b border-border/60 bg-muted/40">
						<tr>
							<SortableHeader
								field="name"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Organization
							</SortableHeader>
							<SortableHeader
								field="billingEmail"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Email
							</SortableHeader>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Company
							</th>
							<SortableHeader
								field="credits"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Current Credit Balance
							</SortableHeader>
							<SortableHeader
								field="plan"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Plan type
							</SortableHeader>
							<SortableHeader
								field="status"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Status
							</SortableHeader>
							<th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/40">
						{organizations.map((org: Organization) => (
							<tr key={org.id} className="hover:bg-muted/30 transition-colors">
								<td className="px-4 py-4 font-medium">
									{highlightMatch(org.name, searchQuery)}
								</td>
								<td className="px-4 py-4">
									{highlightMatch(org.billingEmail, searchQuery)}
								</td>
								<td className="px-4 py-4">
									{org.billingCompany
										? highlightMatch(org.billingCompany, searchQuery)
										: "-"}
								</td>
								<td className="px-4 py-4 font-mono">
									${Number(org.credits).toFixed(2)}
								</td>
								<td className="px-4 py-4 font-mono">
									<Badge variant={org.plan === "pro" ? "blue" : "default"}>
										{org.plan ? org.plan.toUpperCase() : "-"}
									</Badge>
								</td>
								<td className="px-4 py-4">
									<Badge variant={getStatusVariant(org.status)}>
										<div className="flex items-center gap-1">
											{getStatusIcon(org.status)}
											{org.status || "-"}
										</div>
									</Badge>
								</td>
								<td className="px-4 py-4 flex justify-center">
									<DepositCreditsButton organization={org} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
