"use client";

import { AlertTriangle, Check, Copy, Gift, Play } from "lucide-react";

import { ModelCodeExampleDialog } from "@/components/models/model-code-example-dialog";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/lib/components/tooltip";
import { cn, formatContextSize } from "@/lib/utils";

import { getProviderIcon } from "@llmgateway/shared/components";

import {
	formatPrice,
	getCapabilityIcons,
	getStabilityBadgeProps,
	hasProviderStabilityWarning,
	shouldShowStabilityWarning,
} from "./all-models-utils";

import type { SortField, ModelWithProviders } from "./all-models-types";
import type { ApiModelProviderMapping } from "@/lib/fetch-models";

interface ModelsTextTableProps {
	models: ModelWithProviders[];
	handleSort: (field: SortField) => void;
	getSortIcon: (field: SortField) => React.ReactElement;
	copiedModel: string | null;
	copyToClipboard: (text: string) => Promise<void>;
	playgroundUrl: string;
	onNavigate: (modelId: string) => void;
}

const thCls = "bg-background/95 backdrop-blur-sm border-b";

function ModelCell({
	model,
	copiedModel,
	copyToClipboard,
}: {
	model: ModelWithProviders;
	copiedModel: string | null;
	copyToClipboard: (text: string) => Promise<void>;
}) {
	return (
		<TableCell className="font-medium">
			<div className="space-y-1">
				<div className="font-semibold text-sm flex items-center gap-2">
					<div className="truncate max-w-[150px]">{model.name || model.id}</div>
					{shouldShowStabilityWarning(model.stability) && (
						<AlertTriangle className="h-4 w-4 text-orange-500" />
					)}
					{model.free &&
						!model.mappings.some(
							(p) => p.requestPrice && p.requestPrice > 0,
						) && (
							<Badge
								variant="secondary"
								className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200"
							>
								<Gift className="h-3 w-3 mr-1" />
								Free
							</Badge>
						)}
				</div>
				<div className="text-xs text-muted-foreground">
					Family:{" "}
					<Badge variant="outline" className="text-xs">
						{model.family}
					</Badge>
				</div>
				<div className="flex items-center gap-1">
					<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[150px]">
						{model.id}
					</code>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-5 w-5 p-0"
							onClick={(e) => {
								e.stopPropagation();
								void copyToClipboard(model.id);
							}}
							title="Copy root model ID"
						>
							{copiedModel === model.id ? (
								<Check className="h-3 w-3 text-green-600" />
							) : (
								<Copy className="h-3 w-3" />
							)}
						</Button>
						<div
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
						>
							<ModelCodeExampleDialog modelId={model.id} />
						</div>
					</div>
				</div>
			</div>
		</TableCell>
	);
}

function ProvidersCell({ model }: { model: ModelWithProviders }) {
	return (
		<TableCell>
			<div className="flex flex-col flex-wrap gap-2">
				{model.mappings.map((provider) => (
					<div
						key={`${provider.providerId}-${provider.modelName}-${model.id}`}
						className="flex items-center gap-1"
					>
						<div className="w-5 h-5 flex items-center justify-center">
							{(() => {
								const ProviderIcon = getProviderIcon(provider.providerId);
								return ProviderIcon ? (
									<ProviderIcon className="w-4 h-4" />
								) : (
									<div
										className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-medium text-white"
										style={{
											backgroundColor:
												provider.providerInfo?.color || "#6b7280",
										}}
									>
										{(provider.providerInfo?.name || provider.providerId)
											.charAt(0)
											.toUpperCase()}
									</div>
								);
							})()}
						</div>
						<Badge
							variant="secondary"
							className="text-xs"
							style={{ borderColor: provider.providerInfo?.color ?? undefined }}
						>
							{provider.providerInfo?.name || provider.providerId}
						</Badge>
						{hasProviderStabilityWarning(provider) && (
							<AlertTriangle className="h-3 w-3 text-orange-500" />
						)}
					</div>
				))}
			</div>
		</TableCell>
	);
}

function StabilityCell({ model }: { model: ModelWithProviders }) {
	const props = getStabilityBadgeProps(model.stability);
	return (
		<TableCell className="text-center">
			{props ? (
				<Badge variant={props.variant} className="text-xs px-2 py-1">
					{props.label}
				</Badge>
			) : (
				<Badge variant="outline" className="text-xs px-2 py-1">
					STABLE
				</Badge>
			)}
		</TableCell>
	);
}

function PriceCell({
	model,
	getValue,
}: {
	model: ModelWithProviders;
	getValue: (p: ApiModelProviderMapping) => number | undefined;
}) {
	return (
		<TableCell className="text-center">
			<div className="space-y-1">
				{model.mappings.map((provider) => {
					const formatted = formatPrice(getValue(provider), provider.discount);
					return (
						<div
							key={`${provider.providerId}-${provider.modelName}-${model.id}`}
							className="text-sm font-mono"
						>
							{typeof formatted === "string" ? (
								formatted + "/M"
							) : (
								<div className="flex gap-1 flex-row justify-center">
									{formatted}
									<span className="text-muted-foreground">/M</span>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</TableCell>
	);
}

export function ModelsTextTable({
	models,
	handleSort,
	getSortIcon,
	copiedModel,
	copyToClipboard,
	playgroundUrl,
	onNavigate,
}: ModelsTextTableProps) {
	return (
		<div className="rounded-md border">
			<div className="relative w-full overflow-x-auto sm:overflow-x-scroll">
				<Table className="min-w-[700px] sm:min-w-0">
					<TableHeader className="top-0 z-10 bg-background/95 backdrop-blur">
						<TableRow>
							<TableHead className={cn("w-[250px]", thCls)}>
								<Button
									variant="ghost"
									onClick={() => handleSort("name")}
									className="h-auto p-0 font-semibold hover:bg-transparent justify-start"
								>
									Model
									{getSortIcon("name")}
								</Button>
							</TableHead>
							<TableHead className={thCls}>
								<Button
									variant="ghost"
									onClick={() => handleSort("providers")}
									className="h-auto p-0 font-semibold hover:bg-transparent justify-start"
								>
									Providers
									{getSortIcon("providers")}
								</Button>
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								<Button
									variant="ghost"
									onClick={() => handleSort("contextSize")}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Context Size
									{getSortIcon("contextSize")}
								</Button>
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								<Button
									variant="ghost"
									onClick={() => handleSort("inputPrice")}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Input Price
									{getSortIcon("inputPrice")}
								</Button>
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								<Button
									variant="ghost"
									onClick={() => handleSort("cachedInputPrice")}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Cached Input Price
									{getSortIcon("cachedInputPrice")}
								</Button>
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								<Button
									variant="ghost"
									onClick={() => handleSort("outputPrice")}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Output Price
									{getSortIcon("outputPrice")}
								</Button>
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								<Button
									variant="ghost"
									onClick={() => handleSort("requestPrice")}
									className="h-auto p-0 font-semibold hover:bg-transparent"
								>
									Request Price
									{getSortIcon("requestPrice")}
								</Button>
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Native Web Search
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Capabilities
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Stability
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{models.map((model) => (
							<TableRow
								key={model.id}
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => onNavigate(model.id)}
							>
								<ModelCell
									model={model}
									copiedModel={copiedModel}
									copyToClipboard={copyToClipboard}
								/>
								<ProvidersCell model={model} />

								<TableCell className="text-center">
									<div className="space-y-1">
										{model.mappings.map((provider) => (
											<div
												key={`${provider.providerId}-${provider.modelName}-${model.id}`}
												className="text-sm"
											>
												{provider.contextSize
													? formatContextSize(provider.contextSize)
													: "—"}
											</div>
										))}
									</div>
								</TableCell>

								<PriceCell model={model} getValue={(p) => p.inputPrice} />
								<PriceCell model={model} getValue={(p) => p.cachedInputPrice} />
								<PriceCell model={model} getValue={(p) => p.outputPrice} />

								<TableCell className="text-center">
									<div className="space-y-1">
										{model.mappings.map((provider) => (
											<div
												key={`${provider.providerId}-${provider.modelName}-${model.id}`}
												className="text-sm font-mono"
											>
												{provider.requestPrice !== undefined &&
												provider.requestPrice > 0 ? (
													provider.discount ? (
														<div className="flex flex-col justify-center items-center">
															<span className="line-through text-muted-foreground text-xs">
																${provider.requestPrice.toFixed(3)}
															</span>
															<span className="text-green-600 font-semibold">
																$
																{(
																	provider.requestPrice *
																	(1 - provider.discount)
																).toFixed(3)}
															</span>
															<span className="text-muted-foreground text-xs">
																/req
															</span>
														</div>
													) : (
														<>
															${provider.requestPrice.toFixed(3)}
															<span className="text-muted-foreground text-xs ml-1">
																/req
															</span>
														</>
													)
												) : (
													"—"
												)}
											</div>
										))}
									</div>
								</TableCell>

								<TableCell className="text-center">
									<div className="space-y-1">
										{model.mappings.map((provider) => (
											<div
												key={`${provider.providerId}-${provider.modelName}-${model.id}`}
												className="text-sm font-mono"
											>
												{provider.webSearch ? "Supported" : "—"}
											</div>
										))}
									</div>
								</TableCell>

								<TableCell className="text-center">
									<div className="space-y-2">
										{model.mappings.map((provider) => (
											<div
												key={`${provider.providerId}-${provider.modelName}-${model.id}`}
												className="flex justify-center gap-1"
											>
												{getCapabilityIcons(provider, model).map(
													({ icon: Icon, label, color }) => (
														<Tooltip key={`${label}-${model.id}`}>
															<TooltipTrigger asChild>
																<div
																	className="cursor-help focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm p-0.5 -m-0.5"
																	tabIndex={0}
																	role="button"
																	aria-label={`Model capability: ${label}`}
																>
																	<Icon className={`h-4 w-4 ${color}`} />
																</div>
															</TooltipTrigger>
															<TooltipContent
																className="bg-popover text-popover-foreground border border-border shadow-md"
																side="top"
																align="center"
																avoidCollisions={true}
															>
																<p>{label}</p>
															</TooltipContent>
														</Tooltip>
													),
												)}
											</div>
										))}
									</div>
								</TableCell>

								<StabilityCell model={model} />

								<TableCell className="text-center">
									<Button
										variant="outline"
										size="sm"
										className="h-8 gap-2"
										title={`Try ${model.name || model.id} in playground`}
										onClick={(e) => e.stopPropagation()}
										asChild
									>
										<a
											href={`${playgroundUrl}?model=${encodeURIComponent(`${model.mappings[0]?.providerId}/${model.id}`)}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Play className="h-3 w-3" />
											Try it
										</a>
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
