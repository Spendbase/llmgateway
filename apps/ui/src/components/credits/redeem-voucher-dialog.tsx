"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { useState } from "react";

import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { toast } from "@/lib/components/use-toast";
import { useApi } from "@/lib/fetch-client";

import type React from "react";

export function RedeemVoucherButton() {
	const queryClient = useQueryClient();
	const api = useApi();
	const [open, setOpen] = useState(false);
	const [code, setCode] = useState("");

	const { mutate: redeemVoucher, isPending } = api.useMutation(
		"post",
		"/vouchers/redeem",
	);

	const handleClose = () => {
		setOpen(false);
		setTimeout(() => {
			setCode("");
		}, 300);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const trimmed = code.trim().toUpperCase();
		if (!trimmed) {
			toast({
				title: "Please enter a voucher code.",
				variant: "destructive",
			});
			return;
		}

		redeemVoucher(
			{
				body: { code: trimmed },
			},
			{
				onSuccess: (data) => {
					toast({
						title: "Voucher redeemed",
						description: `$${Number(data.creditAmount).toFixed(2)} credits added to your account.`,
					});

					const orgsQueryKey = api.queryOptions("get", "/orgs", {}).queryKey;
					void queryClient.invalidateQueries({
						queryKey: orgsQueryKey,
					});

					handleClose();
				},
				onError: (error: any) => {
					const status = error?.status ?? error?.statusCode;
					let description = "Something went wrong. Please try again.";

					if (error?.message) {
						description = error.message;
					} else if (status === 404) {
						description = "Voucher not found.";
					} else if (status === 403) {
						description =
							"This voucher cannot be redeemed. It may be inactive, expired, or already used.";
					}

					toast({
						title: "Redeem failed",
						description,
						variant: "destructive",
					});
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" className="flex items-center">
					<Ticket className="mr-2 h-4 w-4" />
					Redeem Voucher
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Redeem Voucher</DialogTitle>
					<DialogDescription>
						Enter a voucher code to add credits to your organization.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="voucher-code">Voucher Code</Label>
						<Input
							id="voucher-code"
							placeholder="e.g. PROMO2026"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							disabled={isPending}
							required
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Redeeming…" : "Redeem"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
