import { useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useMemo, useState } from "react";

import { Button } from "@/lib/components/button";
import { Checkbox } from "@/lib/components/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/lib/components/tooltip";
import { toast } from "@/lib/components/use-toast";
import { useApi } from "@/lib/fetch-client";

import type { Project } from "@/lib/types";
import type React from "react";

interface CreateApiKeyDialogProps {
	children: React.ReactNode;
	selectedProject: Project;
	disabled?: boolean;
	disabledMessage?: string;
}

type ExpirationDuration =
	| "none"
	| "1h"
	| "1d"
	| "7d"
	| "30d"
	| "90d"
	| "180d"
	| "1y";

function computeExpiresAt(duration: ExpirationDuration): Date | null {
	if (duration === "none") {
		return null;
	}
	const now = new Date();
	const ms = now.getTime();
	const durations: Record<Exclude<ExpirationDuration, "none">, number> = {
		"1h": 60 * 60 * 1000,
		"1d": 24 * 60 * 60 * 1000,
		"7d": 7 * 24 * 60 * 60 * 1000,
		"30d": 30 * 24 * 60 * 60 * 1000,
		"90d": 90 * 24 * 60 * 60 * 1000,
		"180d": 180 * 24 * 60 * 60 * 1000,
		"1y": 365 * 24 * 60 * 60 * 1000,
	};
	return new Date(ms + durations[duration]);
}

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

export function CreateApiKeyDialog({
	children,
	selectedProject,
	disabled = false,
	disabledMessage,
}: CreateApiKeyDialogProps) {
	const queryClient = useQueryClient();
	const posthog = usePostHog();
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"form" | "created">("form");
	const [name, setName] = useState("");
	const [limit, setLimit] = useState<string>("0");
	const [limitChecked, setLimitChecked] = useState<boolean>(false);
	const [resetPeriod, setResetPeriod] = useState<string>("none");
	const [expirationDuration, setExpirationDuration] =
		useState<ExpirationDuration>("none");
	const [apiKey, setApiKey] = useState("");
	const api = useApi();

	const { mutate: createApiKey } = api.useMutation("post", "/keys/api");

	const expirationPreview = useMemo(() => {
		const date = computeExpiresAt(expirationDuration);
		if (!date) {
			return null;
		}
		return Intl.DateTimeFormat(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	}, [expirationDuration]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast({ title: "Please enter an API key name.", variant: "destructive" });
			return;
		}

		const finalResetPeriod = limitChecked ? resetPeriod : "none";
		const expiresAt = computeExpiresAt(expirationDuration);

		createApiKey(
			{
				body: {
					description: name.trim(),
					projectId: selectedProject.id,
					usageLimit: limitChecked ? limit : null,
					resetPeriod: finalResetPeriod as
						| "daily"
						| "weekly"
						| "monthly"
						| "none",
					expiresAt: expiresAt ? expiresAt.toISOString() : null,
				},
			},
			{
				onSuccess: (data) => {
					const createdKey = data.apiKey;

					posthog.capture("api_key_created", {
						description: createdKey.description,
						keyId: createdKey.id,
					});

					setApiKey(createdKey.token);
					setStep("created");
				},
			},
		);
	};

	const copyToClipboard = () => {
		navigator.clipboard.writeText(apiKey);
		toast({
			title: "API Key Copied",
			description: "The API key has been copied to your clipboard.",
		});
	};

	const handleClose = () => {
		setOpen(false);
		setTimeout(() => {
			const queryKey = api.queryOptions("get", "/keys/api", {
				params: { query: { projectId: selectedProject.id } },
			}).queryKey;

			void queryClient.invalidateQueries({ queryKey });

			setStep("form");
			setName("");
			setApiKey("");
			setLimit("");
			setLimitChecked(false);
			setResetPeriod("none");
			setExpirationDuration("none");
		}, 300);
	};

	const triggerElement = disabled ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<div>{children}</div>
			</TooltipTrigger>
			<TooltipContent>
				<p>{disabledMessage || "API key limit reached"}</p>
			</TooltipContent>
		</Tooltip>
	) : (
		children
	);

	return (
		<Dialog open={open} onOpenChange={disabled ? undefined : setOpen}>
			{!disabled && <DialogTrigger asChild>{triggerElement}</DialogTrigger>}
			{disabled && triggerElement}
			<DialogContent className="sm:max-w-[500px]">
				{step === "form" ? (
					<>
						<DialogHeader>
							<DialogTitle>Create API Key</DialogTitle>
							<DialogDescription>
								Create a new API key to access LLM API.
								<span className="block mt-1">
									Project: {selectedProject.name}
								</span>
								<span className="block mt-2 text-xs">
									💡 After creation, you can configure IAM rules to control
									access to specific models, providers, or pricing tiers.
								</span>
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">API Key Name</Label>
								<Input
									id="name"
									placeholder="e.g. Production API Key"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Checkbox
										id="limit-checkbox"
										checked={limitChecked}
										onCheckedChange={(v) => {
											if (v !== "indeterminate") {
												setLimitChecked(v);
												if (!v) {
													setResetPeriod("none");
												}
											}
										}}
									/>
									<Label htmlFor="limit-checkbox">
										Set API Key Usage Limit
									</Label>
								</div>
								<div
									className={`text-muted-foreground text-sm ${limitChecked ? "block" : "hidden"}`}
								>
									Usage includes both usage from LLM API credits and usage from
									your own provider keys when applicable.
								</div>
								<div
									className={`relative ${limitChecked ? "block" : "hidden"}`}
								>
									<span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
										$
									</span>
									<Input
										className="pl-6"
										id="limit"
										value={limit}
										onChange={(e) => setLimit(e.target.value)}
										type="number"
										min={0}
										required={limitChecked}
									/>
								</div>
							</div>
							{/* Reset Period - only visible when limit is set */}
							<div className={`space-y-2 ${limitChecked ? "block" : "hidden"}`}>
								<Label htmlFor="reset-period">Reset Period</Label>
								<Select value={resetPeriod} onValueChange={setResetPeriod}>
									<SelectTrigger id="reset-period" className="w-full">
										<SelectValue placeholder="Select reset period" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										<SelectItem value="daily">Daily</SelectItem>
										<SelectItem value="weekly">Weekly</SelectItem>
										<SelectItem value="monthly">Monthly</SelectItem>
									</SelectContent>
								</Select>
								<div className="text-muted-foreground text-xs">
									Usage will be reset to $0.00 at the end of each period.
								</div>
							</div>
							{/* Expiration */}
							<div className="space-y-2">
								<Label htmlFor="expiration">Expiration</Label>
								<Select
									value={expirationDuration}
									onValueChange={(v) =>
										setExpirationDuration(v as ExpirationDuration)
									}
								>
									<SelectTrigger id="expiration" className="w-full">
										<SelectValue placeholder="Select expiration" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(expirationLabels).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{expirationPreview && (
									<div className="text-muted-foreground text-xs">
										Key will expire on: {expirationPreview}
									</div>
								)}
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" onClick={handleClose}>
									Cancel
								</Button>
								<Button type="submit">Create API Key</Button>
							</DialogFooter>
						</form>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>API Key Created</DialogTitle>
							<DialogDescription>
								Your API key has been created. Please copy it now as you won't
								be able to see it again.
								<span className="block mt-2 text-xs">
									💡 You can now configure IAM rules for this key to control
									model access from the API Keys page.
								</span>
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="api-key">API Key</Label>
								<div className="flex items-center space-x-2">
									<Input
										id="api-key"
										value={apiKey}
										readOnly
										className="font-mono text-xs"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={copyToClipboard}
									>
										<Copy className="h-4 w-4" />
										<span className="sr-only">Copy API key</span>
									</Button>
								</div>
								<p className="text-muted-foreground text-xs">
									Make sure to store this API key securely. You won't be able to
									see it again.
								</p>
							</div>
							<DialogFooter>
								<Button onClick={handleClose}>Done</Button>
							</DialogFooter>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
