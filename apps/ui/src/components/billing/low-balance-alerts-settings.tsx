"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { Button } from "@/lib/components/button";
import { Checkbox } from "@/lib/components/checkbox";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { useToast } from "@/lib/components/use-toast";
import { useDashboardState } from "@/lib/dashboard-state";
import { useApi } from "@/lib/fetch-client";

function LowBalanceAlertsSettings() {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const api = useApi();

	const { selectedOrganization } = useDashboardState();

	const { data: alertSettings, isLoading: isFetching } = api.useQuery(
		"get",
		"/orgs/{id}/low-balance-alert",
		{
			params: {
				path: { id: selectedOrganization?.id as string },
			},
		},
		{
			enabled: !!selectedOrganization?.id,
		},
	);

	const updateAlerts = api.useMutation("put", "/orgs/{id}/low-balance-alert");

	const [enabled, setEnabled] = useState(false);
	const [threshold, setThreshold] = useState<number | "">(10);
	const [emailInput, setEmailInput] = useState("");
	const [alertEmails, setAlertEmails] = useState<string[]>([]);

	useEffect(() => {
		if (alertSettings) {
			setEnabled(alertSettings.lowBalanceAlertEnabled);
			setThreshold(
				alertSettings.lowBalanceAlertThreshold
					? Number(alertSettings.lowBalanceAlertThreshold)
					: 10,
			);
			setAlertEmails(alertSettings.alertEmails || []);
		}
	}, [alertSettings]);

	const isValidEmail = (email: string) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	};

	const handleAddEmail = (e?: React.FormEvent) => {
		if (e) {
			e.preventDefault();
		}
		const trimmed = emailInput.trim();
		if (!trimmed) {
			return;
		}

		if (!isValidEmail(trimmed)) {
			toast({
				title: "Invalid email",
				description: "Please enter a valid email address.",
				variant: "destructive",
			});
			return;
		}

		if (alertEmails.includes(trimmed)) {
			toast({
				title: "Duplicate email",
				description: "This email is already in the list.",
				variant: "destructive",
			});
			return;
		}

		if (alertEmails.length >= 30) {
			toast({
				title: "Limit reached",
				description: "You can only add up to 30 alert emails.",
				variant: "destructive",
			});
			return;
		}

		setAlertEmails((prev) => [...prev, trimmed]);
		setEmailInput("");
	};

	const handleRemoveEmail = (emailToRemove: string) => {
		setAlertEmails((prev) => prev.filter((email) => email !== emailToRemove));
	};

	const handleSave = async () => {
		if (!selectedOrganization) {
			return;
		}

		const numThreshold = Number(threshold);
		if (isNaN(numThreshold) || numThreshold < 1) {
			toast({
				title: "Invalid threshold",
				description: "Threshold must be at least 1.",
				variant: "destructive",
			});
			return;
		}

		try {
			await updateAlerts.mutateAsync({
				params: {
					path: { id: selectedOrganization.id },
				},
				body: {
					lowBalanceAlertEnabled: enabled,
					lowBalanceAlertThreshold: numThreshold,
					alertEmails: alertEmails,
				},
			});

			await queryClient.invalidateQueries({
				queryKey: api.queryOptions("get", "/orgs/{id}/low-balance-alert", {
					params: { path: { id: selectedOrganization.id } },
				}).queryKey,
			});

			toast({
				title: "Settings saved",
				description: "Your low balance alert settings have been updated.",
			});
		} catch {
			toast({
				title: "Error",
				description: "Failed to save low balance alert settings.",
				variant: "destructive",
			});
		}
	};

	if (!selectedOrganization) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="low-balance-enabled">Enable Low Balance Alerts</Label>
					<p className="text-sm text-muted-foreground">
						Send emails when your credit balance drops below the threshold
					</p>
				</div>
				<Checkbox
					id="low-balance-enabled"
					checked={enabled}
					onCheckedChange={(checked) => setEnabled(!!checked)}
					disabled={isFetching || updateAlerts.isPending}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label htmlFor="alert-threshold">Threshold (USD)</Label>
					<Input
						id="alert-threshold"
						type="number"
						min={1}
						value={threshold}
						onChange={(e) =>
							setThreshold(e.target.value === "" ? "" : Number(e.target.value))
						}
						disabled={isFetching || updateAlerts.isPending}
					/>
					<p className="text-xs text-muted-foreground">
						Minimum $1. Alert triggers when balance falls below this amount.
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email-input">Alert Recipients</Label>
					<div className="flex space-x-2">
						<Input
							id="email-input"
							type="email"
							placeholder="admin@example.com"
							value={emailInput}
							onChange={(e) => setEmailInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddEmail();
								}
							}}
							disabled={isFetching || updateAlerts.isPending}
						/>
						<Button
							type="button"
							variant="secondary"
							onClick={() => handleAddEmail()}
							disabled={
								!emailInput.trim() || isFetching || updateAlerts.isPending
							}
						>
							Add
						</Button>
					</div>

					{alertEmails.length > 0 ? (
						<div className="mt-4 space-y-2">
							{alertEmails.map((email) => (
								<div
									key={email}
									className="flex items-center justify-between p-2 text-sm border rounded-md bg-muted/30"
								>
									<span className="truncate pr-2">{email}</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-6 px-2 text-muted-foreground hover:text-destructive text-xs"
										onClick={() => handleRemoveEmail(email)}
										disabled={isFetching || updateAlerts.isPending}
									>
										Remove
									</Button>
								</div>
							))}
							<p className="text-xs text-muted-foreground text-right">
								{alertEmails.length}/30 emails added
							</p>
						</div>
					) : (
						<p className="text-xs text-muted-foreground pt-2">
							No alert emails configured.
						</p>
					)}
				</div>
			</div>

			<div className="flex justify-end pt-4 border-t">
				<Button
					onClick={handleSave}
					disabled={
						isFetching ||
						updateAlerts.isPending ||
						threshold === "" ||
						Number(threshold) < 1
					}
				>
					{updateAlerts.isPending ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	);
}

export { LowBalanceAlertsSettings };
