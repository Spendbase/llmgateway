import {
	ArrowLeft,
	Calendar,
	CheckCircle2,
	DollarSign,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import SignInPrompt from "@/components/auth/sign-in-prompt";
import { getModel } from "@/lib/models";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2,
	maximumFractionDigits: 6,
});

function Badge({
	children,
	variant = "default",
}: {
	children: React.ReactNode;
	variant?:
		| "default"
		| "success"
		| "error"
		| "warning"
		| "info"
		| "purple"
		| "blue";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
				variant === "success" &&
					"bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
				variant === "error" &&
					"bg-red-500/10 text-red-400 border border-red-500/30",
				variant === "warning" &&
					"bg-amber-500/10 text-amber-400 border border-amber-500/30",
				variant === "info" &&
					"bg-sky-500/10 text-sky-400 border border-sky-500/30",
				variant === "purple" &&
					"bg-violet-500/10 text-violet-400 border border-violet-500/30",
				variant === "blue" &&
					"bg-blue-500/10 text-blue-400 border border-blue-500/30",
				variant === "default" &&
					"bg-muted text-muted-foreground border border-border",
			)}
		>
			{children}
		</span>
	);
}

export default async function ModelDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const model = await getModel(id);

	if (!model) {
		return <SignInPrompt />;
	}

	if (!model.id) {
		notFound();
	}

	const formatPrice = (price: string | null) => {
		if (!price) {
			return "-";
		}
		const num = parseFloat(price);
		return priceFormatter.format(num / 1_000_000);
	};

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
			<div className="flex items-center gap-3">
				<Link
					href="/models"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Models
				</Link>
			</div>

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
					<Badge variant={model.status === "active" ? "success" : "error"}>
						{model.status === "active" ? (
							<CheckCircle2 className="h-3 w-3" />
						) : (
							<XCircle className="h-3 w-3" />
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
										{model.aliases.map((alias) => (
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
							{model.mappings.some((m: any) => m.vision) && (
								<Badge variant="info">Vision</Badge>
							)}
							{model.mappings.some((m: any) => m.reasoning) && (
								<Badge variant="purple">Reasoning</Badge>
							)}
							{model.mappings.some((m: any) => m.tools) && (
								<Badge variant="default">Tools</Badge>
							)}
							{model.mappings.some((m: any) => m.jsonOutput) && (
								<Badge variant="default">JSON</Badge>
							)}
							{model.mappings.some((m: any) => m.webSearch) && (
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
						Pricing and features per provider
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
							{model.mappings.map((mapping: any) => (
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
											{mapping.discount && parseFloat(mapping.discount) > 0 && (
												<Badge variant="success">
													-{(parseFloat(mapping.discount) * 100).toFixed(0)}%
													discount
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
										<Badge
											variant={
												mapping.status === "active" ? "success" : "error"
											}
										>
											{mapping.status}
										</Badge>
										{mapping.deprecatedAt && (
											<div className="text-xs text-amber-400 mt-1">
												Deprecated
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
