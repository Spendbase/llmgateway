"use client";

import { Settings } from "lucide-react";

import { Label } from "@/components/ui/label";

export default function DevPlanSettings() {
	return (
		<div className="rounded-lg border p-6">
			<div className="flex items-center gap-2 mb-4">
				<Settings className="h-5 w-5" />
				<h3 className="font-semibold">Model Settings</h3>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Label htmlFor="allow-all-models" className="font-medium">
							Allow all models
						</Label>
						<p className="text-sm text-muted-foreground">
							Enable access to models beyond the curated coding model list
						</p>
					</div>
				</div>

				<div className="rounded-md bg-muted p-4">
					<p className="text-sm text-muted-foreground">
						Your dev plan is configured to use coding-optimized models only.
						These models support prompt caching, tool calling, JSON output, and
						streaming - all essential features for AI-powered coding.
					</p>
				</div>
			</div>
		</div>
	);
}
