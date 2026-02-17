"use client";

import { Activity } from "lucide-react";

import { CustomBadge as Badge } from "@/components/ui/custom-badge";

import { ModelsFilters } from "./models-filters";
import { ModelsSearch } from "./models-search";
import { ModelsTable } from "./models-table";

import type { Model } from "@/lib/models";

interface ModelsIndexProps {
	models: Model[];
	allFamilies: string[];
}

export function ModelsIndex({ models, allFamilies }: ModelsIndexProps) {
	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
			<header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Models</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Browse and manage LLM model catalog
					</p>
				</div>
				<Badge variant="default">
					{models.length} model{models.length !== 1 ? "s" : ""}
				</Badge>
			</header>

			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<ModelsSearch />
					<ModelsFilters families={allFamilies} />
				</div>
			</div>

			{models.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
					<p className="text-sm text-muted-foreground">
						No models found matching your filters
					</p>
				</div>
			) : (
				<ModelsTable models={models} />
			)}
		</div>
	);
}
