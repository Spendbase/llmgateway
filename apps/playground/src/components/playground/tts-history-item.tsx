"use client";

import { format } from "date-fns";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface TtsHistoryItem {
	id: string;
	text: string;
	audioUrl: string;
	format: string;
	characterCount: number | null;
	createdAt: Date;
}

interface TtsHistoryItemProps {
	item: TtsHistoryItem;
	isActive: boolean;
	onSelect: () => void;
}

export function TtsHistoryItem({
	item,
	isActive,
	onSelect,
}: TtsHistoryItemProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}
		const onPlay = () => setIsPlaying(true);
		const onPause = () => setIsPlaying(false);
		const onEnded = () => setIsPlaying(false);
		audio.addEventListener("play", onPlay);
		audio.addEventListener("pause", onPause);
		audio.addEventListener("ended", onEnded);
		return () => {
			audio.removeEventListener("play", onPlay);
			audio.removeEventListener("pause", onPause);
			audio.removeEventListener("ended", onEnded);
		};
	}, []);

	const togglePlay = (e: React.MouseEvent) => {
		e.stopPropagation();
		const audio = audioRef.current;
		if (!audio) {
			return;
		}
		if (audio.paused) {
			audio.play();
		} else {
			audio.pause();
		}
	};

	const charLabel =
		item.characterCount !== null
			? `${item.characterCount} chars`
			: `${item.text.length} chars`;

	return (
		<button
			type="button"
			onClick={onSelect}
			className={`animate-in fade-in slide-in-from-top-1 duration-200 w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/60 ${
				isActive ? "bg-accent" : ""
			}`}
		>
			<audio
				ref={audioRef}
				src={item.audioUrl}
				preload="none"
				className="hidden"
			/>

			<button
				type="button"
				onClick={togglePlay}
				className="mt-0.5 h-6 w-6 shrink-0 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
				aria-label={isPlaying ? "Pause" : "Play"}
			>
				{isPlaying ? (
					<Pause className="h-3 w-3 text-primary" />
				) : (
					<Play className="h-3 w-3 text-primary translate-x-px" />
				)}
			</button>

			<div className="flex-1 min-w-0">
				<p className="text-xs text-foreground leading-snug line-clamp-2 mb-0.5">
					{item.text}
				</p>
				<p className="text-[10px] text-muted-foreground">
					{format(item.createdAt, "HH:mm")} · {charLabel} ·{" "}
					{item.format.toUpperCase()}
				</p>
			</div>
		</button>
	);
}
