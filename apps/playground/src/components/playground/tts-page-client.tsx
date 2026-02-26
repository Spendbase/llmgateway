"use client";

import { Loader2, Volume2, Wand2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AuthDialog } from "@/components/playground/auth-dialog";
import { TtsFeedItem } from "@/components/playground/tts-feed-item";
import { TtsSidebar } from "@/components/playground/tts-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useEnsurePlaygroundKey } from "@/hooks/useEnsurePlaygroundKey";
import { useTts } from "@/hooks/useTts";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

import type { TtsHistoryItem } from "@/components/playground/tts-history-item";
import type { ApiModel } from "@/lib/fetch-models";
import type { Organization, Project } from "@/lib/types";

const DEFAULT_VOICE = "alloy";
const DEFAULT_FORMAT = "mp3";

function buildTtsUrl(params: { orgId?: string; projectId?: string }) {
	const p = new URLSearchParams();
	if (params.orgId) {
		p.set("orgId", params.orgId);
	}
	if (params.projectId) {
		p.set("projectId", params.projectId);
	}
	return `/tts?${p.toString()}`;
}

interface TtsPageClientProps {
	organizations: Organization[];
	selectedOrganization: Organization | null;
	projects: Project[];
	selectedProject: Project | null;
	audioModels: ApiModel[];
}

interface TtsFeedEntry extends TtsHistoryItem {
	voice: string;
}

export default function TtsPageClient({
	organizations,
	selectedOrganization,
	projects,
	selectedProject,
	audioModels,
}: TtsPageClientProps) {
	const { user, isLoading: isUserLoading } = useUser();
	const router = useRouter();
	const pathname = usePathname();

	const [text, setText] = useState("");
	const [model, setModel] = useState(audioModels[0]?.id ?? "");
	const [voice, setVoice] = useState(DEFAULT_VOICE);
	const [format, setFormat] = useState(DEFAULT_FORMAT);
	const [feed, setFeed] = useState<TtsFeedEntry[]>([]);

	const feedEndRef = useRef<HTMLDivElement>(null);

	const isAuthenticated = !isUserLoading && !!user;

	const { generate, audioUrl, audioBlob, isGenerating, error, characterCount } =
		useTts();

	useEnsurePlaygroundKey({
		isAuthenticated,
		selectedOrganization,
		selectedProject,
	});

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	// Append new generation to feed and auto-scroll
	useEffect(() => {
		if (!audioUrl || !audioBlob) {
			return;
		}
		const entry: TtsFeedEntry = {
			id: crypto.randomUUID(),
			text,
			audioUrl,
			audioBlob,
			format,
			characterCount,
			createdAt: new Date(),
			voice,
		};
		setFeed((prev) => [...prev, entry].slice(-50));
		setText("");
		// Intentionally excludes reactive state — snapshot at generation time.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [audioUrl, audioBlob]);

	// Scroll to bottom when feed updates
	useEffect(() => {
		feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [feed]);

	// Character limit
	const selectedAudioModel = audioModels.find((m) => m.id === model);
	const maxChars =
		selectedAudioModel?.mappings[0]?.audioConfig?.maxCharacters ?? 10000;
	const charCount = text.length;
	const isOverLimit = charCount > maxChars;
	const charProgress = Math.min(charCount / maxChars, 1);
	const charBarColor =
		charProgress > 0.9
			? "bg-destructive"
			: charProgress > 0.75
				? "bg-amber-500"
				: "bg-primary";

	const handleGenerate = useCallback(async () => {
		if (!text.trim()) {
			toast.error("Please enter some text to convert to speech.");
			return;
		}
		if (isOverLimit) {
			toast.error(
				`Text is too long. Maximum ${maxChars.toLocaleString()} characters.`,
			);
			return;
		}
		await generate({
			model,
			input: text,
			voice,
			response_format: format,
		});
	}, [generate, text, model, voice, format, isOverLimit, maxChars]);

	// ⌘+Enter shortcut
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (
				(e.metaKey || e.ctrlKey) &&
				e.key === "Enter" &&
				!isGenerating &&
				text.trim() &&
				!isOverLimit &&
				isAuthenticated
			) {
				e.preventDefault();
				handleGenerate();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handleGenerate, isGenerating, text, isOverLimit, isAuthenticated]);

	// Navigation handlers
	const handleSelectOrganization = (org: Organization | null) => {
		router.push(buildTtsUrl({ orgId: org?.id }));
		router.refresh();
	};
	const handleOrganizationCreated = (org: Organization) => {
		router.push(buildTtsUrl({ orgId: org.id }));
		router.refresh();
	};
	const handleSelectProject = (project: Project | null) => {
		if (!project) {
			return;
		}
		router.push(
			buildTtsUrl({ orgId: project.organizationId, projectId: project.id }),
		);
		router.refresh();
	};
	const handleProjectCreated = (project: Project) => {
		router.push(
			buildTtsUrl({ orgId: project.organizationId, projectId: project.id }),
		);
		router.refresh();
	};

	return (
		<SidebarProvider>
			<div className="flex h-svh bg-background w-full overflow-hidden">
				<TtsSidebar
					organizations={organizations}
					selectedOrganization={selectedOrganization}
					projects={projects}
					selectedProject={selectedProject}
					onSelectOrganization={handleSelectOrganization}
					onSelectProject={handleSelectProject}
					onOrganizationCreated={handleOrganizationCreated}
					onProjectCreated={handleProjectCreated}
					audioModels={audioModels}
					model={model}
					voice={voice}
					format={format}
					onModelChange={setModel}
					onVoiceChange={setVoice}
					onFormatChange={setFormat}
					disabled={isGenerating}
				/>

				<div className="flex flex-1 flex-col min-h-0 overflow-hidden">
					{/* Header */}
					<div className="shrink-0 border-b px-6 py-3 flex items-center gap-3">
						<div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
							<Volume2 className="h-4 w-4 text-primary" />
						</div>
						<div>
							<h1 className="text-sm font-semibold leading-none">
								Text to Speech
							</h1>
							<p className="text-xs text-muted-foreground mt-0.5">
								Convert text into natural-sounding audio
							</p>
						</div>
					</div>

					{/* Feed */}
					<div className="flex-1 min-h-0 overflow-y-auto">
						{feed.length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
								<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
									<Volume2 className="h-6 w-6 text-primary/60" />
								</div>
								<div>
									<p className="text-sm font-medium text-foreground">
										No generations yet
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Type something below and hit Generate
									</p>
								</div>
							</div>
						) : (
							<div className="mx-auto max-w-2xl px-6 py-6 space-y-6">
								{feed.map((entry) => (
									<TtsFeedItem
										key={entry.id}
										item={entry}
										voice={entry.voice}
									/>
								))}
								{/* Loading indicator */}
								{isGenerating && (
									<div className="flex justify-start">
										<div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											<span className="text-sm text-muted-foreground">
												Generating audio…
											</span>
										</div>
									</div>
								)}
								<div ref={feedEndRef} />
							</div>
						)}
					</div>

					{/* Input area */}
					<div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
						<div className="mx-auto max-w-2xl px-4 py-3">
							<div
								className={cn(
									"rounded-2xl border bg-background shadow-sm transition-shadow",
									"focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
									isGenerating && "opacity-80",
								)}
							>
								<Textarea
									value={text}
									onChange={(e) => setText(e.target.value)}
									placeholder="Enter the text you want to convert to speech…"
									className="min-h-[80px] max-h-[200px] resize-none border-0 rounded-none rounded-t-2xl focus-visible:ring-0 text-sm leading-relaxed shadow-none bg-transparent px-4 pt-3 pb-1"
									disabled={isGenerating}
								/>
								<div className="flex items-center justify-between px-3 py-2">
									<div className="flex items-center gap-2">
										<span
											className={cn(
												"text-xs tabular-nums",
												isOverLimit
													? "text-destructive font-medium"
													: "text-muted-foreground",
											)}
										>
											{charCount.toLocaleString()}/{maxChars.toLocaleString()}
										</span>
										{/* char progress bar */}
										<div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
											<div
												className={cn(
													"h-full rounded-full transition-all duration-300",
													charBarColor,
												)}
												style={{ width: `${charProgress * 100}%` }}
											/>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
											<span className="text-xs">⌘</span>
											<span>↵</span>
										</kbd>
										<Button
											size="sm"
											onClick={handleGenerate}
											disabled={
												isGenerating ||
												!text.trim() ||
												isOverLimit ||
												!isAuthenticated
											}
											className="gap-1.5 rounded-xl"
										>
											{isGenerating ? (
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
											) : (
												<Wand2 className="h-3.5 w-3.5" />
											)}
											Generate
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<AuthDialog open={!isUserLoading && !user} returnUrl={pathname} />
		</SidebarProvider>
	);
}
