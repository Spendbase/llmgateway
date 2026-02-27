"use client";

import { Loader2, Volume2, Wand2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/landing/theme-toggle";
import { AuthDialog } from "@/components/playground/auth-dialog";
import { TtsFeedItem } from "@/components/playground/tts-feed-item";
import { TtsSidebar } from "@/components/playground/tts-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEnsurePlaygroundKey } from "@/hooks/useEnsurePlaygroundKey";
import { useTts } from "@/hooks/useTts";
import { useTtsGenerations } from "@/hooks/useTtsGenerations";
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
	const [speed, setSpeed] = useState(1.0);
	const [isSaving, setIsSaving] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const isAuthenticated = !isUserLoading && !!user;

	const { generate, audioUrl, isGenerating, error } = useTts();

	const {
		data: historyData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch: refetchGenerations,
	} = useTtsGenerations();

	const historyEntries = useMemo<TtsFeedEntry[]>(() => {
		if (!historyData) {
			return [];
		}
		return historyData.pages
			.flatMap((page) => page.generations)
			.map((gen) => ({
				id: gen.id,
				text: gen.text,
				audioUrl: `/api/tts-generations/${gen.id}/audio`,
				format: gen.format,
				characterCount: gen.chars,
				createdAt: new Date(gen.createdAt),
				voice: gen.voice,
			}));
	}, [historyData]);

	const isEmpty = historyEntries.length === 0 && !isGenerating && !isSaving;

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

	// Keep a ref so the observer callback always reads the latest value
	// without being recreated on every isFetchingNextPage change.
	const isFetchingNextPageRef = useRef(isFetchingNextPage);
	useEffect(() => {
		isFetchingNextPageRef.current = isFetchingNextPage;
	}, [isFetchingNextPage]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		const container = scrollContainerRef.current;
		if (!sentinel || !container) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasNextPage &&
					!isFetchingNextPageRef.current
				) {
					void fetchNextPage();
				}
			},
			{ root: container, rootMargin: "200px 0px 0px 0px", threshold: 0 },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasNextPage, fetchNextPage]);

	// After generation completes, wait for S3 save then refetch history
	useEffect(() => {
		if (!audioUrl) {
			return;
		}
		setText("");
		setIsSaving(true);
		const timer = setTimeout(() => {
			void refetchGenerations().then(() => setIsSaving(false));
		}, 3000);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [audioUrl]);

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
			speed,
		});
	}, [generate, text, model, voice, format, speed, isOverLimit, maxChars]);

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
					speed={speed}
					onModelChange={setModel}
					onVoiceChange={setVoice}
					onFormatChange={setFormat}
					onSpeedChange={setSpeed}
					disabled={isGenerating}
				/>

				<div className="flex flex-1 flex-col min-h-0 overflow-hidden">
					{/* Header */}
					<div className="shrink-0 border-b px-4 py-3 flex items-center gap-3">
						<SidebarTrigger />

						<div className="flex-1 min-w-0">
							<h1 className="text-sm font-semibold leading-none">
								Text to Speech
							</h1>
							<p className="text-xs text-muted-foreground mt-0.5">
								Convert text into natural-sounding audio
							</p>
						</div>
						<ThemeToggle />
					</div>

					<div
						ref={scrollContainerRef}
						className="flex-1 min-h-0 overflow-y-auto flex flex-col-reverse"
					>
						{isEmpty ? (
							<div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-20">
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
							<>
								{/* DOM first = visual bottom */}
								{(isGenerating || isSaving) && (
									<div className="mx-auto max-w-2xl w-full px-6 pb-6">
										<div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											<span className="text-sm text-muted-foreground">
												{isGenerating ? "Generating audio…" : "Saving…"}
											</span>
										</div>
									</div>
								)}

								{historyEntries.map((entry) => (
									<div
										key={entry.id}
										className="mx-auto max-w-2xl w-full px-6 pb-6"
									>
										<TtsFeedItem item={entry} voice={entry.voice} />
									</div>
								))}

								<div
									ref={sentinelRef}
									className="mx-auto max-w-2xl w-full px-6 py-4 flex justify-center"
								>
									{isFetchingNextPage && (
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									)}
								</div>
							</>
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
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													size="sm"
													onClick={handleGenerate}
													disabled={
														isGenerating ||
														!text.trim() ||
														isOverLimit ||
														!isAuthenticated
													}
													className="gap-1.5 rounded-xl cursor-pointer"
												>
													{isGenerating ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
													) : (
														<Wand2 className="h-3.5 w-3.5" />
													)}
													Generate
												</Button>
											</TooltipTrigger>
											<TooltipContent side="top">
												<p className="flex items-center gap-1">
													<kbd className="font-mono">⌘</kbd>
													<kbd className="font-mono">↵</kbd>
												</p>
											</TooltipContent>
										</Tooltip>
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
