"use client";

import { useEffect, useRef } from "react";

export const WAVEFORM_BAR_COUNT = 28;

const MIN_BAR_HEIGHT_PCT = 8;
const AMPLITUDE_SCALE = 120;

// Connects a media stream to an AnalyserNode and returns both for use in the animation loop.
function createAnalyser(stream: MediaStream): {
	audioCtx: AudioContext;
	analyser: AnalyserNode;
} {
	const audioCtx = new AudioContext();

	// Safari creates AudioContext in "suspended" state — needs explicit resume
	if (audioCtx.state === "suspended") {
		audioCtx.resume().catch(() => {});
	}

	const analyser = audioCtx.createAnalyser();
	analyser.fftSize = 1024;
	analyser.smoothingTimeConstant = 0.8;
	audioCtx.createMediaStreamSource(stream).connect(analyser);

	return { audioCtx, analyser };
}

// Calculates RMS amplitude for a slice of time-domain audio data (0 = silence, 1 = max).
function computeSegmentRms(
	data: Uint8Array,
	offset: number,
	size: number,
): number {
	let sum = 0;
	for (let i = offset; i < offset + size; i++) {
		const normalized = (data[i] - 128) / 128;
		sum += normalized * normalized;
	}
	return Math.sqrt(sum / size);
}

// Converts a 0–1 amplitude value to a CSS height string, with a minimum so bars never disappear.
function amplitudeToBarHeight(amplitude: number): string {
	const pct = Math.max(
		MIN_BAR_HEIGHT_PCT,
		Math.round(amplitude * AMPLITUDE_SCALE),
	);
	return `${pct}%`;
}

// Drives a waveform bar visualizer from a live microphone stream.
// Returns a ref to attach to the container div that holds `[data-bar]` elements.
export function useAudioWaveform(stream: MediaStream | null) {
	const containerRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !stream) {
			return;
		}

		const { audioCtx, analyser } = createAnalyser(stream);

		const dataArray = new Uint8Array(analyser.fftSize);
		const bars = Array.from(
			container.querySelectorAll<HTMLElement>("[data-bar]"),
		);
		const segmentSize = Math.floor(dataArray.length / WAVEFORM_BAR_COUNT);

		// Runs every frame (~60fps): reads fresh audio data and updates bar heights directly in the DOM
		const tick = () => {
			rafRef.current = requestAnimationFrame(tick);
			analyser.getByteTimeDomainData(dataArray);

			bars.forEach((bar, i) => {
				const amplitude = computeSegmentRms(
					dataArray,
					i * segmentSize,
					segmentSize,
				);
				bar.style.height = amplitudeToBarHeight(amplitude);
			});
		};

		tick();

		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			audioCtx.close().catch(() => {});
		};
	}, [stream]);

	return containerRef;
}
