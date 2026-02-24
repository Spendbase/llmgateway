"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/fetch-client";
import Spinner from "@/lib/icons/Spinner";

import type { Organization } from "@/lib/types";
import type React from "react";

export function DepositCreditsButton({
	organization,
}: {
	organization: Organization;
}) {
	return (
		<DepositCreditsDialog organization={organization}>
			<Button className="flex items-center cursor-pointer gap-2">
				<Plus className="h-4 w-4" />
				Deposit Credits
			</Button>
		</DepositCreditsDialog>
	);
}

interface DepositCreditsDialogProps {
	children: React.ReactNode;
	organization: Organization;
}

export function DepositCreditsDialog({
	children,
	organization,
}: DepositCreditsDialogProps) {
	const router = useRouter();

	const [open, setOpen] = useState(false);

	const [amount, setAmount] = useState<number>(50);
	const [description, setDescription] = useState<string>("");

	const [loading, setLoading] = useState(false);

	const presetAmounts = [10, 25, 50, 100];

	const api = useApi();

	const { mutateAsync: depositCredits } = api.useMutation(
		"post",
		"/admin/deposit-credits",
	);

	const handleOpen = () => {
		setOpen(!open);
		setDescription("");
		setAmount(50);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setDescription(e.target.value);
	};
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!description.trim()) {
			toast.error("Validation Error", {
				description: "Description cannot be empty or just spaces",
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
			return;
		}

		setLoading(true);

		try {
			await depositCredits({
				body: { amount, description, organizationId: organization.id },
			});
			toast.success("Payment Successful", {
				description:
					"Your credits have been added to your organization account.",
			});

			setOpen(false);
			router.refresh();
		} catch (error) {
			toast.error("Payment Failed", {
				description:
					(error as any)?.message ||
					"An error occurred while processing your payment.",
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
			setLoading(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Deposit Credits</DialogTitle>
					<DialogDescription>
						Add credits to your organization account.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					{loading && (
						<div className="flex items-center justify-center py-4">
							<Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
							<span className="ml-2 text-sm text-muted-foreground">
								Submitting...
							</span>
						</div>
					)}

					<Label htmlFor="organization">Organization</Label>
					<Input
						id="organization"
						readOnly
						type="text"
						value={organization?.name}
					/>

					<div className="space-y-2">
						<Label htmlFor="amount">Amount (USD)</Label>
						<Input
							id="amount"
							type="number"
							min={5}
							value={amount}
							onChange={(e) => setAmount(Number(e.target.value))}
							required
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{presetAmounts.map((preset) => (
							<Button
								key={preset}
								type="button"
								variant="outline"
								onClick={() => setAmount(preset)}
							>
								${preset}
							</Button>
						))}
					</div>
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						value={description}
						onChange={handleInputChange}
						placeholder="Reason for deposit"
						required
					/>
					<DialogFooter>
						<Button type="button" onClick={handleOpen} variant="outline">
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Processing..." : "Confirm"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
