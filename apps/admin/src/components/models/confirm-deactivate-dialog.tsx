"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/lib/icons/Spinner";

interface ConfirmDeactivateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason?: string) => Promise<void>;
	modelName: string;
	loading: boolean;
}

export function ConfirmDeactivateDialog({
	open,
	onOpenChange,
	onConfirm,
	modelName,
	loading,
}: ConfirmDeactivateDialogProps) {
	const [reason, setReason] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onConfirm(reason);
		setReason("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Deactivate Model</DialogTitle>
					<DialogDescription>
						Are you sure you want to permanently deactivate{" "}
						<span className="font-semibold">{modelName}</span>? This action
						cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					{loading && (
						<div className="flex items-center justify-center py-4">
							<Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
							<span className="ml-2 text-sm text-muted-foreground">
								Deactivating...
							</span>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="reason">Reason (Optional)</Label>
						<Textarea
							id="reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Why are you deactivating this model?"
							rows={4}
							disabled={loading}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							onClick={() => onOpenChange(false)}
							variant="outline"
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" variant="destructive" disabled={loading}>
							{loading ? "Deactivating..." : "Confirm Deactivation"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
