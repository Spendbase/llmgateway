"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
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
import { useApi } from "@/lib/fetch-client";
import { getErrorMessage } from "@/lib/utils";

import type React from "react";

export function DeleteBannerButton({ bannerId }: { bannerId: string }) {
	return (
		<DeleteBannerDialog bannerId={bannerId}>
			<Button
				variant="outline"
				className="flex items-center cursor-pointer gap-2 text-red-600 hover:text-red-700
			hover:bg-red-500/10"
			>
				<Trash2 className="h-4 w-4" />
				Delete Banner
			</Button>
		</DeleteBannerDialog>
	);
}
export function DeleteBannerDialog({
	children,
	bannerId,
}: {
	children: React.ReactNode;
	bannerId: string;
}) {
	const [open, setOpen] = useState(false);
	const api = useApi();
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);
	const { mutateAsync: deleteBanner } = api.useMutation(
		"delete",
		"/admin/banners/{id}",
		{
			onSuccess: () => {
				setOpen(false);
				setLoading(false);
				toast.success("Banner deleted", {
					description: "The banner has been deleted successfully.",
				});
				queryClient.invalidateQueries({ queryKey: ["get", "/admin/banners"] });
			},
			onError: (error: unknown) => {
				setOpen(false);
				setLoading(false);
				toast.error("Failed to delete banner", {
					description: getErrorMessage(error),
					style: {
						backgroundColor: "var(--destructive)",
						color: "var(--destructive-foreground)",
					},
				});
			},
		},
	);

	const handleOpen = () => {
		setOpen(!open);
	};

	const handleDelete = async () => {
		setLoading(true);
		await deleteBanner({ params: { path: { id: bannerId } } });
	};

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Delete Banner</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this banner?
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button
						disabled={loading}
						className="cursor-pointer"
						type="button"
						onClick={handleOpen}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="cursor-pointer"
						disabled={loading}
						type="button"
						onClick={handleDelete}
						variant="destructive"
					>
						{loading ? "Deleting..." : "Delete Banner"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
