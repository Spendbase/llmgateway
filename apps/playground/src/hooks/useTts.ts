"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TtsParams {
	model: string;
	input: string;
	voice: string;
	response_format: string;
}

export interface TtsResult {
	audioUrl: string | null;
	audioBlob: Blob | null;
	isGenerating: boolean;
	error: string | null;
	characterCount: number | null;
	generate: (params: TtsParams) => Promise<void>;
	clearAudio: () => void;
}

export function useTts(): TtsResult {
	const [isGenerating, setIsGenerating] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [characterCount, setCharacterCount] = useState<number | null>(null);
	const prevUrlRef = useRef<string | null>(null);

	const revokeCurrentUrl = useCallback(() => {
		if (prevUrlRef.current) {
			URL.revokeObjectURL(prevUrlRef.current);
			prevUrlRef.current = null;
		}
	}, []);

	const clearAudio = useCallback(() => {
		revokeCurrentUrl();
		setAudioUrl(null);
		setAudioBlob(null);
		setError(null);
		setCharacterCount(null);
	}, [revokeCurrentUrl]);

	const generate = useCallback(
		async (params: TtsParams) => {
			setIsGenerating(true);
			setError(null);
			revokeCurrentUrl();
			setAudioUrl(null);
			setAudioBlob(null);
			setCharacterCount(null);

			try {
				const res = await fetch("/api/tts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(params),
				});

				if (!res.ok) {
					let message = `Error ${res.status}`;
					try {
						const errJson = await res.json();
						const raw =
							errJson?.error?.message ??
							(typeof errJson?.error === "string"
								? errJson.error
								: undefined) ??
							errJson?.message;
						if (typeof raw === "string" && raw.length > 0) {
							message = raw;
						}
					} catch {
						// Use status text if JSON parse fails
					}
					throw new Error(message);
				}

				const count = res.headers.get("x-character-count");
				if (count) {
					setCharacterCount(parseInt(count, 10));
				}

				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				prevUrlRef.current = url;
				setAudioBlob(blob);
				setAudioUrl(url);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to generate speech";
				setError(message);
			} finally {
				setIsGenerating(false);
			}
		},
		[revokeCurrentUrl],
	);

	// Cleanup ObjectURL on unmount
	useEffect(() => {
		return () => {
			if (prevUrlRef.current) {
				URL.revokeObjectURL(prevUrlRef.current);
			}
		};
	}, []);

	return {
		audioUrl,
		audioBlob,
		isGenerating,
		error,
		characterCount,
		generate,
		clearAudio,
	};
}
