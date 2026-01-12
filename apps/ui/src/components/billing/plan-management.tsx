"use client";

import { Badge } from "@/lib/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { useDashboardState } from "@/lib/dashboard-state";

export function PlanManagement() {
	const { selectedOrganization } = useDashboardState();

	if (!selectedOrganization) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Plan & Billing</CardTitle>
					<CardDescription>Loading plan information...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const isProPlan = selectedOrganization.plan === "pro";

	return (
		<Card>
			<CardHeader>
				<CardTitle>Plan & Billing</CardTitle>
				<CardDescription>
					Manage your subscription and billing preferences
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-lg font-medium">Current Plan</h3>
							<Badge variant={isProPlan ? "default" : "secondary"}>
								{isProPlan ? "Pro" : "Free"}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground mt-1">
							{isProPlan
								? "Access to provider keys and all features"
								: "Limited to credits-based usage only"}
						</p>
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold">
							{isProPlan ? "$50" : "$0"}
							<span className="text-sm font-normal text-muted-foreground">
								/month
							</span>
						</p>
					</div>
				</div>

				<div className="border rounded-lg p-4 space-y-3">
					<h4 className="font-medium">Plan Features</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div
									className={`w-2 h-2 rounded-full ${
										isProPlan ? "bg-green-500" : "bg-gray-300"
									}`}
								/>
								<span>Provider API Keys</span>
								{!isProPlan && (
									<Badge variant="outline" className="text-xs">
										Pro Only
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								<span>30-day data retention</span>
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								<span>Credits System</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								<span>Hybrid Mode</span>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
