import { ArrowLeft, CheckCircle2, DollarSign, XCircle } from "lucide-react";
import Link from "next/link";

import { DepositEventsTable } from "@/components/deposits/deposit-events-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { paths } from "@/lib/api/v1";

type DepositDetailResponse =
	paths["/admin/deposits/:id"]["get"]["responses"]["200"]["content"]["application/json"];

export function DepositDetailIndex({ data }: { data: DepositDetailResponse }) {
	const { deposit, events } = data;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
			<div className="flex items-center gap-3">
				<Link
					href="/deposits"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Deposits
				</Link>
			</div>

			<header className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-semibold tracking-tight">
							Deposit Details
						</h1>
						<Badge variant="outline" className="text-xs font-mono">
							{deposit.id}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Organization:{" "}
						<span className="font-medium text-foreground">
							{deposit.organizationName}
						</span>
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Badge
						className={cn(
							deposit.status === "completed" &&
								"bg-green-600 hover:bg-green-700",
							deposit.status === "failed" && "bg-red-600 hover:bg-red-700",
							deposit.status === "pending" && "bg-gray-500 hover:bg-gray-600",
						)}
					>
						{deposit.status === "completed" ? (
							<CheckCircle2 className="mr-1 h-3 w-3" />
						) : deposit.status === "failed" ? (
							<XCircle className="mr-1 h-3 w-3" />
						) : null}
						{deposit.status}
					</Badge>
					<Badge variant="outline" className="gap-1">
						<DollarSign className="h-3 w-3" />
						{deposit.amount !== null
							? `${deposit.amount} ${deposit.currency}`
							: `0.00 ${deposit.currency}`}
					</Badge>
					<Badge variant="secondary">{deposit.paymentMethod}</Badge>
				</div>
			</header>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
					<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
						Transaction Info
					</h2>
					<dl className="space-y-4 text-sm">
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">Created At</dt>
							<dd className="font-medium col-span-2">
								{new Date(deposit.createdAt).toLocaleString()}
							</dd>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">Credits</dt>
							<dd className="font-medium col-span-2">{deposit.creditAmount}</dd>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">Description</dt>
							<dd className="col-span-2 text-muted-foreground">
								{deposit.description || "-"}
							</dd>
						</div>
					</dl>
				</div>

				<div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
					<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
						Payment Details
					</h2>
					<dl className="space-y-4 text-sm">
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">
								Stripe Payment Intent
							</dt>
							<dd className="font-mono text-xs col-span-2 break-all">
								{deposit.stripePaymentIntentId || "-"}
							</dd>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">
								Stripe Invoice
							</dt>
							<dd className="font-mono text-xs col-span-2 break-all">
								{deposit.stripeInvoiceId || "-"}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
				<div className="px-5 py-4 border-b border-border/60">
					<h2 className="text-lg font-semibold">Audit Log</h2>
					<p className="text-sm text-muted-foreground mt-1">
						History of events associated with this transaction
					</p>
				</div>
				<div className="overflow-x-auto">
					<DepositEventsTable events={events} />
				</div>
			</div>
		</div>
	);
}
