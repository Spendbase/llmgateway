"use client";

import { Download, Loader2, Pause, Play } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { formatTime } from "@/lib/format";

interface TtsAudioPlayerProps {
	audioUrl: string;
	format: string;
	characterCount: number | null;
}

export function TtsAudioPlayer({
	audioUrl,
	format,
	characterCount,
}: TtsAudioPlayerProps) {
	const {
		audioRef,
		trackRef,
		isPlaying,
		currentTime,
		duration,
		progress,
		togglePlayPause,
		handleTrackMouseDown,
	} = useAudioPlayer(audioUrl);

	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = useCallback(async () => {
		if (isDownloading) {
			return;
		}
		setIsDownloading(true);
		try {
			const ext = format.startsWith("mp3") ? "mp3" : format.split("_")[0];
			const filename = `speech.${ext}`;
			const downloadUrl = audioUrl.includes("?")
				? `${audioUrl}&download=true`
				: `${audioUrl}?download=true`;
			const res = await fetch(downloadUrl);
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setIsDownloading(false);
		}
	}, [audioUrl, format, isDownloading]);

	return (
		<div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border bg-card p-4 space-y-3">
			<audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />

			{/* Controls */}
			<div className="flex items-center gap-3">
				<Button
					size="icon"
					variant="default"
					className="h-10 w-10 shrink-0 rounded-full shadow-sm cursor-pointer"
					onClick={togglePlayPause}
					aria-label={isPlaying ? "Pause" : "Play"}
				>
					{isPlaying ? (
						<Pause className="h-4 w-4" />
					) : (
						<Play className="h-4 w-4 translate-x-px" />
					)}
				</Button>

				<div className="flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground shrink-0 w-24">
					<span
						className={currentTime > 0 ? "text-foreground font-medium" : ""}
					>
						{formatTime(currentTime)}
					</span>
					<span>/</span>
					<span>{formatTime(duration)}</span>
				</div>

				<div className="flex-1" />

				<Button
					size="icon"
					variant="ghost"
					className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
					onClick={handleDownload}
					disabled={isDownloading}
					title="Download"
				>
					{isDownloading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Download className="h-4 w-4" />
					)}
				</Button>
			</div>

			{/* Progress track */}
			<div
				ref={trackRef}
				className="relative h-2 rounded-full bg-muted cursor-pointer group"
				onMouseDown={handleTrackMouseDown}
			>
				<div
					className="absolute inset-y-0 left-0 rounded-full bg-primary"
					style={{ width: `${progress}%` }}
				/>
				{/* Thumb — inset-y-0 + my-auto = reliable vertical centering */}
				<div
					className="absolute inset-y-0 my-auto h-3.5 w-3.5 rounded-full bg-primary shadow-md border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity duration-150"
					style={{ left: `calc(${progress}% - 7px)` }}
				/>
			</div>

			{/* Metadata */}
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<span className="uppercase font-semibold tracking-wide text-foreground/60">
					{format.split("_")[0]}
				</span>
				{characterCount !== null && (
					<>
						<span className="opacity-40">·</span>
						<span>{characterCount.toLocaleString()} chars</span>
					</>
				)}
			</div>
		</div>
	);
}
