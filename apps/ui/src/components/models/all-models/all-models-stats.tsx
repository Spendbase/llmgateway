"use client";

import { Card, CardContent } from "@/lib/components/card";

import type { ModelWithProviders } from "./all-models-types";

interface ModelsStatsProps {
	models: ModelWithProviders[];
	totalModelCount: number;
	totalProviderCount: number;
	filteredProviderCount: number;
	hasActiveFilters: boolean;
}

export function ModelsStats({
	models,
	totalModelCount,
	totalProviderCount,
	filteredProviderCount,
	hasActiveFilters,
}: ModelsStatsProps) {
	const suffix = hasActiveFilters ? " (filtered)" : "";

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
			<Card>
				<CardContent>
					<div className="text-2xl font-bold">
						{hasActiveFilters
							? `${models.length}/${totalModelCount}`
							: models.length}
					</div>
					<div className="text-sm text-muted-foreground">Models</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<div className="text-2xl font-bold">
						{hasActiveFilters
							? `${filteredProviderCount}/${totalProviderCount}`
							: totalProviderCount}
					</div>
					<div className="text-sm text-muted-foreground">Providers</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<div className="text-2xl font-bold">
						{models.filter((m) => m.mappings.some((p) => p.vision)).length}
					</div>
					<div className="text-sm text-muted-foreground">
						Vision Models{suffix}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<div className="text-2xl font-bold">
						{models.filter((m) => m.mappings.some((p) => p.tools)).length}
					</div>
					<div className="text-sm text-muted-foreground">
						Tool-enabled{suffix}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<div className="text-2xl font-bold">
						{models.filter((m) => m.free).length}
					</div>
					<div className="text-sm text-muted-foreground">
						Free Models{suffix}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
