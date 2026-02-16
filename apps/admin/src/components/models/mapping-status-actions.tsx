"use client";

import {
	AlertCircle,
	CheckCircle,
	XCircle,
	MoreVertical,
	Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CustomBadge as Badge } from "@/components/ui/custom-badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApi } from "@/lib/fetch-client";

import { ConfirmDeactivateDialog } from "./confirm-deactivate-dialog";

import type { ModelProviderMapping } from "@/lib/models";

interface MappingStatusActionsProps {
	mapping: ModelProviderMapping;
	modelName: string;
}

export function MappingStatusActions({
	mapping,
	modelName,
}: MappingStatusActionsProps) {
	const router = useRouter();
	const api = useApi();
	const [loading, setLoading] = useState(false);
	const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

	const { mutateAsync: updateStatus } = api.useMutation(
		"patch",
		"/admin/models/mappings/{id}",
	);

	const handleStatusChange = async (newStatus: "active" | "inactive") => {
		setLoading(true);

		try {
			await updateStatus({
				params: { path: { id: mapping.id } },
				body: { status: newStatus },
			});

			toast.success("Status Updated", {
				description: `Mapping status changed to ${newStatus}`,
			});

			router.refresh();
		} catch (error) {
			toast.error("Update Failed", {
				description:
					(error as any)?.message || "Failed to update mapping status",
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDeactivate = async (reason?: string) => {
		setLoading(true);

		try {
			await updateStatus({
				params: { path: { id: mapping.id } },
				body: { status: "deactivated", reason },
			});

			toast.success("Mapping Deactivated", {
				description: "Mapping has been permanently deactivated",
			});

			setShowDeactivateDialog(false);
			router.refresh();
		} catch (error) {
			toast.error("Deactivation Failed", {
				description:
					error instanceof Error
						? error.message
						: "Failed to deactivate mapping",
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
		} finally {
			setLoading(false);
		}
	};

	if (mapping.status === "deactivated") {
		return (
			<div className="flex items-center gap-2">
				<Badge variant="error">
					<XCircle className="h-3 w-3" />
					Deactivated
				</Badge>
				{mapping.deactivationReason && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Info className="h-4 w-4 text-muted-foreground cursor-help" />
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-xs">{mapping.deactivationReason}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
		);
	}

	return (
		<>
			<div className="flex items-center gap-2">
				<Badge variant={mapping.status === "active" ? "success" : "warning"}>
					{mapping.status === "active" ? (
						<CheckCircle className="h-3 w-3" />
					) : (
						<AlertCircle className="h-3 w-3" />
					)}
					{mapping.status}
				</Badge>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 w-7 p-0"
							disabled={loading}
						>
							<MoreVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{mapping.status === "active" ? (
							<>
								<DropdownMenuItem
									onClick={() => handleStatusChange("inactive")}
								>
									<AlertCircle className="mr-2 h-4 w-4" />
									Disable Temporarily
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setShowDeactivateDialog(true)}
									className="text-destructive"
								>
									<XCircle className="mr-2 h-4 w-4" />
									Deactivate Permanently
								</DropdownMenuItem>
							</>
						) : (
							<>
								<DropdownMenuItem onClick={() => handleStatusChange("active")}>
									<CheckCircle className="mr-2 h-4 w-4" />
									Activate
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setShowDeactivateDialog(true)}
									className="text-destructive"
								>
									<XCircle className="mr-2 h-4 w-4" />
									Deactivate Permanently
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<ConfirmDeactivateDialog
				open={showDeactivateDialog}
				onOpenChange={setShowDeactivateDialog}
				onConfirm={handleDeactivate}
				modelName={`${modelName} (${mapping.providerId})`}
				loading={loading}
			/>
		</>
	);
}
