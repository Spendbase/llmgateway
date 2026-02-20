import type { InputGroupButton } from "@/components/ui/input-group";
import type { ComponentProps, RefObject } from "react";

export type PromptInputSpeechButtonProps = ComponentProps<
	typeof InputGroupButton
> & {
	textareaRef?: RefObject<HTMLTextAreaElement | null>;
	onTranscriptionChange?: (text: string) => void;
};
