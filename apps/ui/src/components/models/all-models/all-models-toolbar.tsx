"use client";

import { Filter, Grid, List, Search, X } from "lucide-react";

import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";

import type { FiltersState } from "./all-models-types";

interface ModelsToolbarProps {
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	showFilters: boolean;
	setShowFilters: (v: boolean) => void;
	hasActiveFilters: boolean;
	filters: FiltersState;
	clearFilters: () => void;
	viewMode: "table" | "grid";
	setViewMode: (v: "table" | "grid") => void;
	updateUrlWithFilters: (params: Record<string, string | undefined>) => void;
}

export function ModelsToolbar({
	searchQuery,
	setSearchQuery,
	showFilters,
	setShowFilters,
	hasActiveFilters,
	filters,
	clearFilters,
	viewMode,
	setViewMode,
	updateUrlWithFilters,
}: ModelsToolbarProps) {
	const activeFilterCount = [
		searchQuery ? 1 : 0,
		Object.values(filters.capabilities).filter(Boolean).length,
		[filters.inputPrice.min, filters.inputPrice.max].filter(Boolean).length,
		[filters.outputPrice.min, filters.outputPrice.max].filter(Boolean).length,
		[filters.contextSize.min, filters.contextSize.max].filter(Boolean).length,
	].reduce((a, b) => a + b, 0);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search models..."
						value={searchQuery}
						onChange={(e) => {
							const value = e.target.value;
							setSearchQuery(value);
							updateUrlWithFilters({ q: value || undefined });
						}}
						className="pl-8"
					/>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						const next = !showFilters;
						setShowFilters(next);
						updateUrlWithFilters({ filters: next ? "1" : undefined });
					}}
					className={hasActiveFilters ? "border-primary text-primary" : ""}
				>
					<Filter className="h-4 w-4 mr-1" />
					Filters
					{hasActiveFilters && (
						<Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
							{activeFilterCount}
						</Badge>
					)}
				</Button>

				{hasActiveFilters && (
					<Button variant="ghost" size="sm" onClick={clearFilters}>
						<X className="h-4 w-4 mr-1" />
						Clear
					</Button>
				)}
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant={viewMode === "table" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						setViewMode("table");
						updateUrlWithFilters({ view: "table" });
					}}
				>
					<List className="h-4 w-4 mr-1" />
					Table
				</Button>
				<Button
					variant={viewMode === "grid" ? "default" : "outline"}
					size="sm"
					onClick={() => {
						setViewMode("grid");
						updateUrlWithFilters({ view: "grid" });
					}}
				>
					<Grid className="h-4 w-4 mr-1" />
					Grid
				</Button>
			</div>
		</div>
	);
}
