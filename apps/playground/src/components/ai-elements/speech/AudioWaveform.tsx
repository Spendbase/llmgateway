"use client";

import { WAVEFORM_BAR_COUNT, useAudioWaveform } from "@/hooks/useAudioWaveform";

interface AudioWaveformProps {
	stream: MediaStream | null;
}

export function AudioWaveform({ stream }: AudioWaveformProps) {
	const containerRef = useAudioWaveform(stream);

	return (
		<div
			ref={containerRef}
			className="flex h-[26px] min-w-0 flex-1 items-center gap-[2.5px] overflow-hidden"
		>
			{Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => (
				<div
					key={i}
					data-bar=""
					className="w-[2px] shrink-0 rounded-full bg-foreground/75"
					style={{ height: "8%", transition: "height 75ms ease-out" }}
				/>
			))}
		</div>
	);
}
