"use client";

import {
	CheckCircle2,
	AlertCircle,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	XCircle,
	Volume2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { CustomBadge as Badge } from "@/components/ui/custom-badge";

import { isAudioModel } from "@llmgateway/models";

import type { Model } from "@/lib/models";

interface ModelsTableProps {
	models: Model[];
}

type SortField = "name" | "family" | "status" | "createdAt" | "updatedAt";

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
			onClick={() => onSort(field)}
			className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors group"
		>
			<div className="flex items-center gap-1">
				{children}
				{getSortIcon()}
			</div>
		</th>
	);
}

export function ModelsTable({ models: initialModels }: ModelsTableProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const currentSort = (searchParams.get("sort") || "createdAt") as SortField;
	const currentOrder = searchParams.get("order") || "desc";

	const handleSort = (field: SortField) => {
		const params = new URLSearchParams(searchParams);

		// If clicked on the same column - change direction
		if (currentSort === field) {
			const newOrder = currentOrder === "asc" ? "desc" : "asc";
			params.set("order", newOrder);
		} else {
			// New column - sort descending
			params.set("sort", field);
			params.set("order", "desc");
		}

		router.push(`/models?${params.toString()}`);
	};

	// Calculate effective model status based on mapping statuses
	const getEffectiveStatus = (
		model: Model,
	): "active" | "inactive" | "deactivated" => {
		if (!model.mappings || model.mappings.length === 0) {
			return model.status;
		}

		// Check if mapping is truly active (both mapping and provider must be active)
		const isMappingActive = (m: (typeof model.mappings)[0]) => {
			return m.status === "active" && m.providerInfo?.status === "active";
		};

		const hasActive = model.mappings.some(isMappingActive);
		const hasInactive = model.mappings.some(
			(m) =>
				m.status === "inactive" ||
				(m.status === "active" && m.providerInfo?.status === "inactive"),
		);
		const allDeactivated = model.mappings.every(
			(m) => m.status === "deactivated",
		);

		if (allDeactivated) {
			return "deactivated";
		}
		if (hasActive) {
			return "active";
		}
		if (hasInactive) {
			return "inactive";
		}

		return model.status;
	};

	// Filter by status (based on effective status from mappings)
	const statusFilter = searchParams.get("status");
	let filteredModels = initialModels;

	if (statusFilter && statusFilter !== "all") {
		filteredModels = initialModels.filter((model) => {
			const effectiveStatus = getEffectiveStatus(model);
			return effectiveStatus === statusFilter;
		});
	}

	// Sort models locally
	const models = [...filteredModels].sort((a, b) => {
		let aValue: string | number;
		let bValue: string | number;

		switch (currentSort) {
			case "name":
				aValue = (a.name || a.id).toLowerCase();
				bValue = (b.name || b.id).toLowerCase();
				break;
			case "family":
				aValue = a.family.toLowerCase();
				bValue = b.family.toLowerCase();
				break;
			case "status": {
				// Sort by effective status
				const statusOrder = { deactivated: 0, inactive: 1, active: 2 };
				aValue = statusOrder[getEffectiveStatus(a)];
				bValue = statusOrder[getEffectiveStatus(b)];
				break;
			}
			case "createdAt":
				aValue = new Date(a.createdAt).getTime();
				bValue = new Date(b.createdAt).getTime();
				break;
			case "updatedAt":
				aValue = a.updatedAt
					? new Date(a.updatedAt).getTime()
					: new Date(a.createdAt).getTime();
				bValue = b.updatedAt
					? new Date(b.updatedAt).getTime()
					: new Date(b.createdAt).getTime();
				break;
			default:
				return 0;
		}

		if (aValue < bValue) {
			return currentOrder === "asc" ? -1 : 1;
		}
		if (aValue > bValue) {
			return currentOrder === "asc" ? 1 : -1;
		}
		return 0;
	});

	const getStabilityVariant = (
		stability: string | null | undefined,
	): "success" | "info" | "warning" | "error" => {
		switch (stability) {
			case "stable":
				return "success";
			case "beta":
				return "info";
			case "unstable":
				return "warning";
			case "experimental":
				return "error";
			default:
				return "info";
		}
	};

	const getStatusVariant = (
		status: string,
	): "success" | "warning" | "error" => {
		switch (status) {
			case "active":
				return "success";
			case "inactive":
				return "warning";
			case "deactivated":
				return "error";
			default:
				return "success";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active":
				return <CheckCircle2 className="h-3 w-3" />;
			case "inactive":
				return <AlertCircle className="h-3 w-3" />;
			case "deactivated":
				return <XCircle className="h-3 w-3" />;
			default:
				return <CheckCircle2 className="h-3 w-3" />;
		}
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	};

	return (
		<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="border-b border-border/60 bg-muted/40">
						<tr>
							<SortableHeader
								field="name"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Model
							</SortableHeader>
							<SortableHeader
								field="family"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Family
							</SortableHeader>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Stability
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Providers
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Features
							</th>
							<SortableHeader
								field="status"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Status
							</SortableHeader>
							<SortableHeader
								field="createdAt"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Created
							</SortableHeader>
							<SortableHeader
								field="updatedAt"
								currentSort={currentSort}
								currentOrder={currentOrder}
								onSort={handleSort}
							>
								Updated
							</SortableHeader>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/40">
						{models.map((model) => {
							const effectiveStatus = getEffectiveStatus(model);
							return (
								<tr
									key={model.id}
									className="hover:bg-muted/30 transition-colors"
								>
									<td className="px-4 py-4">
										<div className="min-w-0">
											<Link
												href={`/models/${model.id}`}
												className="font-medium hover:underline"
											>
												{model.name || model.id}
											</Link>
											<p className="text-xs text-muted-foreground truncate mt-0.5">
												{model.id}
											</p>
											{model.aliases && model.aliases.length > 0 && (
												<p className="text-xs text-muted-foreground mt-1">
													Aliases: {model.aliases.slice(0, 2).join(", ")}
													{model.aliases.length > 2 &&
														` +${model.aliases.length - 2}`}
												</p>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<Badge variant="blue">{model.family}</Badge>
									</td>
									<td className="px-4 py-4">
										<Badge variant={getStabilityVariant(model.stability)}>
											{model.stability || "stable"}
										</Badge>
									</td>
									<td className="px-4 py-4">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">
												{model.mappings?.length || 0}
											</span>
											<span className="text-xs text-muted-foreground">
												provider{model.mappings?.length !== 1 ? "s" : ""}
											</span>
										</div>
									</td>
									<td className="px-4 py-4">
										<div className="flex flex-wrap gap-1">
											{model.free && <Badge variant="success">Free</Badge>}
											{model.output?.includes("image") && (
												<Badge variant="purple">Image</Badge>
											)}
											{isAudioModel(model) && (
												<Badge variant="purple">
													<Volume2 className="h-3 w-3" />
													Audio
												</Badge>
											)}
											{!isAudioModel(model) && (
												<>
													{model.mappings?.some((m) => m.vision) && (
														<Badge variant="default">Vision</Badge>
													)}
													{model.mappings?.some((m) => m.reasoning) && (
														<Badge variant="default">Reasoning</Badge>
													)}
													{model.mappings?.some((m) => m.tools) && (
														<Badge variant="default">Tools</Badge>
													)}
												</>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<Badge variant={getStatusVariant(effectiveStatus)}>
											{getStatusIcon(effectiveStatus)}
											{effectiveStatus}
										</Badge>
									</td>
									<td className="px-4 py-4">
										<span className="text-sm text-muted-foreground whitespace-nowrap">
											{formatDate(model.createdAt)}
										</span>
									</td>
									<td className="px-4 py-4">
										<span className="text-sm text-muted-foreground whitespace-nowrap">
											{model.updatedAt
												? formatDate(model.updatedAt)
												: formatDate(model.createdAt)}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
