import { Activity, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import SignInPrompt from "@/components/auth/sign-in-prompt";
import { getProviders } from "@/lib/fetch-providers";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 0,
});

function Badge({
	children,
	variant = "default",
}: {
	children: React.ReactNode;
	variant?: "default" | "success" | "error";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
				variant === "success" &&
					"bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
				variant === "error" &&
					"bg-red-500/10 text-red-400 border border-red-500/30",
				variant === "default" &&
					"bg-muted text-muted-foreground border border-border",
			)}
		>
			{children}
		</span>
	);
}

export default async function ProvidersPage() {
	const providers = await getProviders();

	if (!providers) {
		return <SignInPrompt />;
	}

	const successRate = (logsCount: number, errorsCount: number) => {
		if (logsCount === 0) {
			return "-";
		}
		const rate = ((logsCount - errorsCount) / logsCount) * 100;
		return `${rate.toFixed(1)}%`;
	};

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
			<header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Providers</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage LLM provider backends and monitor their health
					</p>
				</div>
				<Badge variant="default">
					{providers.length} provider{providers.length !== 1 ? "s" : ""}
				</Badge>
			</header>

			<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="border-b border-border/60 bg-muted/40">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Provider
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Status
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Features
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Stats
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Performance
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/40">
							{providers.map((provider: any) => (
								<tr
									key={provider.id}
									className="hover:bg-muted/30 transition-colors"
								>
									<td className="px-4 py-4">
										<div className="flex items-center gap-3">
											<div
												className="h-3 w-3 rounded-full flex-shrink-0"
												style={{
													backgroundColor: provider.color || "#6b7280",
												}}
											/>
											<div className="min-w-0">
												<Link
													href={provider.website || "#"}
													target="_blank"
													className="font-medium hover:underline"
												>
													{provider.name}
												</Link>
												<p className="text-xs text-muted-foreground truncate mt-0.5">
													{provider.description}
												</p>
											</div>
										</div>
									</td>
									<td className="px-4 py-4">
										<Badge
											variant={
												provider.status === "active" ? "success" : "error"
											}
										>
											{provider.status === "active" ? (
												<CheckCircle2 className="h-3 w-3" />
											) : (
												<XCircle className="h-3 w-3" />
											)}
											{provider.status}
										</Badge>
									</td>
									<td className="px-4 py-4">
										<div className="flex flex-wrap gap-1">
											{provider.streaming && (
												<Badge variant="default">Streaming</Badge>
											)}
											{provider.cancellation && (
												<Badge variant="default">Cancellation</Badge>
											)}
										</div>
									</td>
									<td className="px-4 py-4">
										<div className="space-y-1 text-sm">
											<div className="flex items-center gap-2">
												<Activity className="h-3 w-3 text-muted-foreground" />
												<span className="text-muted-foreground">
													{numberFormatter.format(provider.logsCount || 0)}{" "}
													requests
												</span>
											</div>
											<div className="text-xs text-muted-foreground">
												{provider.errorsCount || 0} errors
											</div>
										</div>
									</td>
									<td className="px-4 py-4">
										<div className="space-y-1 text-sm">
											<div className="text-muted-foreground">
												Success:{" "}
												{successRate(
													provider.logsCount || 0,
													provider.errorsCount || 0,
												)}
											</div>
											{provider.avgTimeToFirstToken && (
												<div className="text-xs text-muted-foreground">
													TTFT: {provider.avgTimeToFirstToken.toFixed(0)}ms
												</div>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{providers.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="text-sm text-muted-foreground">No providers found</p>
				</div>
			)}
		</div>
	);
}
