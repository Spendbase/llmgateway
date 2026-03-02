/**
 * Maps OpenAI/generic audio format names to ElevenLabs-specific output_format values.
 * ElevenLabs requires explicit bitrate/sample-rate variants (e.g. "mp3_44100_128"),
 * not generic names like "mp3".
 */
const FORMAT_MAP: Record<string, string> = {
	mp3: "mp3_44100_128",
	opus: "opus_48000_128",
	aac: "mp3_44100_128",
	wav: "wav_44100",
	pcm: "pcm_24000",
	mp3_22050_32: "mp3_22050_32",
	mp3_44100_64: "mp3_44100_64",
	mp3_44100_128: "mp3_44100_128",
	pcm_16000: "pcm_16000",
	pcm_24000: "pcm_24000",
	ulaw_8000: "ulaw_8000",
};

const CONTENT_TYPE_MAP: Record<string, string> = {
	mp3_22050_32: "audio/mpeg",
	mp3_24000_48: "audio/mpeg",
	mp3_44100_32: "audio/mpeg",
	mp3_44100_64: "audio/mpeg",
	mp3_44100_96: "audio/mpeg",
	mp3_44100_128: "audio/mpeg",
	mp3_44100_192: "audio/mpeg",
	opus_48000_32: "audio/opus",
	opus_48000_64: "audio/opus",
	opus_48000_96: "audio/opus",
	opus_48000_128: "audio/opus",
	opus_48000_192: "audio/opus",
	wav_8000: "audio/wav",
	wav_16000: "audio/wav",
	wav_22050: "audio/wav",
	wav_24000: "audio/wav",
	wav_32000: "audio/wav",
	wav_44100: "audio/wav",
	wav_48000: "audio/wav",
	pcm_8000: "audio/pcm",
	pcm_16000: "audio/pcm",
	pcm_22050: "audio/pcm",
	pcm_24000: "audio/pcm",
	pcm_32000: "audio/pcm",
	pcm_44100: "audio/pcm",
	pcm_48000: "audio/pcm",
	ulaw_8000: "audio/basic",
	alaw_8000: "audio/basic",
};

const DEFAULT_FORMAT = "mp3_44100_128";

export function toElevenLabsFormat(format: string | undefined): string {
	if (!format) {
		return DEFAULT_FORMAT;
	}
	return FORMAT_MAP[format] ?? format;
}

export function toContentType(elevenLabsFormat: string): string {
	return CONTENT_TYPE_MAP[elevenLabsFormat] ?? "audio/mpeg";
}
