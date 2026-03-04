"use client";

import {
	Bot,
	Brain,
	Braces,
	Code,
	Eye,
	FileJson2,
	Gift,
	Globe,
	ImagePlus,
	List,
	MessageSquare,
	Percent,
	PenTool,
	Sparkles,
	Volume2,
	Wrench,
	Zap,
} from "lucide-react";

import { Card, CardContent } from "@/lib/components/card";
import { Checkbox } from "@/lib/components/checkbox";
import { Input } from "@/lib/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";

import { getProviderIcon } from "@llmgateway/shared/components";

import type { FiltersState } from "./all-models-types";
import type { ApiProvider } from "@/lib/fetch-models";

interface ModelsFiltersProps {
	filters: FiltersState;
	setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
	updateUrlWithFilters: (params: Record<string, string | undefined>) => void;
	providers: ApiProvider[];
	showFilters: boolean;
}

const CAPABILITY_OPTIONS = [
	{ key: "streaming", label: "Streaming", icon: Zap, color: "text-blue-500" },
	{ key: "vision", label: "Vision", icon: Eye, color: "text-green-500" },
	{ key: "tools", label: "Tools", icon: Wrench, color: "text-purple-500" },
	{
		key: "reasoning",
		label: "Reasoning",
		icon: MessageSquare,
		color: "text-orange-500",
	},
	{
		key: "jsonOutput",
		label: "JSON Output",
		icon: Braces,
		color: "text-cyan-500",
	},
	{
		key: "jsonOutputSchema",
		label: "Structured JSON Output",
		icon: FileJson2,
		color: "text-teal-500",
	},
	{
		key: "imageGeneration",
		label: "Image Generation",
		icon: ImagePlus,
		color: "text-pink-500",
	},
	{
		key: "audioTts",
		label: "Text-to-Speech",
		icon: Volume2,
		color: "text-violet-500",
	},
	{
		key: "webSearch",
		label: "Native Web Search",
		icon: Globe,
		color: "text-sky-500",
	},
	{ key: "free", label: "Free", icon: Gift, color: "text-emerald-500" },
	{
		key: "discounted",
		label: "Discounted",
		icon: Percent,
		color: "text-red-500",
	},
] as const;

export function ModelsFilters({
	filters,
	setFilters,
	updateUrlWithFilters,
	providers,
	showFilters,
}: ModelsFiltersProps) {
	return (
		<Card
			className={`transition-all duration-200 ${showFilters ? "opacity-100" : "opacity-0 hidden"}`}
		>
			<CardContent className="pt-6">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
					<div className="space-y-3">
						<h3 className="font-medium text-sm">Use Case</h3>
						<Select
							value={filters.category}
							onValueChange={(value) => {
								setFilters((prev) => ({ ...prev, category: value }));
								updateUrlWithFilters({
									category: value !== "all" ? value : undefined,
								});
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All Use Cases" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									<div className="flex items-center gap-2">
										<List className="h-4 w-4 text-muted-foreground" />
										All Use Cases
									</div>
								</SelectItem>
								<SelectItem value="code">
									<div className="flex items-center gap-2">
										<Code className="h-4 w-4 text-indigo-500" />
										Code Generation
									</div>
								</SelectItem>
								<SelectItem value="chat">
									<div className="flex items-center gap-2">
										<Bot className="h-4 w-4 text-blue-500" />
										Chat & Assistants
									</div>
								</SelectItem>
								<SelectItem value="reasoning">
									<div className="flex items-center gap-2">
										<Brain className="h-4 w-4 text-orange-500" />
										Reasoning & Analysis
									</div>
								</SelectItem>
								<SelectItem value="creative">
									<div className="flex items-center gap-2">
										<PenTool className="h-4 w-4 text-purple-500" />
										Creative & Writing
									</div>
								</SelectItem>
								<SelectItem value="image">
									<div className="flex items-center gap-2">
										<ImagePlus className="h-4 w-4 text-pink-500" />
										Image Generation
									</div>
								</SelectItem>
								<SelectItem value="multimodal">
									<div className="flex items-center gap-2">
										<Sparkles className="h-4 w-4 text-amber-500" />
										Multimodal (Vision)
									</div>
								</SelectItem>
								<SelectItem value="audio">
									<div className="flex items-center gap-2">
										<Volume2 className="h-4 w-4 text-violet-500" />
										Text-to-Speech
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-3">
						<h3 className="font-medium text-sm">Capabilities</h3>
						<div className="space-y-2">
							{CAPABILITY_OPTIONS.map(({ key, label, icon: Icon, color }) => (
								<div key={key} className="flex items-center space-x-2">
									<Checkbox
										id={key}
										checked={
											filters.capabilities[
												key as keyof typeof filters.capabilities
											]
										}
										onCheckedChange={(checked) => {
											const isChecked = checked === true;
											setFilters((prev) => ({
												...prev,
												capabilities: {
													...prev.capabilities,
													[key]: isChecked,
												},
											}));
											updateUrlWithFilters({
												[key]: isChecked ? "true" : undefined,
											});
										}}
									/>
									<label
										htmlFor={key}
										className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
									>
										<Icon className={`h-4 w-4 ${color}`} />
										{label}
									</label>
								</div>
							))}
						</div>
					</div>

					<div className="space-y-3">
						<h3 className="font-medium text-sm">Provider</h3>
						<Select
							value={filters.selectedProvider}
							onValueChange={(value) => {
								setFilters((prev) => ({ ...prev, selectedProvider: value }));
								updateUrlWithFilters({
									provider: value === "all" ? undefined : value,
								});
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All providers" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All providers</SelectItem>
								{providers.map((provider) => {
									const ProviderIcon = getProviderIcon(provider.id);
									return (
										<SelectItem
											key={`${provider.id}-${provider.name}`}
											value={provider.id}
										>
											<div className="flex items-center gap-2">
												{ProviderIcon && <ProviderIcon className="h-4 w-4" />}
												<span>{provider.name}</span>
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>

					{[
						{
							label: "Input Price ($/M tokens)",
							key: "inputPrice" as const,
							minKey: "inputPriceMin",
							maxKey: "inputPriceMax",
							minPlaceholder: "Min price",
							maxPlaceholder: "Max price",
						},
						{
							label: "Output Price ($/M tokens)",
							key: "outputPrice" as const,
							minKey: "outputPriceMin",
							maxKey: "outputPriceMax",
							minPlaceholder: "Min price",
							maxPlaceholder: "Max price",
						},
						{
							label: "Context Size (tokens)",
							key: "contextSize" as const,
							minKey: "contextSizeMin",
							maxKey: "contextSizeMax",
							minPlaceholder: "Min size (e.g., 128000)",
							maxPlaceholder: "Max size (e.g., 200000)",
						},
					].map(
						({
							label,
							key,
							minKey,
							maxKey,
							minPlaceholder,
							maxPlaceholder,
						}) => (
							<div key={key} className="space-y-3">
								<h3 className="font-medium text-sm">{label}</h3>
								<div className="space-y-2">
									<Input
										placeholder={minPlaceholder}
										type="number"
										value={filters[key].min}
										onChange={(e) => {
											const value = e.target.value;
											setFilters((prev) => ({
												...prev,
												[key]: { ...prev[key], min: value },
											}));
											updateUrlWithFilters({ [minKey]: value || undefined });
										}}
										className="h-8"
									/>
									<Input
										placeholder={maxPlaceholder}
										type="number"
										value={filters[key].max}
										onChange={(e) => {
											const value = e.target.value;
											setFilters((prev) => ({
												...prev,
												[key]: { ...prev[key], max: value },
											}));
											updateUrlWithFilters({ [maxKey]: value || undefined });
										}}
										className="h-8"
									/>
								</div>
							</div>
						),
					)}
				</div>
			</CardContent>
		</Card>
	);
}
