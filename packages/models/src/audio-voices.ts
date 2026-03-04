import type { VoiceMapping } from "./audio-types.js";

/**
 * Voice mappings from OpenAI voice names to provider-specific voice IDs
 * This allows OpenAI-compatible API calls while using different TTS providers
 */

/**
 * ElevenLabs voice mappings
 * Maps OpenAI voice names to ElevenLabs pre-made voices
 */
export const elevenlabsVoiceMapping: VoiceMapping[] = [
	{
		openaiName: "alloy",
		providerId: "elevenlabs",
		voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - mature, reassuring, confident
		displayName: "Sarah",
	},
	{
		openaiName: "echo",
		providerId: "elevenlabs",
		voiceId: "JBFqnCBsd6RMkjVDRZzb", // George - warm, captivating storyteller
		displayName: "George",
	},
	{
		openaiName: "fable",
		providerId: "elevenlabs",
		voiceId: "IKne3meq5aSn9XLyUdCD", // Charlie - deep, confident, energetic
		displayName: "Charlie",
	},
	{
		openaiName: "onyx",
		providerId: "elevenlabs",
		voiceId: "pNInz6obpgDQGcFmaJgB", // Adam - dominant, firm
		displayName: "Adam",
	},
	{
		openaiName: "nova",
		providerId: "elevenlabs",
		voiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura - enthusiast, quirky attitude
		displayName: "Laura",
	},
	{
		openaiName: "shimmer",
		providerId: "elevenlabs",
		voiceId: "XrExE9yKIg1WjnnlVkGX", // Matilda - knowledgable, professional
		displayName: "Matilda",
	},
];

/**
 * Get voice ID for a provider based on OpenAI voice name
 * If the voice name is already a provider-specific ID, return it as-is
 */
export function getVoiceId(
	providerId: string,
	voiceName: string,
): string | null {
	// Check if this is an OpenAI voice name that needs mapping
	const mapping = elevenlabsVoiceMapping.find(
		(m) => m.openaiName === voiceName && m.providerId === providerId,
	);

	if (mapping) {
		return mapping.voiceId;
	}

	// If not found in mappings, assume it's a direct provider voice ID
	// This allows users to use ElevenLabs voice IDs directly
	return voiceName;
}

/**
 * Get all voice mappings for a provider
 */
export function getProviderVoiceMappings(
	providerId: string,
): VoiceMapping[] | null {
	if (providerId === "elevenlabs") {
		return elevenlabsVoiceMapping;
	}

	return null;
}
