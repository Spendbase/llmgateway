import { elevenlabsAudioModels } from "./audio-models/elevenlabs.js";

import type { AudioModelDefinition } from "./audio-types.js";

/**
 * Registry of all audio/TTS models across providers
 */
export const audioModels = [
	...elevenlabsAudioModels,
] as const satisfies AudioModelDefinition[];

/**
 * Get an audio model by ID
 */
export function getAudioModel(
	modelId: string,
): AudioModelDefinition | undefined {
	return audioModels.find((m) => m.id === modelId);
}

/**
 * Get all audio models for a specific provider
 */
export function getAudioModelsByProvider(
	providerId: string,
): AudioModelDefinition[] {
	return audioModels.filter((m) =>
		m.providers.some((p) => p.providerId === providerId),
	);
}
