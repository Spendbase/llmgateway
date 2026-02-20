"use client";

import { useCallback, useState } from "react";

export interface UseTranscriptionReturn {
	isTranscribing: boolean;
	transcribe: (blob: Blob) => Promise<string | null>;
}

// Sends audio to the backend transcription endpoint and returns the recognized text.
export function useTranscription(apiUrl: string): UseTranscriptionReturn {
	const [isTranscribing, setIsTranscribing] = useState(false);

	// Core fetch — pure API call, no state side-effects
	const transcribe = useCallback(
		async (blob: Blob): Promise<string | null> => {
			const formData = new FormData();
			formData.append("file", blob, "recording.webm");
			formData.append("language", navigator.language);

			const response = await fetch(`${apiUrl}/audio/transcriptions`, {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			if (!response.ok) {
				const body = (await response.json()) as { error?: string };
				throw new Error(body.error ?? "Transcription failed");
			}

			const body = (await response.json()) as { text: string };
			return body.text || null;
		},
		[apiUrl],
	);

	// Wraps the core fetch with isTranscribing flag; finally ensures it always resets
	const transcribeWithState = useCallback(
		async (blob: Blob): Promise<string | null> => {
			setIsTranscribing(true);
			try {
				return await transcribe(blob);
			} finally {
				setIsTranscribing(false);
			}
		},
		[transcribe],
	);

	return { isTranscribing, transcribe: transcribeWithState };
}
