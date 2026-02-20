"use client";

import { Calendar, CheckCircle2, DollarSign, AlertCircle } from "lucide-react";

import { CustomBadge as Badge } from "@/components/ui/custom-badge";

import { MappingStatusActions } from "./mapping-status-actions";

import type { Model } from "@/lib/models";

const priceFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2,
	maximumFractionDigits: 6,
});

interface ModelDetailClientProps {
	model: Model;
}

export function ModelDetailClient({ model }: ModelDetailClientProps) {
	const formatPrice = (price?: number) => {
		if (!price) {
			return "-";
		}
		return priceFormatter.format(price * 1_000_000);
	};

	return (
		<>
			<header className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-semibold tracking-tight">
						{model.name || model.id}
					</h1>
					<p className="text-sm text-muted-foreground">{model.id}</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Badge variant="blue">{model.family}</Badge>
					{model.free && <Badge variant="success">Free</Badge>}
					{model.output?.includes("image") && (
						<Badge variant="purple">Image Output</Badge>
					)}
					<Badge variant={model.status === "active" ? "success" : "warning"}>
						{model.status === "active" ? (
							<CheckCircle2 className="h-3 w-3" />
						) : (
							<AlertCircle className="h-3 w-3" />
						)}
						{model.status}
					</Badge>
				</div>
			</header>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-xl border border-border/60 bg-card p-5">
					<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
						Model Information
					</h2>
					<dl className="space-y-2">
						<div>
							<dt className="text-xs text-muted-foreground">Description</dt>
							<dd className="text-sm mt-1">
								{model.description || "No description available"}
							</dd>
						</div>
						{model.releasedAt && (
							<div>
								<dt className="text-xs text-muted-foreground">Released</dt>
								<dd className="text-sm mt-1 flex items-center gap-2">
									<Calendar className="h-3 w-3 text-muted-foreground" />
									{new Date(model.releasedAt).toLocaleDateString()}
								</dd>
							</div>
						)}
						{model.aliases && model.aliases.length > 0 && (
							<div>
								<dt className="text-xs text-muted-foreground">Aliases</dt>
								<dd className="text-sm mt-1">
									<div className="flex flex-wrap gap-1">
										{model.aliases.map((alias: string) => (
											<Badge key={alias} variant="default">
												{alias}
											</Badge>
										))}
									</div>
								</dd>
							</div>
						)}
					</dl>
				</div>

				<div className="rounded-xl border border-border/60 bg-card p-5">
					<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
						Provider Support
					</h2>
					<div className="space-y-3">
						<div className="flex items-baseline gap-2">
							<span className="text-3xl font-semibold">
								{model.mappings.length}
							</span>
							<span className="text-sm text-muted-foreground">
								provider{model.mappings.length !== 1 ? "s" : ""}
							</span>
						</div>
						<div className="flex flex-wrap gap-1">
							{model.mappings.some((m) => m.vision) && (
								<Badge variant="info">Vision</Badge>
							)}
							{model.mappings.some((m) => m.reasoning) && (
								<Badge variant="purple">Reasoning</Badge>
							)}
							{model.mappings.some((m) => m.tools) && (
								<Badge variant="default">Tools</Badge>
							)}
							{model.mappings.some((m) => m.jsonOutput) && (
								<Badge variant="default">JSON</Badge>
							)}
							{model.mappings.some((m) => m.webSearch) && (
								<Badge variant="default">Web Search</Badge>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
				<div className="px-5 py-4 border-b border-border/60">
					<h2 className="text-lg font-semibold">Provider Mappings</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Pricing and features per provider. Manage status for each provider
						mapping.
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="border-b border-border/60 bg-muted/40">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Provider
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Model Name
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Pricing
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Context
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Features
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Status
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/40">
							{model.mappings.map((mapping) => (
								<tr
									key={mapping.id}
									className="hover:bg-muted/30 transition-colors"
								>
									<td className="px-4 py-4">
										<span className="font-medium">{mapping.providerId}</span>
									</td>
									<td className="px-4 py-4">
										<span className="text-sm font-mono text-muted-foreground">
											{mapping.modelName}
										</span>
									</td>
									<td className="px-4 py-4">
										<div className="space-y-1 text-xs">
											<div className="flex items-center gap-1">
												<DollarSign className="h-3 w-3 text-muted-foreground" />
												<span className="text-muted-foreground">
													In: {formatPrice(mapping.inputPrice)}/1M
												</span>
											</div>
											<div className="flex items-center gap-1">
												<DollarSign className="h-3 w-3 text-muted-foreground" />
												<span className="text-muted-foreground">
													Out: {formatPrice(mapping.outputPrice)}/1M
												</span>
											</div>
											{Boolean(mapping.discount && mapping.discount > 0) && (
												<Badge variant="success">
													-{(mapping.discount! * 100).toFixed(0)}% discount
												</Badge>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<div className="space-y-1 text-xs text-muted-foreground">
											{mapping.contextSize && (
												<div>
													Context: {(mapping.contextSize / 1000).toFixed(0)}K
												</div>
											)}
											{mapping.maxOutput && (
												<div>
													Max out: {(mapping.maxOutput / 1000).toFixed(0)}K
												</div>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<div className="flex flex-wrap gap-1">
											{mapping.streaming && (
												<Badge variant="default">Stream</Badge>
											)}
											{mapping.vision && <Badge variant="info">Vision</Badge>}
											{mapping.reasoning && (
												<Badge variant="purple">Reasoning</Badge>
											)}
											{mapping.tools && <Badge variant="default">Tools</Badge>}
											{mapping.jsonOutput && (
												<Badge variant="default">JSON</Badge>
											)}
											{mapping.webSearch && (
												<Badge variant="default">Web</Badge>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<div className="space-y-1">
											<MappingStatusActions
												mapping={mapping}
												modelName={model.name || model.id}
											/>
											{mapping.deprecatedAt && (
												<div className="text-xs text-amber-400">Deprecated</div>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</>
	);
}
