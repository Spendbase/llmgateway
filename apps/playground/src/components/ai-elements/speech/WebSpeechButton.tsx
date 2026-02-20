"use client";

import { MicIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { InputGroupButton } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

import { appendTranscript } from "./utils";

import type { PromptInputSpeechButtonProps } from "./types";

// Web Speech API is not in TypeScript's lib.dom yet — declare locally
interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
	onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
	onresult:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown)
		| null;
	onerror:
		| ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown)
		| null;
}
interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
	readonly length: number;
	item: (index: number) => SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
	readonly length: number;
	item: (index: number) => SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
	isFinal: boolean;
}
interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
	error: string;
}
declare global {
	interface Window {
		SpeechRecognition: new () => SpeechRecognition;
		webkitSpeechRecognition: new () => SpeechRecognition;
	}
}

export function WebSpeechButton({
	className,
	textareaRef,
	onTranscriptionChange,
	...props
}: PromptInputSpeechButtonProps) {
	const [isListening, setIsListening] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	useEffect(() => {
		const supported =
			typeof window !== "undefined" &&
			("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

		if (!supported) {
			return;
		}

		const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
		const recognition = new Ctor();

		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "en-US";

		recognition.onstart = () => setIsListening(true);
		recognition.onend = () => setIsListening(false);
		recognition.onerror = () => setIsListening(false);

		recognition.onresult = (event) => {
			let transcript = "";

			for (const result of Array.from(event.results)) {
				if (result.isFinal) {
					transcript += result[0].transcript;
				}
			}
			if (transcript) {
				appendTranscript(transcript, textareaRef, onTranscriptionChange);
			}
		};

		recognitionRef.current = recognition;
		setIsReady(true);

		return () => {
			recognitionRef.current?.stop();
			recognitionRef.current = null;
		};
	}, [textareaRef, onTranscriptionChange]);

	const toggleListening = useCallback(() => {
		const recognition = recognitionRef.current;
		if (!recognition) {
			return;
		}
		isListening ? recognition.stop() : recognition.start();
	}, [isListening]);

	return (
		<InputGroupButton
			className={cn(
				"relative transition-all duration-200",
				isListening && "animate-pulse bg-accent text-accent-foreground",
				className,
			)}
			disabled={!isReady}
			onClick={toggleListening}
			size="icon-sm"
			type="button"
			variant="ghost"
			{...props}
		>
			<MicIcon className="size-4" />
		</InputGroupButton>
	);
}
