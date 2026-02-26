import { getCache, setCache } from "@llmgateway/cache";
import { logger } from "@llmgateway/logger";
import { elevenlabsVoiceMapping, getVoiceId } from "@llmgateway/models";

const VOICES_CACHE_KEY = "elevenlabs:voices:v1";
const VOICES_CACHE_TTL = 24 * 60 * 60; // 24 hours

const FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah — reliable pre-made voice

interface ElevenLabsVoice {
	voice_id: string;
	name: string;
}

async function fetchVoicesFromApi(apiKey: string): Promise<ElevenLabsVoice[]> {
	try {
		const res = await fetch("https://api.elevenlabs.io/v1/voices", {
			headers: { "xi-api-key": apiKey },
		});
		if (!res.ok) {
			logger.warn("Failed to fetch ElevenLabs voices", { status: res.status });
			return [];
		}
		const data = (await res.json()) as { voices?: ElevenLabsVoice[] };
		return data.voices ?? [];
	} catch (error) {
		logger.error("Error fetching ElevenLabs voices", {
			error: error instanceof Error ? error.message : String(error),
		});
		return [];
	}
}

async function getVoices(
	apiKey: string,
	forceRefresh = false,
): Promise<ElevenLabsVoice[]> {
	if (!forceRefresh) {
		const cached = await getCache(VOICES_CACHE_KEY);
		if (cached) {
			return cached as ElevenLabsVoice[];
		}
	}

	const voices = await fetchVoicesFromApi(apiKey);
	if (voices.length > 0) {
		await setCache(VOICES_CACHE_KEY, voices, VOICES_CACHE_TTL);
	}
	return voices;
}

function findInVoiceList(
	voiceName: string,
	voices: ElevenLabsVoice[],
): string | undefined {
	// Try exact name match (case-insensitive)
	const byName = voices.find(
		(v) => v.name.toLowerCase() === voiceName.toLowerCase(),
	);
	if (byName) {
		return byName.voice_id;
	}

	// Try voice_id direct match
	const byId = voices.find((v) => v.voice_id === voiceName);
	if (byId) {
		return byId.voice_id;
	}

	return undefined;
}

/**
 * Resolves a voice name (OpenAI alias or ElevenLabs name/ID) to an ElevenLabs voice_id.
 * Fast path: static mapping from audio-voices.ts (no network).
 * Slow path (forceRefresh=true): fetch from /v1/voices API with Redis caching.
 */
export async function resolveVoiceId(
	voiceName: string,
	apiKey: string,
	forceRefresh = false,
): Promise<string> {
	if (!forceRefresh) {
		// Fast path: static mapping (OpenAI aliases → known ElevenLabs IDs)
		const staticId = getVoiceId("elevenlabs", voiceName);
		if (staticId) {
			return staticId;
		}
	}

	// Dynamic path: resolve via API (with caching)
	const voices = await getVoices(apiKey, forceRefresh);

	// Try to find by display name in the static mapping
	const staticEntry = elevenlabsVoiceMapping.find(
		(m) => m.openaiName === voiceName,
	);
	if (staticEntry) {
		const match = voices.find(
			(v) =>
				v.name.toLowerCase() === staticEntry.displayName?.toLowerCase() ||
				v.voice_id === staticEntry.voiceId,
		);
		if (match) {
			return match.voice_id;
		}
	}

	// Try direct name/id lookup in voice list
	const direct = findInVoiceList(voiceName, voices);
	if (direct) {
		return direct;
	}

	const fallbackId = voices[0]?.voice_id ?? FALLBACK_VOICE_ID;
	logger.warn("Voice not found in mapping or API, using fallback", {
		voiceName,
		fallback: fallbackId,
	});
	return fallbackId;
}

/**
 * Called when ElevenLabs returns voice_not_found.
 * Invalidates cache and resolves via fresh API fetch.
 */
export async function handleVoiceNotFound(
	voiceName: string,
	apiKey: string,
): Promise<string> {
	logger.warn("voice_not_found — refreshing voice cache", { voiceName });
	return await resolveVoiceId(voiceName, apiKey, true);
}
