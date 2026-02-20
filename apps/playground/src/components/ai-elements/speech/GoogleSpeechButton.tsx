"use client";

import { Loader2Icon, MicIcon, StopCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { InputGroupButton } from "@/components/ui/input-group";
import { useTranscription } from "@/hooks/useTranscription";
import {
	MAX_RECORDING_SECONDS,
	useVoiceRecorder,
} from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

import { AudioWaveform } from "./AudioWaveform";
import { appendTranscript, formatDuration } from "./utils";

import type { PromptInputSpeechButtonProps } from "./types";

const RECORDING_ERROR_MESSAGES: Record<string, string> = {
	"permission-denied":
		"Microphone access denied. Allow microphone access in your browser settings.",
	"not-supported": "Voice recording is not supported in your browser.",
	"recording-failed": "Failed to start recording. Please try again.",
};

// How many seconds before the limit the timer turns red.
const WARN_THRESHOLD_SECONDS = 10;

export type GoogleSpeechButtonProps = PromptInputSpeechButtonProps & {
	apiUrl: string;
};

export function GoogleSpeechButton({
	className,
	textareaRef,
	onTranscriptionChange,
	apiUrl,
	...props
}: GoogleSpeechButtonProps) {
	const [isFinalizing, setIsFinalizing] = useState(false);

	const { transcribe } = useTranscription(apiUrl);

	const handleTranscribe = useCallback(
		async (blob: Blob) => {
			setIsFinalizing(true);
			try {
				const text = await transcribe(blob);
				if (text) {
					appendTranscript(text, textareaRef, onTranscriptionChange);
				} else {
					toast.error("No speech detected. Please try again.");
				}
			} catch (err) {
				toast.error(
					err instanceof Error
						? err.message
						: "Transcription failed. Please try again.",
				);
			} finally {
				setIsFinalizing(false);
			}
		},
		[transcribe, textareaRef, onTranscriptionChange],
	);

	const handleMaxDurationReached = useCallback(
		(blob: Blob) => {
			toast.info("Maximum recording duration is 1 minute.");
			void handleTranscribe(blob);
		},
		[handleTranscribe],
	);

	const {
		isRecording,
		duration,
		error,
		stream,
		startRecording,
		stopRecording,
		clearError,
	} = useVoiceRecorder({ onMaxDurationReached: handleMaxDurationReached });

	useEffect(() => {
		if (!error) {
			return;
		}
		toast.error(
			RECORDING_ERROR_MESSAGES[error] ?? "An unexpected error occurred.",
		);
		clearError();
	}, [error, clearError]);

	const handleClick = useCallback(async () => {
		if (isFinalizing) {
			return;
		}

		if (!isRecording) {
			await startRecording();
			return;
		}

		const blob = await stopRecording();
		if (!blob || blob.size === 0) {
			return;
		}

		void handleTranscribe(blob);
	}, [
		isFinalizing,
		isRecording,
		startRecording,
		stopRecording,
		handleTranscribe,
	]);

	const isWarning =
		isRecording && duration >= MAX_RECORDING_SECONDS - WARN_THRESHOLD_SECONDS;

	return (
		<div className="flex min-w-0 items-center gap-1.5">
			<div
				className={cn(
					"flex min-w-0 items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out",
					isRecording
						? "max-w-[200px] opacity-100"
						: "pointer-events-none max-w-0 opacity-0",
				)}
			>
				{/* Waveform: only on sm+ screens */}
				<span className="hidden min-w-0 sm:flex">
					<AudioWaveform stream={stream} />
				</span>

				<span
					className={cn(
						"size-2 shrink-0 rounded-full sm:hidden",
						isWarning ? "bg-orange-500" : "bg-red-500",
						isRecording && "animate-pulse",
					)}
				/>

				<span
					className={cn(
						"shrink-0 text-[11px] tabular-nums transition-colors duration-300",
						isWarning ? "font-medium text-red-500" : "text-muted-foreground",
					)}
				>
					{formatDuration(duration)}
				</span>
			</div>
			<InputGroupButton
				className={cn(
					"relative shrink-0 transition-all duration-300",
					isRecording && "text-red-500 hover:text-red-600",
					className,
				)}
				disabled={isFinalizing}
				onClick={handleClick}
				size="icon-sm"
				type="button"
				variant="ghost"
				{...props}
			>
				{isFinalizing ? (
					<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
				) : isRecording ? (
					<StopCircleIcon className="size-4" />
				) : (
					<MicIcon className="size-4" />
				)}
			</InputGroupButton>
		</div>
	);
}
