"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { Button } from "@/lib/components/button";
import { Label } from "@/lib/components/label";
import { Textarea } from "@/lib/components/textarea";
import { toast } from "@/lib/components/use-toast";
import { useDashboardState } from "@/lib/dashboard-state";
import { useApi } from "@/lib/fetch-client";

export function OrganizationContextSettings() {
	const queryClient = useQueryClient();
	const { selectedOrganization } = useDashboardState();

	const api = useApi();
	const updateOrganization = api.useMutation("patch", "/orgs/{id}", {
		onSuccess: () => {
			const queryKey = api.queryOptions("get", "/orgs").queryKey;
			queryClient.invalidateQueries({ queryKey });
		},
	});

	const [context, setContext] = useState<string>(
		selectedOrganization?.organizationContext || "",
	);

	useEffect(() => {
		setContext(selectedOrganization?.organizationContext || "");
	}, [selectedOrganization?.id, selectedOrganization?.organizationContext]);

	if (!selectedOrganization) {
		return (
			<p className="text-muted-foreground text-sm">
				Please select an organization to configure context settings.
			</p>
		);
	}

	const handleSave = async () => {
		try {
			await updateOrganization.mutateAsync({
				params: { path: { id: selectedOrganization.id } },
				body: { organizationContext: context },
			});

			toast({
				title: "Settings saved",
				description: "Your organization context has been updated.",
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error?.message || "Failed to save organization context settings.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-4">
			{selectedOrganization && (
				<p className="text-muted-foreground text-sm">
					Organization: {selectedOrganization.name}
				</p>
			)}

			<div className="space-y-2">
				<Label htmlFor="orgContext">Context</Label>
				<Textarea
					id="orgContext"
					placeholder="Enter organization-wide context that will be prepended to all prompts..."
					value={context}
					onChange={(e) => setContext(e.target.value)}
					rows={6}
				/>
				<p className="text-sm text-muted-foreground">
					This context will be automatically added to every prompt sent through
					this organization. Leave empty to disable.
				</p>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={updateOrganization.isPending}>
					{updateOrganization.isPending ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	);
}
