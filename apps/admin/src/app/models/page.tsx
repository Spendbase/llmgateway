import { Activity, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import SignInPrompt from "@/components/auth/sign-in-prompt";
import { getModels } from "@/lib/models";
import { cn } from "@/lib/utils";

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

export default async function ModelsPage() {
	const models = await getModels();

	if (!models) {
		return <SignInPrompt />;
	}

	const getStabilityVariant = (
		stability: string | null,
	): "success" | "info" | "warning" | "error" => {
		switch (stability) {
			case "stable":
				return "success";
			case "beta":
				return "info";
			case "unstable":
				return "warning";
			case "experimental":
				return "error";
			default:
				return "info";
		}
	};

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

			<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="border-b border-border/60 bg-muted/40">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Model
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Family
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Stability
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Providers
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
							{models.map((model: any) => (
								<tr
									key={model.id}
									className="hover:bg-muted/30 transition-colors"
								>
									<td className="px-4 py-4">
										<div className="min-w-0">
											<Link
												href={`/models/${model.id}`}
												className="font-medium hover:underline"
											>
												{model.name || model.id}
											</Link>
											<p className="text-xs text-muted-foreground truncate mt-0.5">
												{model.id}
											</p>
											{model.aliases && model.aliases.length > 0 && (
												<p className="text-xs text-muted-foreground mt-1">
													Aliases: {model.aliases.slice(0, 2).join(", ")}
													{model.aliases.length > 2 &&
														` +${model.aliases.length - 2}`}
												</p>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<Badge variant="blue">{model.family}</Badge>
									</td>
									<td className="px-4 py-4">
										<Badge variant={getStabilityVariant(model.stability)}>
											{model.stability || "stable"}
										</Badge>
									</td>
									<td className="px-4 py-4">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">
												{model.mappings?.length || 0}
											</span>
											<span className="text-xs text-muted-foreground">
												provider{model.mappings?.length !== 1 ? "s" : ""}
											</span>
										</div>
									</td>
									<td className="px-4 py-4">
										<div className="flex flex-wrap gap-1">
											{model.free && <Badge variant="success">Free</Badge>}
											{model.output?.includes("image") && (
												<Badge variant="purple">Image</Badge>
											)}
											{model.mappings?.some((m: any) => m.vision) && (
												<Badge variant="default">Vision</Badge>
											)}
											{model.mappings?.some((m: any) => m.reasoning) && (
												<Badge variant="default">Reasoning</Badge>
											)}
											{model.mappings?.some((m: any) => m.tools) && (
												<Badge variant="default">Tools</Badge>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<Badge
											variant={model.status === "active" ? "success" : "error"}
										>
											{model.status === "active" ? (
												<CheckCircle2 className="h-3 w-3" />
											) : (
												<XCircle className="h-3 w-3" />
											)}
											{model.status}
										</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{models.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
					<p className="text-sm text-muted-foreground">No models found</p>
				</div>
			)}
		</div>
	);
}
