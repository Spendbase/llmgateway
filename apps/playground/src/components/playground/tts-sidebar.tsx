"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";

import { TtsSettingsPanel } from "@/components/playground/tts-settings-panel";
import { clearLastUsedProjectCookiesAction } from "@/lib/actions/project";
import { useAuth } from "@/lib/auth-client";

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
	const queryClient = useQueryClient();
	const router = useRouter();
	const posthog = usePostHog();
	const { signOut } = useAuth();

	const logout = async () => {
		posthog.reset();
		try {
			await clearLastUsedProjectCookiesAction();
		} catch (error) {
			console.error("Failed to clear last used project cookies:", error);
			toast.error("Failed to clear last used project cookies");
		}
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					queryClient.clear();
					router.push(
						process.env.NODE_ENV === "development"
							? "http://localhost:3003/login"
							: "https://chat.llmapi.ai/login",
					);
				},
			},
		});
	};

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
			onLogout={logout}
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
