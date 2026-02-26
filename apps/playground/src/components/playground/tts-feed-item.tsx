"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { TtsAudioPlayer } from "@/components/playground/tts-audio-player";

import type { TtsHistoryItem } from "@/components/playground/tts-history-item";

interface TtsFeedItemProps {
	item: TtsHistoryItem;
	voice: string;
}

export function TtsFeedItem({ item, voice }: TtsFeedItemProps) {
	const [showText, setShowText] = useState(false);

	return (
		<div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border bg-card p-4 space-y-3">
			{/* Meta row */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<span>{format(item.createdAt, "HH:mm")}</span>
					<span className="opacity-40">·</span>
					<span className="capitalize">{voice}</span>
					<span className="opacity-40">·</span>
					<span className="uppercase">{item.format}</span>
				</div>
				<button
					type="button"
					onClick={() => setShowText((v) => !v)}
					className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
				>
					{showText ? (
						<>
							<ChevronUp className="h-3.5 w-3.5" />
							Hide text
						</>
					) : (
						<>
							<ChevronDown className="h-3.5 w-3.5" />
							Show text
						</>
					)}
				</button>
			</div>

			{/* Text transcript */}
			{showText && (
				<div className="animate-in fade-in duration-150 rounded-lg bg-muted/50 px-3 py-2.5">
					<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
						{item.text}
					</p>
				</div>
			)}

			{/* Audio player */}
			<TtsAudioPlayer
				audioUrl={item.audioUrl}
				audioBlob={item.audioBlob}
				format={item.format}
				characterCount={item.characterCount}
			/>
		</div>
	);
}
