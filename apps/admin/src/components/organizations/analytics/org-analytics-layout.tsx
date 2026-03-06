"use client";

import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CustomBadge as Badge } from "@/components/ui/custom-badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrgExportAll } from "@/hooks/use-org-export-all";

import { OrgApiKeysSection } from "./org-api-keys-section";
import { OrgDepositsSection } from "./org-deposits-section";
import { OrgMembersSection } from "./org-members-section";
import { OrgOverviewCards } from "./org-overview-cards";
import { OrgProjectsSection } from "./org-projects-section";
import { OrgUsageSection } from "./org-usage-section";

import type {
	OrgAnalyticsOverview,
	OrgApiKeysResponse,
	OrgDepositsResponse,
	OrgMember,
	OrgProject,
	OrgUsageResponse,
} from "@/lib/types";

type TabKey = "api-keys" | "usage" | "members" | "projects" | "deposits";

interface OrgAnalyticsLayoutProps {
	orgId: string;
	overview: OrgAnalyticsOverview;
	initialApiKeys: OrgApiKeysResponse;
	initialUsage: OrgUsageResponse;
	initialMembers: OrgMember[];
	initialProjects: OrgProject[];
	initialDeposits: OrgDepositsResponse;
}

function statusVariant(status: string | null) {
	if (status === "active") {
		return "success";
	}
	if (status === "deleted") {
		return "error";
	}
	return "warning";
}

export function OrgAnalyticsLayout({
	orgId,
	overview,
	initialApiKeys,
	initialUsage,
	initialMembers,
	initialProjects,
	initialDeposits,
}: OrgAnalyticsLayoutProps) {
	const [activeTab, setActiveTab] = useState<TabKey>("api-keys");
	const { run, loading } = useOrgExportAll(orgId, overview.name);

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-start justify-between">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<Link href="/organizations">
							<Button variant="ghost" size="sm" className="h-7 px-2">
								<ArrowLeft className="h-3.5 w-3.5" />
							</Button>
						</Link>
						<h1 className="text-xl font-semibold">{overview.name}</h1>
						<Badge variant={statusVariant(overview.status)}>
							{overview.status ?? "unknown"}
						</Badge>
						<Badge variant={overview.plan === "pro" ? "purple" : "default"}>
							{overview.plan}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground pl-9">
						{overview.billingEmail ?? overview.id}
					</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" disabled={loading}>
							{loading ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Download className="h-4 w-4 mr-2" />
							)}
							Export All
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => run("xlsx")}>
							Excel (.xlsx)
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => run("csv")}>CSV</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<OrgOverviewCards orgId={orgId} initialData={overview} />

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as TabKey)}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-5 h-11">
					<TabsTrigger value="api-keys" className="cursor-pointer">
						API Keys
					</TabsTrigger>
					<TabsTrigger value="usage" className="cursor-pointer">
						Usage
					</TabsTrigger>
					<TabsTrigger value="members" className="cursor-pointer">
						Members
					</TabsTrigger>
					<TabsTrigger value="projects" className="cursor-pointer">
						Projects
					</TabsTrigger>
					<TabsTrigger value="deposits" className="cursor-pointer">
						Deposits
					</TabsTrigger>
				</TabsList>

				<TabsContent value="api-keys" className="mt-4">
					<OrgApiKeysSection orgId={orgId} initialData={initialApiKeys} />
				</TabsContent>
				<TabsContent value="usage" className="mt-4">
					<OrgUsageSection orgId={orgId} initialData={initialUsage} />
				</TabsContent>
				<TabsContent value="members" className="mt-4">
					<OrgMembersSection orgId={orgId} initialData={initialMembers} />
				</TabsContent>
				<TabsContent value="projects" className="mt-4">
					<OrgProjectsSection orgId={orgId} initialData={initialProjects} />
				</TabsContent>
				<TabsContent value="deposits" className="mt-4">
					<OrgDepositsSection orgId={orgId} initialData={initialDeposits} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
