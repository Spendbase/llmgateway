/**
 * TypeScript types for audio/TTS providers and models
 */

import type { ProviderId } from "./providers.js";

/**
 * Audio provider mapping for a specific model
 */
export interface AudioProviderMapping {
	providerId: ProviderId;
	modelName: string;
	/**
	 * Price per 1000 characters in USD
	 */
	characterPrice: number;
	/**
	 * Maximum characters per request
	 */
	maxCharacters: number;
	/**
	 * Expected latency in milliseconds
	 */
	latencyMs?: number;
	/**
	 * Whether this model supports streaming audio generation
	 */
	streaming: boolean;
	/**
	 * Supported languages count
	 */
	languages?: number;
}

/**
 * Audio model definition
 */
export interface AudioModelDefinition {
	/**
	 * Unique identifier for the model
	 */
	id: string;
	/**
	 * Human-readable display name for the model
	 */
	name: string;
	/**
	 * Model family (e.g., 'elevenlabs', 'openai')
	 */
	family: string;
	/**
	 * Description of the model
	 */
	description?: string;
	/**
	 * Mappings to provider models
	 */
	providers: AudioProviderMapping[];
}

/**
 * Voice mapping from OpenAI voice names to provider-specific voice IDs
 */
export interface VoiceMapping {
	/**
	 * OpenAI voice name (e.g., 'alloy', 'echo', 'nova')
	 */
	openaiName: string;
	/**
	 * Provider-specific voice ID
	 */
	providerId: string;
	/**
	 * Voice ID for the provider
	 */
	voiceId: string;
	/**
	 * Human-readable voice name
	 */
	displayName?: string;
}

/**
 * Audio response format
 */
export type AudioFormat =
	| "mp3"
	| "opus"
	| "aac"
	| "flac"
	| "wav"
	| "pcm"
	| "mp3_22050_32"
	| "mp3_44100_64"
	| "mp3_44100_128"
	| "pcm_16000"
	| "pcm_24000"
	| "ulaw_8000";

/**
 * Audio speech request (OpenAI-compatible format)
 */
export interface AudioSpeechRequest {
	model: string;
	input: string;
	voice: string;
	response_format?: AudioFormat;
	speed?: number;
}
