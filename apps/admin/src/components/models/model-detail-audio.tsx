"use client";

import {
	Calendar,
	DollarSign,
	Hash,
	Languages,
	Timer,
	Volume2,
} from "lucide-react";

import { CustomBadge as Badge } from "@/components/ui/custom-badge";

import { MappingStatusActions } from "./mapping-status-actions";
import {
	formatCharPrice,
	formatLatency,
	formatMaxChars,
} from "./model-detail-formatters";

import type { Model, ModelProviderMapping } from "@/lib/models";

function AudioMappingsTable({
	mappings,
	modelName,
}: {
	mappings: ModelProviderMapping[];
	modelName: string;
}) {
	return (
		<table className="w-full">
			<thead className="border-b border-border/60 bg-muted/40">
				<tr>
					{[
						"Provider",
						"Model Name",
						"Price",
						"Max Chars",
						"Languages",
						"Latency",
						"Status",
					].map((col) => (
						<th
							key={col}
							className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
						>
							{col}
						</th>
					))}
				</tr>
			</thead>
			<tbody className="divide-y divide-border/40">
				{mappings.map((mapping) => (
					<tr key={mapping.id} className="hover:bg-muted/30 transition-colors">
						<td className="px-4 py-4 font-medium">{mapping.providerId}</td>
						<td className="px-4 py-4">
							<span className="text-sm font-mono text-muted-foreground">
								{mapping.modelName}
							</span>
						</td>
						<td className="px-4 py-4">
							<div className="flex items-center gap-1 text-xs">
								<DollarSign className="h-3 w-3 text-muted-foreground" />
								<span className="text-muted-foreground">
									{formatCharPrice(mapping.audioConfig?.characterPrice)}
								</span>
							</div>
						</td>
						<td className="px-4 py-4">
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Hash className="h-3 w-3" />
								{formatMaxChars(mapping.audioConfig?.maxCharacters)}
							</div>
						</td>
						<td className="px-4 py-4">
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Languages className="h-3 w-3" />
								{mapping.audioConfig?.languages ?? "-"}
							</div>
						</td>
						<td className="px-4 py-4">
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Timer className="h-3 w-3" />
								{formatLatency(mapping.audioConfig?.latencyMs)}
							</div>
						</td>
						<td className="px-4 py-4">
							<MappingStatusActions mapping={mapping} modelName={modelName} />
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

export function AudioModelDetail({ model }: { model: Model }) {
	const modelName = model.name || model.id;
	const cfg = model.mappings[0]?.audioConfig;

	return (
		<>
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
								<dd className="text-sm mt-1 flex flex-wrap gap-1">
									{model.aliases.map((alias: string) => (
										<Badge key={alias} variant="default">
											{alias}
										</Badge>
									))}
								</dd>
							</div>
						)}
					</dl>
				</div>

				<div className="rounded-xl border border-border/60 bg-card p-5">
					<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
						<Volume2 className="h-4 w-4 text-violet-400" />
						Audio Configuration
					</h2>
					<dl className="grid grid-cols-2 gap-3">
						<div>
							<dt className="text-xs text-muted-foreground">
								Price per 1K chars
							</dt>
							<dd className="text-sm font-medium mt-0.5">
								{formatCharPrice(cfg?.characterPrice)}
							</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Max characters</dt>
							<dd className="text-sm font-medium mt-0.5">
								{cfg?.maxCharacters
									? new Intl.NumberFormat("en-US").format(cfg.maxCharacters)
									: "-"}
							</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Languages</dt>
							<dd className="text-sm font-medium mt-0.5">
								{cfg?.languages ?? "-"}
							</dd>
						</div>
						<div>
							<dt className="text-xs text-muted-foreground">Target latency</dt>
							<dd className="text-sm font-medium mt-0.5">
								{formatLatency(cfg?.latencyMs)}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<div className="rounded-xl border border-border/60 bg-card p-5">
				<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
					Provider Support
				</h2>
				<div className="flex items-baseline gap-2">
					<span className="text-3xl font-semibold">
						{model.mappings.length}
					</span>
					<span className="text-sm text-muted-foreground">
						provider{model.mappings.length !== 1 ? "s" : ""}
					</span>
				</div>
			</div>

			<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
				<div className="px-5 py-4 border-b border-border/60">
					<h2 className="text-lg font-semibold">Provider Mappings</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Audio pricing and configuration per provider.
					</p>
				</div>
				<div className="overflow-x-auto">
					<AudioMappingsTable mappings={model.mappings} modelName={modelName} />
				</div>
			</div>
		</>
	);
}
