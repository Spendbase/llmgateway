"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Module-level singleton: tracks the currently playing audio element.
// When a new player starts, the previous one is paused automatically.
let activeAudio: HTMLAudioElement | null = null;

export interface UseAudioPlayerReturn {
	audioRef: React.RefObject<HTMLAudioElement | null>;
	trackRef: React.RefObject<HTMLDivElement | null>;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	progress: number;
	togglePlayPause: () => void;
	handleTrackMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function useAudioPlayer(audioUrl: string): UseAudioPlayerReturn {
	const audioRef = useRef<HTMLAudioElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number | undefined>(undefined);
	const isDraggingRef = useRef(false);

	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const stopRaf = useCallback(() => {
		if (rafRef.current !== undefined) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = undefined;
		}
	}, []);

	const startRaf = useCallback(() => {
		stopRaf();
		const tick = () => {
			const audio = audioRef.current;
			if (audio && !isDraggingRef.current) {
				setCurrentTime(audio.currentTime);
			}
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
	}, [stopRaf]);

	// Reset when URL changes
	useEffect(() => {
		setCurrentTime(0);
		setDuration(0);
		setIsPlaying(false);
		stopRaf();
		audioRef.current?.load();
	}, [audioUrl, stopRaf]);

	// Wire up audio events
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}

		const onPlay = () => {
			// Pause any other player that's currently active
			if (activeAudio && activeAudio !== audio) {
				activeAudio.pause();
			}
			activeAudio = audio;
			setIsPlaying(true);
			startRaf();
		};
		const onPause = () => {
			if (activeAudio === audio) {
				activeAudio = null;
			}
			setIsPlaying(false);
			stopRaf();
		};
		const onEnded = () => {
			if (activeAudio === audio) {
				activeAudio = null;
			}
			setIsPlaying(false);
			stopRaf();
		};
		const onDurationChange = () => setDuration(audio.duration);

		audio.addEventListener("play", onPlay);
		audio.addEventListener("pause", onPause);
		audio.addEventListener("ended", onEnded);
		audio.addEventListener("durationchange", onDurationChange);

		return () => {
			audio.removeEventListener("play", onPlay);
			audio.removeEventListener("pause", onPause);
			audio.removeEventListener("ended", onEnded);
			audio.removeEventListener("durationchange", onDurationChange);
			stopRaf();
		};
	}, [startRaf, stopRaf]);

	const togglePlayPause = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) {
			return;
		}
		if (audio.paused) {
			audio.play();
		} else {
			audio.pause();
		}
	}, []);

	const seekToClientX = useCallback(
		(clientX: number) => {
			const track = trackRef.current;
			const audio = audioRef.current;
			if (!track || !audio || !duration) {
				return;
			}
			const rect = track.getBoundingClientRect();
			const ratio = Math.max(
				0,
				Math.min(1, (clientX - rect.left) / rect.width),
			);
			const newTime = ratio * duration;
			audio.currentTime = newTime;
			setCurrentTime(newTime);
		},
		[duration],
	);

	const handleTrackMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			isDraggingRef.current = true;
			seekToClientX(e.clientX);

			const onMouseMove = (ev: MouseEvent) => seekToClientX(ev.clientX);
			const onMouseUp = () => {
				isDraggingRef.current = false;
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
			};
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		},
		[seekToClientX],
	);

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	return {
		audioRef,
		trackRef,
		isPlaying,
		currentTime,
		duration,
		progress,
		togglePlayPause,
		handleTrackMouseDown,
	};
}
