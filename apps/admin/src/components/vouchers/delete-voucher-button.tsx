"use client";

import { Trash2 } from "lucide-react";
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
import { useAppConfig } from "@/lib/config";
import Spinner from "@/lib/icons/Spinner";

export function DeleteVoucherButton({
	voucherId,
	voucherCode,
}: {
	voucherId: string;
	voucherCode: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const config = useAppConfig();

	const handleDelete = async () => {
		setLoading(true);

		try {
			const response = await fetch(
				`${config.apiUrl}/admin/vouchers/${voucherId}`,
				{
					method: "DELETE",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Failed to delete voucher");
			}

			toast.success("Voucher Deleted", {
				description: `Voucher "${voucherCode}" has been deleted.`,
			});

			setOpen(false);
			router.push("/vouchers");
			router.refresh();
		} catch (error) {
			toast.error("Delete Failed", {
				description: (error as any)?.message || "Failed to delete voucher.",
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
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="text-red-600 hover:text-red-700"
				>
					<Trash2 className="mr-1 h-4 w-4" />
					Delete
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Delete Voucher</DialogTitle>
					<DialogDescription>
						This will permanently delete the voucher and all associated
						redemption logs. This action cannot be undone.
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-6">
						<Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
						<span className="ml-2 text-sm text-muted-foreground">
							Deleting voucher...
						</span>
					</div>
				) : (
					<div className="space-y-4 py-4">
						<div className="rounded-md bg-muted p-4">
							<p className="text-sm font-medium">Voucher Details</p>
							<p className="text-sm text-muted-foreground mt-1">
								<strong>Code:</strong> {voucherCode}
							</p>
							<p className="text-sm text-muted-foreground">
								<strong>ID:</strong> {voucherId}
							</p>
						</div>
					</div>
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
					<Button
						type="button"
						onClick={handleDelete}
						disabled={loading}
						variant="destructive"
					>
						{loading ? "Deleting..." : "Delete Voucher"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
