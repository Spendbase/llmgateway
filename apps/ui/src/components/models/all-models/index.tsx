"use client";

import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ExternalLink,
	Scale,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState, useCallback, useEffect } from "react";

import { ModelCard } from "@/components/models/model-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/lib/components/button";
import { TooltipProvider } from "@/lib/components/tooltip";
import { useAppConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

import { ModelsFilters } from "./all-models-filters";
import { ModelsStats } from "./all-models-stats";
import { ModelsTableView } from "./all-models-table";
import { ModelsToolbar } from "./all-models-toolbar";
import { formatPrice, getCapabilityIcons } from "./all-models-utils";

import type {
	AllModelsProps,
	FiltersState,
	SortDirection,
	SortField,
} from "./all-models-types";

const DEFAULT_FILTERS: FiltersState = {
	category: "all",
	capabilities: {
		streaming: false,
		vision: false,
		tools: false,
		reasoning: false,
		jsonOutput: false,
		jsonOutputSchema: false,
		imageGeneration: false,
		audioTts: false,
		webSearch: false,
		free: false,
		discounted: false,
	},
	selectedProvider: "all",
	inputPrice: { min: "", max: "" },
	outputPrice: { min: "", max: "" },
	contextSize: { min: "", max: "" },
};

export function AllModels({ children, models, providers }: AllModelsProps) {
	const config = useAppConfig();
	const router = useRouter();
	const searchParams = useSearchParams();
	const isMobile = useIsMobile();

	const [viewMode, setViewMode] = useState<"table" | "grid">(
		searchParams.get("view") === "grid" ? "grid" : "table",
	);
	const [copiedModel, setCopiedModel] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
	const [showFilters, setShowFilters] = useState(
		searchParams.get("filters") === "1",
	);
	const [sortField, setSortField] = useState<SortField | null>(
		(searchParams.get("sortField") as SortField) || null,
	);
	const [sortDirection, setSortDirection] = useState<SortDirection>(
		searchParams.get("sortDir") === "desc" ? "desc" : "asc",
	);
	const [filters, setFilters] = useState<FiltersState>({
		category: searchParams.get("category") || "all",
		capabilities: {
			streaming: searchParams.get("streaming") === "true",
			vision: searchParams.get("vision") === "true",
			tools: searchParams.get("tools") === "true",
			reasoning: searchParams.get("reasoning") === "true",
			jsonOutput: searchParams.get("jsonOutput") === "true",
			jsonOutputSchema: searchParams.get("jsonOutputSchema") === "true",
			imageGeneration: searchParams.get("imageGeneration") === "true",
			audioTts: searchParams.get("audioTts") === "true",
			webSearch: searchParams.get("webSearch") === "true",
			free: searchParams.get("free") === "true",
			discounted: searchParams.get("discounted") === "true",
		},
		selectedProvider: searchParams.get("provider") || "all",
		inputPrice: {
			min: searchParams.get("inputPriceMin") || "",
			max: searchParams.get("inputPriceMax") || "",
		},
		outputPrice: {
			min: searchParams.get("outputPriceMin") || "",
			max: searchParams.get("outputPriceMax") || "",
		},
		contextSize: {
			min: searchParams.get("contextSizeMin") || "",
			max: searchParams.get("contextSizeMax") || "",
		},
	});

	useEffect(() => {
		const viewParam = searchParams.get("view");
		if (!viewParam && isMobile && viewMode !== "grid") {
			setViewMode("grid");
		}
	}, [isMobile, searchParams, viewMode]);

	const updateUrlWithFilters = useCallback(
		(newParams: Record<string, string | undefined>) => {
			const params = new URLSearchParams(searchParams.toString());
			Object.entries(newParams).forEach(([key, value]) => {
				if (value !== undefined && value !== "") {
					params.set(key, value);
				} else {
					params.delete(key);
				}
			});
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedModel(text);
			setTimeout(() => setCopiedModel(null), 2000);
		} catch (err) {
			console.error("Failed to copy text:", err);
		}
	};

	const clearFilters = () => {
		setSearchQuery("");
		setFilters(DEFAULT_FILTERS);
		setSortField(null);
		setSortDirection("asc");
		updateUrlWithFilters({
			q: undefined,
			category: undefined,
			streaming: undefined,
			vision: undefined,
			tools: undefined,
			reasoning: undefined,
			jsonOutput: undefined,
			jsonOutputSchema: undefined,
			imageGeneration: undefined,
			audioTts: undefined,
			webSearch: undefined,
			free: undefined,
			discounted: undefined,
			provider: undefined,
			inputPriceMin: undefined,
			inputPriceMax: undefined,
			outputPriceMin: undefined,
			outputPriceMax: undefined,
			contextSizeMin: undefined,
			contextSizeMax: undefined,
			sortField: undefined,
			sortDir: undefined,
		});
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			const newDir: SortDirection = sortDirection === "asc" ? "desc" : "asc";
			setSortDirection(newDir);
			updateUrlWithFilters({ sortDir: newDir });
		} else {
			setSortField(field);
			setSortDirection("asc");
			updateUrlWithFilters({ sortField: field, sortDir: "asc" });
		}
	};

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
		}
		return sortDirection === "asc" ? (
			<ArrowUp className="ml-2 h-4 w-4 text-primary" />
		) : (
			<ArrowDown className="ml-2 h-4 w-4 text-primary" />
		);
	};

	const modelsWithProviders = useMemo(() => {
		const filteredModels = models.filter((model) => {
			if (searchQuery) {
				const normalize = (str: string) =>
					str
						.toLowerCase()
						.normalize("NFD")
						.replace(/[\u0300-\u036f]/g, "")
						.replace(/[^a-z0-9]/g, "");

				const queryTokens = searchQuery
					.trim()
					.toLowerCase()
					.split(/\s+/)
					.map((t: string) => t.replace(/[^a-z0-9]/g, ""))
					.filter(Boolean);

				const providerStrings = (model.mappings || []).flatMap((p) => [
					p.providerId,
					p.providerInfo?.name || "",
				]);
				const haystack = normalize(
					[
						model.name || "",
						model.id,
						model.family,
						...(model.aliases || []),
						...providerStrings,
					].join(" "),
				);
				const containsAllTokens = queryTokens.every((t: string) =>
					haystack.includes(t),
				);
				const containsPhrase = normalize(searchQuery)
					? haystack.includes(normalize(searchQuery))
					: true;
				if (!(containsAllTokens || containsPhrase)) {
					return false;
				}
			}

			if (filters.category && filters.category !== "all") {
				switch (filters.category) {
					case "code": {
						if (model.free) {
							return false;
						}
						if (
							model.stability === "unstable" ||
							model.stability === "experimental"
						) {
							return false;
						}
						if (
							!model.mappings.some(
								(p) =>
									(p.jsonOutput || p.jsonOutputSchema) &&
									p.tools &&
									p.streaming,
							)
						) {
							return false;
						}
						break;
					}
					case "chat":
						if (!model.mappings.some((p) => p.streaming)) {
							return false;
						}
						break;
					case "reasoning":
						if (!model.mappings.some((p) => p.reasoning)) {
							return false;
						}
						break;
					case "creative":
						if (model.output?.includes("image")) {
							return false;
						}
						if (!model.mappings.some((p) => p.streaming)) {
							return false;
						}
						break;
					case "image":
						if (!model.output?.includes("image")) {
							return false;
						}
						break;
					case "audio":
						if (!model.output?.includes("audio")) {
							return false;
						}
						break;
					case "multimodal":
						if (!model.mappings.some((p) => p.vision)) {
							return false;
						}
						break;
				}
			}

			if (
				filters.capabilities.streaming &&
				!model.mappings.some((p) => p.streaming)
			) {
				return false;
			}
			if (
				filters.capabilities.vision &&
				!model.mappings.some((p) => p.vision)
			) {
				return false;
			}
			if (filters.capabilities.tools && !model.mappings.some((p) => p.tools)) {
				return false;
			}
			if (
				filters.capabilities.reasoning &&
				!model.mappings.some((p) => p.reasoning)
			) {
				return false;
			}
			if (
				filters.capabilities.jsonOutput &&
				!model.mappings.some((p) => p.jsonOutput)
			) {
				return false;
			}
			if (
				filters.capabilities.jsonOutputSchema &&
				!model.mappings.some((p) => p.jsonOutputSchema)
			) {
				return false;
			}
			if (
				filters.capabilities.imageGeneration &&
				!model.output?.includes("image")
			) {
				return false;
			}
			if (filters.capabilities.audioTts && !model.output?.includes("audio")) {
				return false;
			}
			if (
				filters.capabilities.webSearch &&
				!model.mappings.some((p) => p.webSearch)
			) {
				return false;
			}
			if (filters.capabilities.free) {
				const hasRequestPrice = model.mappings.some(
					(p) => p.requestPrice && p.requestPrice > 0,
				);
				if (!model.free || hasRequestPrice) {
					return false;
				}
			}
			if (
				filters.capabilities.discounted &&
				!model.mappings.some((p) => p.discount)
			) {
				return false;
			}

			if (filters.selectedProvider && filters.selectedProvider !== "all") {
				if (
					!model.mappings.some((p) => p.providerId === filters.selectedProvider)
				) {
					return false;
				}
			}

			const inRange = (
				value: number | null | undefined,
				min: string,
				max: string,
			) => {
				if (value === null || value === undefined) {
					return !min && !max;
				}
				if (!Number.isFinite(value)) {
					return false;
				}
				const minN = min ? parseFloat(min) : 0;
				const maxN = max ? parseFloat(max) : Infinity;
				return value >= minN && value <= maxN;
			};

			if (filters.inputPrice.min || filters.inputPrice.max) {
				if (
					!model.mappings.some((p) =>
						inRange(
							p.inputPrice !== undefined ? p.inputPrice * 1e6 : undefined,
							filters.inputPrice.min,
							filters.inputPrice.max,
						),
					)
				) {
					return false;
				}
			}
			if (filters.outputPrice.min || filters.outputPrice.max) {
				if (
					!model.mappings.some((p) =>
						inRange(
							p.outputPrice !== undefined ? p.outputPrice * 1e6 : undefined,
							filters.outputPrice.min,
							filters.outputPrice.max,
						),
					)
				) {
					return false;
				}
			}
			if (filters.contextSize.min || filters.contextSize.max) {
				if (
					!model.mappings.some((p) =>
						inRange(
							p.contextSize,
							filters.contextSize.min,
							filters.contextSize.max,
						),
					)
				) {
					return false;
				}
			}

			return true;
		});

		return [...filteredModels].sort((a, b) => {
			if (!sortField) {
				const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return bDate - aDate;
			}

			let aValue: string | number;
			let bValue: string | number;

			switch (sortField) {
				case "name":
					aValue = (a.name || a.id).toLowerCase();
					bValue = (b.name || b.id).toLowerCase();
					break;
				case "providers":
					aValue = a.mappings.length;
					bValue = b.mappings.length;
					break;
				case "contextSize":
					aValue = Math.max(...a.mappings.map((p) => p.contextSize || 0));
					bValue = Math.max(...b.mappings.map((p) => p.contextSize || 0));
					break;
				case "inputPrice": {
					const aPrices = a.mappings
						.map((p) => p.inputPrice)
						.filter((p): p is number => p !== undefined);
					const bPrices = b.mappings
						.map((p) => p.inputPrice)
						.filter((p): p is number => p !== undefined);
					aValue = aPrices.length > 0 ? Math.min(...aPrices) : Infinity;
					bValue = bPrices.length > 0 ? Math.min(...bPrices) : Infinity;
					break;
				}
				case "outputPrice": {
					const aPrices = a.mappings
						.map((p) => p.outputPrice)
						.filter((p): p is number => p !== undefined);
					const bPrices = b.mappings
						.map((p) => p.outputPrice)
						.filter((p): p is number => p !== undefined);
					aValue = aPrices.length > 0 ? Math.min(...aPrices) : Infinity;
					bValue = bPrices.length > 0 ? Math.min(...bPrices) : Infinity;
					break;
				}
				case "cachedInputPrice": {
					const aPrices = a.mappings
						.map((p) => p.cachedInputPrice)
						.filter((p): p is number => p !== undefined);
					const bPrices = b.mappings
						.map((p) => p.cachedInputPrice)
						.filter((p): p is number => p !== undefined);
					aValue = aPrices.length > 0 ? Math.min(...aPrices) : Infinity;
					bValue = bPrices.length > 0 ? Math.min(...bPrices) : Infinity;
					break;
				}
				case "requestPrice": {
					const aPrices = a.mappings
						.map((p) => p.requestPrice)
						.filter((p): p is number => p !== undefined);
					const bPrices = b.mappings
						.map((p) => p.requestPrice)
						.filter((p): p is number => p !== undefined);
					aValue = aPrices.length > 0 ? Math.min(...aPrices) : Infinity;
					bValue = bPrices.length > 0 ? Math.min(...bPrices) : Infinity;
					break;
				}
				default:
					return 0;
			}

			if (aValue < bValue) {
				return sortDirection === "asc" ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortDirection === "asc" ? 1 : -1;
			}
			return 0;
		});
	}, [searchQuery, filters, sortField, sortDirection, models]);

	const filteredProviderCount = useMemo(() => {
		const uniqueProviders = new Set(
			modelsWithProviders.flatMap((m) => m.mappings.map((p) => p.providerId)),
		);
		return uniqueProviders.size;
	}, [modelsWithProviders]);

	const hasActiveFilters =
		!!searchQuery ||
		filters.category !== "all" ||
		Object.values(filters.capabilities).some(Boolean) ||
		filters.selectedProvider !== "all" ||
		!!filters.inputPrice.min ||
		!!filters.inputPrice.max ||
		!!filters.outputPrice.min ||
		!!filters.outputPrice.max ||
		!!filters.contextSize.min ||
		!!filters.contextSize.max ||
		sortField !== null;

	return (
		<div className="min-h-screen text-foreground bg-background">
			<main>
				{children}
				<div
					className={cn("container mx-auto px-4 pb-8 space-y-6", {
						"pt-40": children,
					})}
				>
					<TooltipProvider delayDuration={300} skipDelayDuration={100}>
						<div className="container mx-auto py-8 space-y-6">
							<div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
								<div>
									<h1 className="text-3xl font-bold">Models</h1>
									<p className="text-muted-foreground mt-2">
										Comprehensive list of all supported models and their
										providers
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Link
										href="https://docs.llmapi.ai/v1_models"
										target="_blank"
										rel="noopener noreferrer"
									>
										<Button variant="outline" size="sm">
											<ExternalLink className="h-4 w-4 mr-1" />
											API Docs
										</Button>
									</Link>
									<Button size="sm" asChild>
										<Link href="/models/compare">
											<Scale className="h-4 w-4 mr-1" />
											Compare
										</Link>
									</Button>
								</div>
							</div>

							<ModelsToolbar
								searchQuery={searchQuery}
								setSearchQuery={setSearchQuery}
								showFilters={showFilters}
								setShowFilters={setShowFilters}
								hasActiveFilters={hasActiveFilters}
								filters={filters}
								clearFilters={clearFilters}
								viewMode={viewMode}
								setViewMode={setViewMode}
								updateUrlWithFilters={updateUrlWithFilters}
							/>

							<ModelsFilters
								filters={filters}
								setFilters={setFilters}
								updateUrlWithFilters={updateUrlWithFilters}
								providers={providers}
								showFilters={showFilters}
							/>

							<ModelsStats
								models={modelsWithProviders}
								totalModelCount={models.length}
								totalProviderCount={providers.length}
								filteredProviderCount={filteredProviderCount}
								hasActiveFilters={hasActiveFilters}
							/>

							{viewMode === "table" ? (
								<ModelsTableView
									models={modelsWithProviders}
									handleSort={handleSort}
									getSortIcon={getSortIcon}
									copiedModel={copiedModel}
									copyToClipboard={copyToClipboard}
									playgroundUrl={config.playgroundUrl}
									onNavigate={(id) =>
										router.push(`/models/${encodeURIComponent(id)}`)
									}
								/>
							) : (
								<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
									{modelsWithProviders.map((model) => (
										<ModelCard
											key={`${model.id}-${model.mappings[0]?.providerId}`}
											shouldShowStabilityWarning={(s) =>
												s !== null &&
												s !== undefined &&
												["unstable", "experimental"].includes(s)
											}
											getCapabilityIcons={getCapabilityIcons}
											model={model}
											goToModel={() =>
												router.push(`/models/${encodeURIComponent(model.id)}`)
											}
											formatPrice={formatPrice}
										/>
									))}
								</div>
							)}
						</div>
					</TooltipProvider>
				</div>
			</main>
		</div>
	);
}
