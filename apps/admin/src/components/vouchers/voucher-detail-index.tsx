"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import { DeleteVoucherButton } from "./delete-voucher-button";

import type { paths } from "@/lib/api/v1";

type VoucherDetailResponse =
	paths["/admin/vouchers/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export function VoucherDetailIndex({ data }: { data: VoucherDetailResponse }) {
	const { voucher } = data;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
			<div className="flex items-center gap-3">
				<Link
					href="/vouchers"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Vouchers
				</Link>
			</div>

			<header className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-semibold tracking-tight">
							Voucher Details
						</h1>
						<Badge variant="outline" className="text-xs font-mono">
							{voucher.id}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Code:{" "}
						<span className="font-medium text-foreground font-mono">
							{voucher.code}
						</span>
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					{voucher.isActive ? (
						<Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
					) : (
						<Badge variant="secondary">Inactive</Badge>
					)}
					<Badge variant="outline" className="gap-1">
						${voucher.depositAmount}
					</Badge>
				</div>
			</header>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
					<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
						Usage Limits
					</h2>
					<dl className="space-y-4 text-sm">
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">
								Global Usage Limit
							</dt>
							<dd className="font-medium col-span-2">
								{voucher.globalUsageLimit}
							</dd>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">
								Org Usage Limit
							</dt>
							<dd className="font-medium col-span-2">
								{voucher.orgUsageLimit}
							</dd>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">
								Total Redemptions
							</dt>
							<dd className="font-medium col-span-2">
								{voucher.totalRedemptionsAllOrgs}
							</dd>
						</div>
					</dl>
				</div>

				<div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
					<h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
						Dates
					</h2>
					<dl className="space-y-4 text-sm">
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">Created At</dt>
							<dd className="font-medium col-span-2">
								{new Date(voucher.createdAt).toLocaleString()}
							</dd>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">Updated At</dt>
							<dd className="font-medium col-span-2">
								{new Date(voucher.updatedAt).toLocaleString()}
							</dd>
						</div>
						<div className="grid grid-cols-3 gap-4">
							<dt className="text-muted-foreground col-span-1">Expires At</dt>
							<dd className="font-medium col-span-2">
								{voucher.expiresAt
									? new Date(voucher.expiresAt).toLocaleString()
									: "Never"}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<div className="flex items-center gap-4 pt-4 border-t">
				<DeleteVoucherButton
					voucherId={voucher.id}
					voucherCode={voucher.code}
				/>
			</div>
		</div>
	);
}
