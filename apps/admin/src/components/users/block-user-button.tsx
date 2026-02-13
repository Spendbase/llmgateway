"use client";

import { Ban, ShieldCheck } from "lucide-react";
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

import type { AdminUser } from "@/lib/types";

export function BlockUserButton({ user }: { user: AdminUser }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const config = useAppConfig();

	const isBlocked = user.status === "blocked";

	const handleToggleBlock = async () => {
		setLoading(true);

		try {
			const response = await fetch(
				`${config.apiUrl}/admin/users/${user.id}/status`,
				{
					method: "PATCH",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						status: isBlocked ? "active" : "blocked",
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Failed to update user status");
			}

			const result = await response.json();
			const affectedOrgs = result?.affectedOrganizations || 0;

			toast.success(isBlocked ? "User Unblocked" : "User Blocked", {
				description: isBlocked
					? `User ${user.email} has been unblocked. ${affectedOrgs} organization(s) reactivated.`
					: `User ${user.email} has been blocked. ${affectedOrgs} organization(s) suspended.`,
			});

			setOpen(false);
			router.refresh();
		} catch (error) {
			toast.error("Operation Failed", {
				description:
					(error as any)?.message ||
					`Failed to ${isBlocked ? "unblock" : "block"} user.`,
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
				{isBlocked ? (
					<Button
						variant="outline"
						size="sm"
						className="text-green-600 hover:text-green-700"
					>
						<ShieldCheck className="mr-1 h-4 w-4" />
						Unblock
					</Button>
				) : (
					<Button
						variant="outline"
						size="sm"
						className="text-red-600 hover:text-red-700"
					>
						<Ban className="mr-1 h-4 w-4" />
						Block
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{isBlocked ? "Unblock User" : "Block User"}</DialogTitle>
					<DialogDescription>
						{isBlocked
							? "This will reactivate the user's account and all their owned organizations."
							: "This will prevent the user from logging in and suspend all their owned organizations. All API requests from their organizations will be blocked."}
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-6">
						<Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
						<span className="ml-2 text-sm text-muted-foreground">
							{isBlocked ? "Unblocking user..." : "Blocking user..."}
						</span>
					</div>
				) : (
					<div className="space-y-4 py-4">
						<div className="rounded-md bg-muted p-4">
							<p className="text-sm font-medium">User Details</p>
							<p className="text-sm text-muted-foreground mt-1">
								<strong>Email:</strong> {user.email}
							</p>
							<p className="text-sm text-muted-foreground">
								<strong>Name:</strong> {user.name || "N/A"}
							</p>
							<p className="text-sm text-muted-foreground">
								<strong>Organizations:</strong> {user.organizations.length}
							</p>
						</div>

						{!isBlocked && user.organizations.length > 0 && (
							<div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
								<p className="text-sm font-medium text-yellow-800">Warning</p>
								<p className="text-sm text-yellow-700 mt-1">
									This user owns {user.organizations.length} organization(s).
									All their organizations will be suspended and API access will
									be blocked immediately.
								</p>
							</div>
						)}
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
						onClick={handleToggleBlock}
						disabled={loading}
						variant={isBlocked ? "default" : "destructive"}
					>
						{loading
							? isBlocked
								? "Unblocking..."
								: "Blocking..."
							: isBlocked
								? "Unblock User"
								: "Block User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
