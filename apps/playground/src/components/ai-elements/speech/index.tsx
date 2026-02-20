"use client";

import { useAppConfig } from "@/lib/config";

import { GoogleSpeechButton } from "./GoogleSpeechButton";
import { WebSpeechButton } from "./WebSpeechButton";

import type { PromptInputSpeechButtonProps } from "./types";

export type { PromptInputSpeechButtonProps };

export function PromptInputSpeechButton({
	className,
	textareaRef,
	onTranscriptionChange,
	...props
}: PromptInputSpeechButtonProps) {
	const config = useAppConfig();

	if (config.googleSpeechEnabled) {
		return (
			<GoogleSpeechButton
				apiUrl={config.apiUrl}
				className={className}
				onTranscriptionChange={onTranscriptionChange}
				textareaRef={textareaRef}
				{...props}
			/>
		);
	}

	return (
		<WebSpeechButton
			className={className}
			onTranscriptionChange={onTranscriptionChange}
			textareaRef={textareaRef}
			{...props}
		/>
	);
}
