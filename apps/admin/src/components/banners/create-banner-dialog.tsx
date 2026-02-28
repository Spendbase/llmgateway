"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { getErrorMessage } from "@/lib/utils";

import type React from "react";

export function CreateBannerButton() {
	return (
		<CreateBannerDialog>
			<Button className="flex items-center cursor-pointer gap-2">
				<Plus className="h-4 w-4" />
				Create Banner
			</Button>
		</CreateBannerDialog>
	);
}

interface CreateBannerDialogProps {
	children: React.ReactNode;
}

export function CreateBannerDialog({ children }: CreateBannerDialogProps) {
	const [open, setOpen] = useState(false);

	const [name, setName] = useState<string>("");
	const [description, setDescription] = useState<string>("");

	const [loading, setLoading] = useState(false);

	const api = useApi();
	const queryClient = useQueryClient();

	const { mutateAsync: createBanner } = api.useMutation(
		"post",
		"/admin/banners",
		{
			onSuccess: () => {
				toast.success("Banner created", {
					description: "The banner has been created successfully.",
				});
				queryClient.invalidateQueries({ queryKey: ["get", "/admin/banners"] });
			},
			onError: (error: unknown) => {
				toast.error("Failed to create banner", {
					description: getErrorMessage(error),
					style: {
						backgroundColor: "var(--destructive)",
						color: "var(--destructive-foreground)",
					},
				});
			},
			onSettled: () => {
				setOpen(false);
				setLoading(false);
				setName("");
				setDescription("");
			},
		},
	);

	const handleOpen = () => {
		setOpen(!open);
		setName("");
		setDescription("");
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		setLoading(true);

		if (!name.trim() || !description.trim()) {
			toast.error("Please enter a name and description", {
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
			setLoading(false);
			return;
		}

		await createBanner({
			body: {
				name: name.trim(),
				description: description.trim(),
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create Banner</DialogTitle>
					<DialogDescription>
						Create a new banner for your organization.
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

					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>

					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Banner description"
						required
					/>
					<DialogFooter>
						<Button
							className="cursor-pointer"
							type="button"
							onClick={handleOpen}
							variant="outline"
						>
							Cancel
						</Button>
						<Button className="cursor-pointer" type="submit" disabled={loading}>
							{loading ? "Processing..." : "Confirm"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
