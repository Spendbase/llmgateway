import type { AudioModelDefinition } from "@/audio-types.js";

/**
 * ElevenLabs TTS models with pricing and capabilities
 * Pricing based on ElevenLabs published rates (as of 2025)
 */
export const elevenlabsAudioModels = [
	{
		id: "eleven_multilingual_v2",
		name: "Eleven Multilingual v2",
		family: "elevenlabs",
		description:
			"Lifelike speech synthesis with consistent quality across 29 languages. Most stable for long-form content.",
		providers: [
			{
				providerId: "elevenlabs" as const,
				modelName: "eleven_multilingual_v2",
				characterPrice: 0.3 / 1000, // $0.30 per 1K characters
				maxCharacters: 10000,
				latencyMs: 400,
				streaming: true,
				languages: 29,
			},
		],
	},
	{
		id: "eleven_turbo_v2_5",
		name: "Eleven Turbo v2.5",
		family: "elevenlabs",
		description:
			"High-quality, low-latency model balancing speed and quality. 50% lower price than higher quality models.",
		providers: [
			{
				providerId: "elevenlabs" as const,
				modelName: "eleven_turbo_v2_5",
				characterPrice: 0.15 / 1000, // $0.15 per 1K characters
				maxCharacters: 40000,
				latencyMs: 250,
				streaming: true,
				languages: 32,
			},
		],
	},
	{
		id: "eleven_flash_v2_5",
		name: "Eleven Flash v2.5",
		family: "elevenlabs",
		description:
			"Fast and affordable model optimized for ultra-low latency (~75ms). Best for real-time applications.",
		providers: [
			{
				providerId: "elevenlabs" as const,
				modelName: "eleven_flash_v2_5",
				characterPrice: 0.15 / 1000, // $0.15 per 1K characters
				maxCharacters: 40000,
				latencyMs: 75,
				streaming: true,
				languages: 32,
			},
		],
	},
	{
		id: "eleven_v3",
		name: "Eleven v3",
		family: "elevenlabs",
		description:
			"Most emotionally rich and expressive model with dramatic delivery. Supports 70+ languages.",
		providers: [
			{
				providerId: "elevenlabs" as const,
				modelName: "eleven_v3",
				characterPrice: 0.3 / 1000, // $0.30 per 1K characters
				maxCharacters: 5000,
				latencyMs: 300,
				streaming: true,
				languages: 70,
			},
		],
	},
] as const satisfies AudioModelDefinition[];
