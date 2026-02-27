"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { TtsSettingsPanel } from "@/components/playground/tts-settings-panel";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";

import { PlaygroundSidebarLayout } from "./playground-sidebar-layout";

import type { ApiModel } from "@/lib/fetch-models";
import type { Organization, Project } from "@/lib/types";

interface TtsSidebarProps {
	organizations: Organization[];
	selectedOrganization: Organization | null;
	projects: Project[];
	selectedProject: Project | null;
	onSelectOrganization: (org: Organization | null) => void;
	onSelectProject: (project: Project | null) => void;
	onOrganizationCreated: (org: Organization) => void;
	onProjectCreated: (project: Project) => void;
	audioModels: ApiModel[];
	model: string;
	voice: string;
	format: string;
	speed: number;
	onModelChange: (value: string) => void;
	onVoiceChange: (value: string) => void;
	onFormatChange: (value: string) => void;
	onSpeedChange: (value: number) => void;
	disabled?: boolean;
}

export function TtsSidebar({
	organizations,
	selectedOrganization,
	projects,
	selectedProject,
	onSelectOrganization,
	onSelectProject,
	onOrganizationCreated,
	onProjectCreated,
	audioModels,
	model,
	voice,
	format,
	speed,
	onModelChange,
	onVoiceChange,
	onFormatChange,
	onSpeedChange,
	disabled = false,
}: TtsSidebarProps) {
	const { isLoading: isUserLoading } = useUser();

	if (isUserLoading) {
		return (
			<Sidebar>
				<SidebarHeader>
					<Link href="/" className="flex items-center gap-2 my-2" prefetch>
						<Logo className="h-10 w-10" />
						<h1 className="text-xl font-semibold">LLM API</h1>
						<Badge>Speech</Badge>
					</Link>
				</SidebarHeader>
				<SidebarContent className="px-2 py-4">
					<div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading…
					</div>
				</SidebarContent>
			</Sidebar>
		);
	}

	return (
		<PlaygroundSidebarLayout
			badge="Speech"
			organizations={organizations}
			selectedOrganization={selectedOrganization}
			onSelectOrganization={onSelectOrganization}
			onOrganizationCreated={onOrganizationCreated}
			projects={projects}
			selectedProject={selectedProject}
			onSelectProject={onSelectProject}
			onProjectCreated={onProjectCreated}
		>
			<div className="py-2">
				<TtsSettingsPanel
					audioModels={audioModels}
					model={model}
					voice={voice}
					format={format}
					speed={speed}
					onModelChange={onModelChange}
					onVoiceChange={onVoiceChange}
					onFormatChange={onFormatChange}
					onSpeedChange={onSpeedChange}
					disabled={disabled}
				/>
			</div>
		</PlaygroundSidebarLayout>
	);
}
