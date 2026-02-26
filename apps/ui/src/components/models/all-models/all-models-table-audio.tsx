"use client";

import { AlertTriangle, Check, Copy, Gift } from "lucide-react";

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
import { cn } from "@/lib/utils";

import { getProviderIcon } from "@llmgateway/shared/components";

import {
	getStabilityBadgeProps,
	hasProviderStabilityWarning,
	shouldShowStabilityWarning,
} from "./all-models-utils";

import type { SortField, ModelWithProviders } from "./all-models-types";

interface ModelsAudioTableProps {
	models: ModelWithProviders[];
	handleSort: (field: SortField) => void;
	getSortIcon: (field: SortField) => React.ReactElement;
	copiedModel: string | null;
	copyToClipboard: (text: string) => Promise<void>;
	onNavigate: (modelId: string) => void;
}

const thCls = "bg-background/95 backdrop-blur-sm border-b";

export function ModelsAudioTable({
	models,
	handleSort,
	getSortIcon,
	copiedModel,
	copyToClipboard,
	onNavigate,
}: ModelsAudioTableProps) {
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
								Max Chars
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Price / 1K chars
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Languages
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Latency
							</TableHead>
							<TableHead className={cn("text-center", thCls)}>
								Stability
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{models.map((model) => {
							const stabilityProps = getStabilityBadgeProps(model.stability);
							return (
								<TableRow
									key={model.id}
									className="cursor-pointer hover:bg-muted/50 transition-colors"
									onClick={() => onNavigate(model.id)}
								>
									<TableCell className="font-medium">
										<div className="space-y-1">
											<div className="font-semibold text-sm flex items-center gap-2">
												<div className="truncate max-w-[150px]">
													{model.name || model.id}
												</div>
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

									<TableCell>
										<div className="flex flex-col flex-wrap gap-2">
											{model.mappings.map((provider) => (
												<div
													key={`${provider.providerId}-${provider.modelName}-${model.id}`}
													className="flex items-center gap-1"
												>
													<div className="w-5 h-5 flex items-center justify-center">
														{(() => {
															const ProviderIcon = getProviderIcon(
																provider.providerId,
															);
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
																	{(
																		provider.providerInfo?.name ||
																		provider.providerId
																	)
																		.charAt(0)
																		.toUpperCase()}
																</div>
															);
														})()}
													</div>
													<Badge
														variant="secondary"
														className="text-xs"
														style={{
															borderColor:
																provider.providerInfo?.color ?? undefined,
														}}
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

									<TableCell className="text-center">
										<div className="space-y-1">
											{model.mappings.map((provider) => (
												<div
													key={`${provider.providerId}-${provider.modelName}-${model.id}`}
													className="text-sm"
												>
													{provider.audioConfig
														? `${(provider.audioConfig.maxCharacters / 1000).toFixed(0)}K chars max`
														: "—"}
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
													{provider.audioConfig
														? `$${(provider.audioConfig.characterPrice * 1000).toFixed(4)}/1K`
														: "—"}
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
													{provider.audioConfig !== undefined &&
													provider.audioConfig.languages !== null
														? `${provider.audioConfig.languages} langs`
														: "—"}
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
													{provider.audioConfig !== undefined &&
													provider.audioConfig.latencyMs !== null
														? `~${provider.audioConfig.latencyMs}ms`
														: "—"}
												</div>
											))}
										</div>
									</TableCell>

									<TableCell className="text-center">
										{stabilityProps ? (
											<Badge
												variant={stabilityProps.variant}
												className="text-xs px-2 py-1"
											>
												{stabilityProps.label}
											</Badge>
										) : (
											<Badge variant="outline" className="text-xs px-2 py-1">
												STABLE
											</Badge>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
