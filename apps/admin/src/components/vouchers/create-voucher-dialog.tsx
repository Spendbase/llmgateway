"use client";

import { Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAppConfig } from "@/lib/config";
import Spinner from "@/lib/icons/Spinner";

export function CreateVoucherDialog() {
	const router = useRouter();
	const config = useAppConfig();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	// Form state
	const [depositAmount, setDepositAmount] = useState(0);
	const [globalUsageLimit, setGlobalUsageLimit] = useState(1);
	const [orgUsageLimit, setOrgUsageLimit] = useState(1);
	const [code, setCode] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [isActive, setIsActive] = useState(true);

	const resetForm = () => {
		setDepositAmount(0);
		setGlobalUsageLimit(1);
		setOrgUsageLimit(1);
		setCode("");
		setExpiresAt("");
		setIsActive(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch(`${config.apiUrl}/admin/vouchers`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					code: code || undefined,
					depositAmount: Number(depositAmount),
					globalUsageLimit: Number(globalUsageLimit),
					orgUsageLimit: Number(orgUsageLimit),
					expiresAt: expiresAt || null,
					isActive,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Failed to create voucher");
			}

			toast.success("Voucher Created", {
				description: "The voucher has been created successfully.",
			});

			setOpen(false);
			resetForm();
			router.refresh();
		} catch (error) {
			toast.error("Creation Failed", {
				description: (error as any)?.message || "Failed to create voucher.",
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				setOpen(value);
				if (!value) {
					resetForm();
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant="default" size="sm">
					<Ticket className="mr-1 h-4 w-4" />
					Create Voucher
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create Voucher</DialogTitle>
					<DialogDescription>
						Create a new voucher code for organizations to redeem deposit
						credits.
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-6">
						<Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
						<span className="ml-2 text-sm text-muted-foreground">
							Creating voucher...
						</span>
					</div>
				) : (
					<form onSubmit={handleSubmit} id="create-voucher-form">
						<div className="space-y-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="depositAmount">Deposit Amount</Label>
								<Input
									id="depositAmount"
									type="number"
									min={0}
									value={depositAmount}
									onChange={(e) => setDepositAmount(Number(e.target.value))}
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="globalUsageLimit">Global Usage Limit</Label>
								<Input
									id="globalUsageLimit"
									type="number"
									min={1}
									value={globalUsageLimit}
									onChange={(e) => setGlobalUsageLimit(Number(e.target.value))}
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="orgUsageLimit">Org Usage Limit</Label>
								<Input
									id="orgUsageLimit"
									type="number"
									min={1}
									value={orgUsageLimit}
									onChange={(e) => setOrgUsageLimit(Number(e.target.value))}
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="code">Code (optional)</Label>
								<Input
									id="code"
									type="text"
									placeholder="Leave empty to auto-generate"
									value={code}
									onChange={(e) => setCode(e.target.value)}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="expiresAt">Expires At (optional)</Label>
								<Input
									id="expiresAt"
									type="datetime-local"
									value={expiresAt}
									onChange={(e) => setExpiresAt(e.target.value)}
								/>
							</div>

							<div className="flex items-center gap-2">
								<Checkbox
									id="isActive"
									checked={isActive}
									onCheckedChange={(checked) => setIsActive(checked === true)}
								/>
								<Label htmlFor="isActive" className="cursor-pointer">
									Active
								</Label>
							</div>
						</div>
					</form>
				)}

				<DialogFooter>
					<Button
						type="button"
						onClick={() => setOpen(false)}
						variant="outline"
						disabled={loading}
					>
						Cancel
					</Button>
					<Button type="submit" form="create-voucher-form" disabled={loading}>
						{loading ? "Creating..." : "Create Voucher"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
