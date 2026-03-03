import { useQueryClient } from "@tanstack/react-query";
import {
	BarChart3Icon,
	EditIcon,
	KeyIcon,
	MoreHorizontal,
	PlusIcon,
	Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/lib/components/alert-dialog";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/lib/components/dropdown-menu";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import { StatusBadge } from "@/lib/components/status-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";
import { Tabs, TabsList, TabsTrigger } from "@/lib/components/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/lib/components/tooltip";
import { toast } from "@/lib/components/use-toast";
import { useApi } from "@/lib/fetch-client";
import { extractOrgAndProjectFromPath } from "@/lib/navigation-utils";

import { CreateApiKeyDialog } from "./create-api-key-dialog";

import type { ApiKey, Project } from "@/lib/types";
import type { Route } from "next";

type ExpirationDuration =
	| "none"
	| "1h"
	| "1d"
	| "7d"
	| "30d"
	| "90d"
	| "180d"
	| "1y";
type EditExpirationDuration = "keep" | ExpirationDuration;

const resetPeriodLabels: Record<string, string> = {
	none: "None",
	daily: "Daily",
	weekly: "Weekly",
	monthly: "Monthly",
};

const expirationLabels: Record<ExpirationDuration, string> = {
	none: "No expiration",
	"1h": "1 hour",
	"1d": "1 day",
	"7d": "7 days",
	"30d": "30 days",
	"90d": "90 days",
	"180d": "180 days",
	"1y": "1 year",
};

function computeExpiresAt(duration: ExpirationDuration): Date | null {
	if (duration === "none") {
		return null;
	}
	const now = new Date();
	const durations: Record<Exclude<ExpirationDuration, "none">, number> = {
		"1h": 60 * 60 * 1000,
		"1d": 24 * 60 * 60 * 1000,
		"7d": 7 * 24 * 60 * 60 * 1000,
		"30d": 30 * 24 * 60 * 60 * 1000,
		"90d": 90 * 24 * 60 * 60 * 1000,
		"180d": 180 * 24 * 60 * 60 * 1000,
		"1y": 365 * 24 * 60 * 60 * 1000,
	};
	return new Date(now.getTime() + durations[duration]);
}

function formatDate(dateStr: string | null | undefined) {
	if (!dateStr) {
		return null;
	}
	return Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(dateStr));
}

interface ApiKeysListProps {
	selectedProject: Project | null;
	initialData: ApiKey[];
}

type StatusFilter = "all" | "active" | "inactive";
type CreatorFilter = "mine" | "all";

export function ApiKeysList({
	selectedProject,
	initialData,
}: ApiKeysListProps) {
	const queryClient = useQueryClient();
	const api = useApi();
	const pathname = usePathname();
	const { orgId, projectId } = useMemo(
		() => extractOrgAndProjectFromPath(pathname),
		[pathname],
	);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
	const [creatorFilter, setCreatorFilter] = useState<CreatorFilter>("all");

	const getIamRulesUrl = (keyId: string) =>
		`/${orgId}/${projectId}/api-keys/${keyId}/iam` as Route;

	const getStatisticsUrl = (keyId: string) =>
		`/${orgId}/${projectId}/usage?apiKeyId=${keyId}` as Route;

	// All hooks must be called before any conditional returns
	const { data, isLoading, error } = api.useQuery(
		"get",
		"/keys/api",
		{
			params: {
				query: {
					projectId: selectedProject?.id || "",
					filter: creatorFilter,
				},
			},
		},
		{
			enabled: !!selectedProject?.id,
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchInterval: false,
			// Only use initialData when filter is "all" (matches the SSR data)
			...(creatorFilter === "all" && {
				initialData: {
					apiKeys: initialData.map((key) => ({
						...key,
						token: key.token || "",
						maskedToken: key.maskedToken,
					})),
					userRole: "owner" as const,
				},
			}),
		},
	);

	const { mutate: deleteMutation } = api.useMutation(
		"delete",
		"/keys/api/{id}",
	);
	const { mutate: toggleKeyStatus } = api.useMutation(
		"patch",
		"/keys/api/{id}",
	);

	const { mutate: updateKeyUsageLimitMutation } = api.useMutation(
		"patch",
		"/keys/api/limit/{id}",
	);

	const allKeys = data?.apiKeys.filter((key) => key.status !== "deleted") || [];
	const activeKeys = allKeys.filter((key) => key.status === "active");
	const inactiveKeys = allKeys.filter((key) => key.status === "inactive");
	const planLimits = data?.planLimits;

	const filteredKeys = (() => {
		switch (statusFilter) {
			case "active":
				return activeKeys;
			case "inactive":
				return inactiveKeys;
			case "all":
			default:
				return allKeys;
		}
	})();

	// Auto-switch to a tab with content if current tab becomes empty
	useEffect(() => {
		if (filteredKeys.length === 0 && allKeys.length > 0) {
			if (statusFilter === "active" && inactiveKeys.length > 0) {
				setStatusFilter("inactive");
			} else if (statusFilter === "inactive" && activeKeys.length > 0) {
				setStatusFilter("active");
			} else if (statusFilter !== "all") {
				setStatusFilter("all");
			}
		}
	}, [
		filteredKeys.length,
		allKeys.length,
		activeKeys.length,
		inactiveKeys.length,
		statusFilter,
	]);

	// Show message if no project is selected
	if (!selectedProject) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
				<div className="mb-4">
					<KeyIcon className="h-10 w-10 text-gray-500" />
				</div>
				<p className="text-gray-400 mb-6">
					Please select a project to view API keys.
				</p>
			</div>
		);
	}

	// Handle loading state
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
				<div className="mb-4">
					<KeyIcon className="h-10 w-10 text-gray-500" />
				</div>
				<p className="text-gray-400 mb-6">Loading API keys...</p>
			</div>
		);
	}

	// Handle error state
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
				<div className="mb-4">
					<KeyIcon className="h-10 w-10 text-gray-500" />
				</div>
				<p className="text-gray-400 mb-6">
					Failed to load API keys. Please try again.
				</p>
			</div>
		);
	}

	const deleteKey = (id: string) => {
		deleteMutation(
			{
				params: {
					path: { id },
				},
			},
			{
				onSuccess: () => {
					const queryKey = api.queryOptions("get", "/keys/api", {
						params: {
							query: { projectId: selectedProject.id },
						},
					}).queryKey;

					queryClient.invalidateQueries({ queryKey });

					toast({ title: "API key deleted successfully." });
				},
			},
		);
	};

	const toggleStatus = (
		id: string,
		currentStatus: "active" | "inactive" | "deleted" | null,
	) => {
		const newStatus = currentStatus === "active" ? "inactive" : "active";

		toggleKeyStatus(
			{
				params: {
					path: { id },
				},
				body: {
					status: newStatus,
				},
			},
			{
				onSuccess: () => {
					const queryKey = api.queryOptions("get", "/keys/api", {
						params: {
							query: { projectId: selectedProject.id },
						},
					}).queryKey;

					queryClient.invalidateQueries({ queryKey });

					toast({
						title: "API Key Status Updated",
						description: "The API key status has been updated.",
					});
				},
			},
		);
	};

	const updateKeySettings = (
		id: string,
		newUsageLimit: string | null,
		newResetPeriod?: string,
		newExpiresAt?: string | null,
	) => {
		const body: {
			usageLimit?: string | null;
			resetPeriod?: "daily" | "weekly" | "monthly" | "none";
			expiresAt?: string | null;
		} = {
			usageLimit: newUsageLimit,
		};
		if (newResetPeriod !== undefined) {
			body.resetPeriod = (newUsageLimit ? newResetPeriod : "none") as
				| "daily"
				| "weekly"
				| "monthly"
				| "none";
		}
		if (newExpiresAt !== undefined) {
			body.expiresAt = newExpiresAt;
		}
		updateKeyUsageLimitMutation(
			{
				params: {
					path: { id },
				},
				body,
			},
			{
				onSuccess: () => {
					const queryKey = api.queryOptions("get", "/keys/api", {
						params: {
							query: { projectId: selectedProject.id },
						},
					}).queryKey;

					queryClient.invalidateQueries({ queryKey });

					toast({
						title: "API Key Settings Updated",
						description: "The API key settings have been updated.",
					});
				},
			},
		);
	};

	if (allKeys.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
				<div className="mb-4">
					<KeyIcon className="h-10 w-10 text-gray-500" />
				</div>
				<p className="text-gray-400 mb-6">No API keys have been created yet.</p>
				<CreateApiKeyDialog
					selectedProject={selectedProject}
					disabled={
						planLimits ? planLimits.currentCount >= planLimits.maxKeys : false
					}
					disabledMessage={
						planLimits
							? `${planLimits.plan === "pro" ? "Pro" : "Free"} plan allows maximum ${planLimits.maxKeys} API keys per project`
							: undefined
					}
				>
					<Button
						type="button"
						disabled={
							planLimits ? planLimits.currentCount >= planLimits.maxKeys : false
						}
						className="cursor-pointer flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<PlusIcon className="h-5 w-5" />
						Create API Key
					</Button>
				</CreateApiKeyDialog>
			</div>
		);
	}

	return (
		<>
			{/* Filter Tabs */}
			<div className="mb-6 flex flex-col gap-4">
				{/* Creator Filter */}
				<Tabs
					value={creatorFilter}
					onValueChange={(value) => setCreatorFilter(value as CreatorFilter)}
				>
					<TabsList className="flex space-x-2 w-full md:w-fit">
						<TabsTrigger value="all">All Keys</TabsTrigger>
						<TabsTrigger value="mine">My Keys</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* Status Filter Tabs */}
				<Tabs
					value={statusFilter}
					onValueChange={(value) => setStatusFilter(value as StatusFilter)}
				>
					<TabsList className="flex space-x-2 w-full md:w-fit">
						<TabsTrigger value="all">
							All{" "}
							<Badge
								variant={statusFilter === "all" ? "default" : "outline"}
								className="text-xs"
							>
								{allKeys.length}
							</Badge>
						</TabsTrigger>
						{activeKeys.length > 0 && (
							<TabsTrigger value="active">
								Active{" "}
								<Badge
									variant={statusFilter === "active" ? "default" : "outline"}
									className="text-xs"
								>
									{activeKeys.length}
								</Badge>
							</TabsTrigger>
						)}
						{inactiveKeys.length > 0 && (
							<TabsTrigger value="inactive">
								Inactive{" "}
								<Badge
									variant={statusFilter === "inactive" ? "default" : "outline"}
									className="text-xs"
								>
									{inactiveKeys.length}
								</Badge>
							</TabsTrigger>
						)}
					</TabsList>
				</Tabs>
			</div>

			{/* Plan Limits Display */}
			{planLimits && (
				<div className="mb-4 rounded-lg border bg-muted/30 p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="text-sm text-muted-foreground">
								<span className="font-medium">API Keys:</span>{" "}
								{planLimits.currentCount} of {planLimits.maxKeys} used
							</div>
							<div className="text-sm text-muted-foreground">
								<span className="font-medium">Plan:</span>{" "}
								{planLimits.plan === "pro" ? "Pro" : "Free"}
							</div>
						</div>
						{planLimits.currentCount >= planLimits.maxKeys && (
							<div className="text-xs text-amber-600 font-medium">
								Limit reached
							</div>
						)}
					</div>
					{planLimits.plan === "free" && planLimits.currentCount >= 3 && (
						<div className="mt-2 text-xs text-muted-foreground">
							💡 Upgrade to Pro plan to create up to 20 API keys per project
						</div>
					)}
				</div>
			)}

			{/* Desktop Table */}
			<div className="hidden md:block overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="w-40">API Key</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Created By</TableHead>
							<TableHead>Usage</TableHead>
							<TableHead>Usage Limit</TableHead>
							<TableHead>Reset</TableHead>
							<TableHead>Expires</TableHead>
							<TableHead>IAM Rules</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredKeys.map((key) => (
							<TableRow
								key={key.id}
								className="hover:bg-muted/30 transition-colors"
							>
								<TableCell className="font-medium">
									<span className="text-sm font-medium">{key.description}</span>
								</TableCell>
								<TableCell className="min-w-40 max-w-40">
									<div className="flex items-center space-x-2">
										<span className="font-mono text-xs truncate">
											{key.maskedToken}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<StatusBadge status={key.status} variant="detailed" />
								</TableCell>
								<TableCell>
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50 hover:border-muted-foreground">
												{Intl.DateTimeFormat(undefined, {
													month: "short",
													day: "numeric",
													year: "numeric",
												}).format(new Date(key.createdAt))}
											</span>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs text-xs whitespace-nowrap">
												{Intl.DateTimeFormat(undefined, {
													month: "short",
													day: "numeric",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												}).format(new Date(key.createdAt))}
											</p>
										</TooltipContent>
									</Tooltip>
								</TableCell>
								<TableCell>
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-muted-foreground cursor-help">
												{key.creator?.name || key.creator?.email || "Unknown"}
											</span>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs text-xs">
												{key.creator?.email || "No email available"}
											</p>
										</TooltipContent>
									</Tooltip>
								</TableCell>
								<TableCell>${Number(key.usage).toFixed(2)}</TableCell>
								<TableCell>
									<EditKeySettingsDialog
										keyData={key}
										onSave={updateKeySettings}
									/>
								</TableCell>
								<TableCell>
									<span className="text-sm">
										{resetPeriodLabels[key.resetPeriod] || "None"}
									</span>
									{key.nextResetAt && (
										<span className="block text-xs text-muted-foreground">
											{formatDate(key.nextResetAt)}
										</span>
									)}
								</TableCell>
								<TableCell>
									{key.expiresAt ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<span className="text-sm cursor-help border-b border-dotted border-muted-foreground/50 hover:border-muted-foreground">
													{Intl.DateTimeFormat(undefined, {
														month: "short",
														day: "numeric",
														year: "numeric",
													}).format(new Date(key.expiresAt))}
												</span>
											</TooltipTrigger>
											<TooltipContent>
												<p className="max-w-xs text-xs whitespace-nowrap">
													{formatDate(key.expiresAt)}
												</p>
											</TooltipContent>
										</Tooltip>
									) : (
										<span className="text-sm text-muted-foreground">Never</span>
									)}
								</TableCell>
								<TableCell>
									{key.iamRules && key.iamRules.length > 0 ? (
										<Button
											variant="outline"
											size="sm"
											className="text-xs"
											asChild
										>
											<Link href={getIamRulesUrl(key.id)}>
												{
													key.iamRules.filter(
														(rule) => rule.status === "active",
													).length
												}{" "}
												rule
												{key.iamRules.filter((rule) => rule.status === "active")
													.length !== 1
													? "s"
													: ""}
											</Link>
										</Button>
									) : (
										<Button
											variant="ghost"
											size="sm"
											className="text-xs text-muted-foreground"
											asChild
										>
											<Link href={getIamRulesUrl(key.id)}>No rules</Link>
										</Button>
									)}
								</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<MoreHorizontal className="h-4 w-4" />
												<span className="sr-only">Open menu</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>Actions</DropdownMenuLabel>
											<DropdownMenuItem asChild>
												<Link href={getStatisticsUrl(key.id)} prefetch={true}>
													<BarChart3Icon className="mr-2 h-4 w-4" />
													View Statistics
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link href={getIamRulesUrl(key.id)}>
													<Shield className="mr-2 h-4 w-4" />
													Manage IAM Rules
												</Link>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => toggleStatus(key.id, key.status)}
											>
												{key.status === "active" ? "Deactivate" : "Activate"}{" "}
												Key
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<DropdownMenuItem
														onSelect={(e) => e.preventDefault()}
														className="text-destructive focus:text-destructive"
													>
														Delete
													</DropdownMenuItem>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Are you absolutely sure?
														</AlertDialogTitle>
														<AlertDialogDescription>
															This action cannot be undone. This will
															permanently delete the API key and it will no
															longer be able to access your account.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => deleteKey(key.id)}
														>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Mobile Cards */}
			<div className="md:hidden space-y-3">
				{filteredKeys.map((key) => (
					<div key={key.id} className="border rounded-lg p-3 space-y-3">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<h3 className="font-medium text-sm">{key.description}</h3>
									<StatusBadge status={key.status} />
								</div>
								<div className="flex items-center gap-2 mt-1">
									<span className="text-xs text-muted-foreground">
										{Intl.DateTimeFormat(undefined, {
											month: "short",
											day: "numeric",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										}).format(new Date(key.createdAt))}
									</span>
								</div>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">Open menu</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>Actions</DropdownMenuLabel>
									<DropdownMenuItem asChild>
										<Link href={getStatisticsUrl(key.id)} prefetch={true}>
											<BarChart3Icon className="mr-2 h-4 w-4" />
											View Statistics
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href={getIamRulesUrl(key.id)}>
											<Shield className="mr-2 h-4 w-4" />
											Manage IAM Rules
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => toggleStatus(key.id, key.status)}
									>
										{key.status === "active" ? "Deactivate" : "Activate"} Key
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<DropdownMenuItem
												onSelect={(e) => e.preventDefault()}
												className="text-destructive focus:text-destructive"
											>
												Delete
											</DropdownMenuItem>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Are you absolutely sure?
												</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone. This will permanently
													delete the API key and it will no longer be able to
													access your account.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction onClick={() => deleteKey(key.id)}>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<div className="pt-2 border-t">
							<div className="text-xs text-muted-foreground mb-1">API Key</div>
							<div className="font-mono text-xs break-all">
								{key.maskedToken}
							</div>
						</div>
						<div className="pt-2 border-t grid grid-cols-2">
							<div className="py-1">
								<div className="text-xs text-muted-foreground mb-1">Usage</div>
								<div className="font-mono text-xs break-all">
									${Number(key.usage).toFixed(2)}
								</div>
							</div>
							<div>
								<EditKeySettingsDialog
									keyData={key}
									onSave={updateKeySettings}
								/>
							</div>
						</div>
						<div className="pt-2 border-t grid grid-cols-2">
							<div className="py-1">
								<div className="text-xs text-muted-foreground mb-1">Reset</div>
								<div className="text-xs">
									{resetPeriodLabels[key.resetPeriod] || "None"}
									{key.nextResetAt && (
										<span className="block text-muted-foreground">
											{formatDate(key.nextResetAt)}
										</span>
									)}
								</div>
							</div>
							<div className="py-1">
								<div className="text-xs text-muted-foreground mb-1">
									Expires
								</div>
								<div className="text-xs">
									{key.expiresAt ? formatDate(key.expiresAt) : "Never"}
								</div>
							</div>
						</div>
						<div className="pt-2 border-t">
							<div className="text-xs text-muted-foreground mb-1">
								IAM Rules
							</div>
							<div className="flex items-center">
								{key.iamRules && key.iamRules.length > 0 ? (
									<Button
										variant="outline"
										size="sm"
										className="text-xs h-7"
										asChild
									>
										<Link href={getIamRulesUrl(key.id)}>
											{
												key.iamRules.filter((rule) => rule.status === "active")
													.length
											}{" "}
											active rule
											{key.iamRules.filter((rule) => rule.status === "active")
												.length !== 1
												? "s"
												: ""}
										</Link>
									</Button>
								) : (
									<Button
										variant="ghost"
										size="sm"
										className="text-xs text-muted-foreground h-7"
										asChild
									>
										<Link href={getIamRulesUrl(key.id)}>
											No rules configured
										</Link>
									</Button>
								)}
							</div>
						</div>
						<div className="pt-2 border-t">
							<div className="text-xs text-muted-foreground mb-1">
								Created By
							</div>
							<div className="text-sm">
								{key.creator?.name || key.creator?.email || "Unknown"}
							</div>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

// Extracted edit dialog component with its own state for Select controls
function EditKeySettingsDialog({
	keyData,
	onSave,
}: {
	keyData: ApiKey;
	onSave: (
		id: string,
		usageLimit: string | null,
		resetPeriod?: string,
		expiresAt?: string | null,
	) => void;
}) {
	const [editResetPeriod, setEditResetPeriod] = useState(
		keyData.resetPeriod || "none",
	);
	const [editExpiration, setEditExpiration] =
		useState<EditExpirationDuration>("keep");

	// Reset local state when dialog opens (key prop from parent re-renders)
	const handleOpenChange = (open: boolean) => {
		if (open) {
			setEditResetPeriod(keyData.resetPeriod || "none");
			setEditExpiration("keep");
		}
	};

	return (
		<Dialog onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="min-w-28 flex justify-between"
				>
					{keyData.usageLimit
						? `$${Number(keyData.usageLimit).toFixed(2)}`
						: "No limit"}
					<EditIcon />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const formData = new FormData(e.target as HTMLFormElement);
						const newUsageLimit = formData.get("limit") as string | null;
						const finalLimit = newUsageLimit === "" ? null : newUsageLimit;
						const finalResetPeriod = finalLimit ? editResetPeriod : "none";
						let finalExpiresAt: string | null | undefined;
						if (editExpiration === "keep") {
							finalExpiresAt = undefined; // omit from PATCH → keep current
						} else if (editExpiration === "none") {
							finalExpiresAt = null; // explicitly remove expiration
						} else {
							finalExpiresAt = computeExpiresAt(editExpiration)!.toISOString();
						}
						onSave(keyData.id, finalLimit, finalResetPeriod, finalExpiresAt);
					}}
				>
					<DialogHeader>
						<DialogTitle>Edit API Key Settings</DialogTitle>
						<DialogDescription>
							Update the usage limit, reset period, and expiration for this API
							key.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 pt-6">
						<div className="space-y-2">
							<Label htmlFor="limit">
								Usage Limit (leave empty for no limit)
							</Label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
									$
								</span>
								<Input
									className="pl-6"
									id="limit"
									name="limit"
									defaultValue={
										keyData.usageLimit ? Number(keyData.usageLimit) : ""
									}
									type="number"
								/>
							</div>
							<div className="text-muted-foreground text-xs">
								Usage includes both usage from LLM API credits and usage from
								your own provider keys when applicable.
							</div>
						</div>
						<div className="space-y-2">
							<Label>Reset Period</Label>
							<Select
								value={editResetPeriod}
								onValueChange={(v) =>
									setEditResetPeriod(
										v as "none" | "daily" | "weekly" | "monthly",
									)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select reset period" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									<SelectItem value="daily">Daily</SelectItem>
									<SelectItem value="weekly">Weekly</SelectItem>
									<SelectItem value="monthly">Monthly</SelectItem>
								</SelectContent>
							</Select>
							<div className="text-amber-600 text-xs">
								⚠️ Warning: Changing the reset period will immediately reset
								your current usage to $0.00.
							</div>
						</div>
						<div className="space-y-2">
							<Label>Expiration</Label>
							<Select
								value={editExpiration}
								onValueChange={(v) =>
									setEditExpiration(v as EditExpirationDuration)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select expiration" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="keep">Keep current</SelectItem>
									{Object.entries(expirationLabels).map(([value, label]) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{editExpiration === "keep" && (
								<div className="text-muted-foreground text-xs">
									Current expiration:{" "}
									{keyData.expiresAt ? formatDate(keyData.expiresAt) : "Never"}.
									Choose a new duration to replace it, or select &quot;No
									expiration&quot; to remove it.
								</div>
							)}
							{editExpiration === "none" && (
								<div className="text-muted-foreground text-xs">
									Key will never expire.
								</div>
							)}
							{editExpiration !== "keep" && editExpiration !== "none" && (
								<div className="text-muted-foreground text-xs">
									Key will expire on:{" "}
									{formatDate(computeExpiresAt(editExpiration)?.toISOString())}.
								</div>
							)}
						</div>
					</div>
					<DialogFooter className="pt-6">
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<DialogClose asChild>
							<Button type="submit">Save changes</Button>
						</DialogClose>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
