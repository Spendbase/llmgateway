"use client";

import { Activity, CreditCard, Key, Sparkles, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrgOverview } from "@/hooks/use-org-section-query";

import type { OrgAnalyticsOverview } from "@/lib/types";

interface MetricCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	sub?: string;
}

function MetricCard({ title, value, icon, sub }: MetricCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<span className="text-muted-foreground">{icon}</span>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
			</CardContent>
		</Card>
	);
}

interface OrgOverviewCardsProps {
	orgId: string;
	initialData: OrgAnalyticsOverview;
}

export function OrgOverviewCards({
	orgId,
	initialData,
}: OrgOverviewCardsProps) {
	const { data } = useOrgOverview(orgId);

	const overview = data ?? initialData;

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
			<MetricCard
				title="Credits"
				value={`$${Number(overview.credits).toFixed(2)}`}
				icon={<CreditCard className="h-4 w-4" />}
			/>
			<MetricCard
				title="Total Requests"
				value={overview.totalRequests.toLocaleString()}
				icon={<Activity className="h-4 w-4" />}
			/>
			<MetricCard
				title="Total Tokens"
				value={
					overview.totalTokens >= 1_000_000
						? `${(overview.totalTokens / 1_000_000).toFixed(1)}M`
						: overview.totalTokens.toLocaleString()
				}
				icon={<Sparkles className="h-4 w-4" />}
			/>
			<MetricCard
				title="Total Cost"
				value={`$${overview.totalCost.toFixed(4)}`}
				icon={<CreditCard className="h-4 w-4" />}
			/>
			<MetricCard
				title="Active API Keys"
				value={overview.activeApiKeysCount}
				icon={<Key className="h-4 w-4" />}
				sub={`${overview.projectsCount} project(s)`}
			/>
			<MetricCard
				title="Members"
				value={overview.membersCount}
				icon={<Users className="h-4 w-4" />}
				sub={`${overview.projectsCount} project(s)`}
			/>
		</div>
	);
}
