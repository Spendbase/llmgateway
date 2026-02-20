"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceRecorderError =
	| "permission-denied"
	| "not-supported"
	| "recording-failed";

// Google STT sync limit is 1 minute; stop slightly before to avoid errors.
export const MAX_RECORDING_SECONDS = 59;

export interface UseVoiceRecorderOptions {
	// Called when recording automatically stops at MAX_RECORDING_SECONDS.
	onMaxDurationReached?: (blob: Blob) => void;
}

export interface UseVoiceRecorderReturn {
	isRecording: boolean;
	duration: number;
	error: VoiceRecorderError | null;
	stream: MediaStream | null;
	startRecording: () => Promise<void>;
	stopRecording: () => Promise<Blob | null>;
	clearError: () => void;
}

// Requests microphone access; throws a typed VoiceRecorderError on failure.
async function requestMicrophoneAccess(): Promise<MediaStream> {
	if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
		throw new Error("not-supported" satisfies VoiceRecorderError);
	}

	try {
		return await navigator.mediaDevices.getUserMedia({ audio: true });
	} catch (err) {
		const isDenied = err instanceof Error && err.name === "NotAllowedError";
		throw new Error(
			(isDenied
				? "permission-denied"
				: "recording-failed") satisfies VoiceRecorderError,
		);
	}
}

// Returns the best supported audio MIME type for recording, or empty string as fallback.
function selectMimeType(): string {
	const candidates = [
		"audio/webm;codecs=opus",
		"audio/webm",
		"audio/ogg;codecs=opus",
	];
	return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

// Creates a MediaRecorder for the given stream with the best available MIME type.
function createMediaRecorder(stream: MediaStream): MediaRecorder {
	const mimeType = selectMimeType();
	if (mimeType) {
		return new MediaRecorder(stream, { mimeType });
	}

	return new MediaRecorder(stream);
}

export function useVoiceRecorder(
	options?: UseVoiceRecorderOptions,
): UseVoiceRecorderReturn {
	const [isRecording, setIsRecording] = useState(false);
	const [duration, setDuration] = useState(0);
	const [error, setError] = useState<VoiceRecorderError | null>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const resolveStopRef = useRef<((blob: Blob | null) => void) | null>(null);

	// Tracks elapsed seconds in a ref so the interval always sees the latest value.
	const durationRef = useRef(0);

	// When true, onstop was triggered by the duration limit, not by the user.
	const isAutoStoppingRef = useRef(false);

	// Holds the latest callback without requiring re-wiring of the recorder.
	const onMaxDurationReachedRef = useRef(options?.onMaxDurationReached);
	useEffect(() => {
		onMaxDurationReachedRef.current = options?.onMaxDurationReached;
	}, [options?.onMaxDurationReached]);

	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const releaseMic = useCallback(() => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		setStream(null);
	}, []);

	// Stop everything when the component unmounts mid-recording.
	// Recorder must be stopped before tracks — otherwise onstop may not fire in some browsers.
	useEffect(() => {
		return () => {
			clearTimer();
			if (mediaRecorderRef.current?.state !== "inactive") {
				mediaRecorderRef.current?.stop();
			}
			streamRef.current?.getTracks().forEach((track) => track.stop());
		};
	}, [clearTimer]);

	const startRecording = useCallback(async () => {
		setError(null);
		setDuration(0);
		durationRef.current = 0;
		chunksRef.current = [];

		let micStream: MediaStream;
		try {
			micStream = await requestMicrophoneAccess();
		} catch (err) {
			setError((err as Error).message as VoiceRecorderError);
			return;
		}

		let recorder: MediaRecorder;
		try {
			recorder = createMediaRecorder(micStream);
		} catch {
			setError("recording-failed");
			micStream.getTracks().forEach((t) => t.stop());
			return;
		}

		streamRef.current = micStream;
		setStream(micStream);
		mediaRecorderRef.current = recorder;

		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) {
				chunksRef.current.push(e.data);
			}
		};

		recorder.onstop = () => {
			const blob = new Blob(chunksRef.current, {
				type: recorder.mimeType || "audio/webm",
			});
			chunksRef.current = [];
			mediaRecorderRef.current = null;

			if (isAutoStoppingRef.current) {
				// Duration limit hit: notify the caller and release the mic.
				isAutoStoppingRef.current = false;
				onMaxDurationReachedRef.current?.(blob);
				releaseMic();
			} else {
				// Manual stop: deliver blob to the awaiting stopRecording() call.
				resolveStopRef.current?.(blob);
				resolveStopRef.current = null;
				releaseMic();
			}
		};

		recorder.onerror = () => {
			setError("recording-failed");
			clearTimer();
			setIsRecording(false);
			chunksRef.current = [];
			mediaRecorderRef.current = null;
			resolveStopRef.current?.(null);
			resolveStopRef.current = null;
			// Release mic so the browser stops showing the active microphone indicator.
			releaseMic();
		};

		recorder.start(250);
		setIsRecording(true);

		timerRef.current = setInterval(() => {
			durationRef.current += 1;
			setDuration(durationRef.current);

			if (durationRef.current >= MAX_RECORDING_SECONDS) {
				// Auto-stop: set flag before calling stop() so onstop knows the reason.
				isAutoStoppingRef.current = true;
				clearTimer();
				setIsRecording(false);
				setDuration(0);
				durationRef.current = 0;
				mediaRecorderRef.current?.stop();
			}
		}, 1000);
	}, [clearTimer, releaseMic]);

	const stopRecording = useCallback((): Promise<Blob | null> => {
		return new Promise((resolve) => {
			const recorder = mediaRecorderRef.current;
			if (!recorder || recorder.state === "inactive") {
				resolve(null);
				return;
			}

			// Cancel any in-flight auto-stop so onstop treats this as a manual stop.
			isAutoStoppingRef.current = false;

			resolveStopRef.current = resolve;
			clearTimer();
			setIsRecording(false);
			setDuration(0);
			durationRef.current = 0;
			recorder.stop();
		});
	}, [clearTimer]);

	const clearError = useCallback(() => setError(null), []);

	return {
		isRecording,
		duration,
		error,
		stream,
		startRecording,
		stopRecording,
		clearError,
	};
}
