import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import { db as cdb, shortid } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";
import {
	audioModels,
	getAudioModel,
	getProviderEndpoint,
	getProviderHeaders,
	getVoiceId,
} from "@llmgateway/models";

import type { ServerTypes } from "@/vars.js";

export const audio = new OpenAPIHono<ServerTypes>();

const audioSpeechRequestSchema = z.object({
	model: z.string().openapi({
		example: "eleven_multilingual_v2",
		description: "The TTS model to use for generation",
	}),
	input: z.string().openapi({
		example: "Hello, welcome to ElevenLabs text-to-speech!",
		description: "The text to convert to speech",
	}),
	voice: z.string().openapi({
		example: "alloy",
		description:
			"Voice to use (OpenAI names: alloy, echo, fable, onyx, nova, shimmer or ElevenLabs voice IDs)",
	}),
	response_format: z
		.enum([
			"mp3",
			"opus",
			"aac",
			"flac",
			"wav",
			"pcm",
			"mp3_22050_32",
			"mp3_44100_64",
			"mp3_44100_128",
			"pcm_16000",
			"pcm_24000",
			"ulaw_8000",
		])
		.optional()
		.default("mp3")
		.openapi({
			description: "The format of the audio output",
		}),
	speed: z.number().min(0.25).max(4.0).optional().default(1.0).openapi({
		description: "Speed of the audio (0.25 to 4.0)",
	}),
});

const audioSpeechRoute = createRoute({
	operationId: "v1_audio_speech",
	summary: "Create Speech",
	description: "Converts text to speech using AI-powered TTS models",
	method: "post",
	path: "/speech",
	security: [
		{
			bearerAuth: [],
		},
	],
	request: {
		body: {
			content: {
				"application/json": {
					schema: audioSpeechRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"audio/*": {
					schema: z.any(),
				},
			},
			description: "Audio file in the requested format",
		},
		400: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							message: z.string(),
							type: z.string(),
							code: z.string(),
						}),
					}),
				},
			},
			description: "Bad request",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							message: z.string(),
							type: z.string(),
							code: z.string(),
						}),
					}),
				},
			},
			description: "Unauthorized",
		},
	},
});

audio.openapi(audioSpeechRoute, async (c) => {
	const requestId = c.req.header("x-request-id") || shortid(40);
	c.header("x-request-id", requestId);

	const { model, input, voice, response_format } = c.req.valid("json");

	// Get API key
	const auth = c.req.header("Authorization");
	const xApiKey = c.req.header("x-api-key");

	let token: string | undefined;

	if (auth) {
		const split = auth.split("Bearer ");
		if (split.length === 2 && split[1]) {
			token = split[1];
		}
	}

	if (!token && xApiKey) {
		token = xApiKey;
	}

	if (!token) {
		throw new HTTPException(401, {
			message:
				"Unauthorized: No API key provided. Expected 'Authorization: Bearer your-api-token' header or 'x-api-key: your-api-token' header",
		});
	}

	// Verify API key
	const apiKey = await cdb.query.apiKey.findFirst({
		where: {
			token: {
				eq: token,
			},
		},
	});

	if (!apiKey || apiKey.status !== "active") {
		throw new HTTPException(401, {
			message:
				"Unauthorized: Invalid LLMGateway API token. Please make sure the token is not deleted or disabled.",
		});
	}

	// Get project
	const project = await cdb.query.project.findFirst({
		where: {
			id: {
				eq: apiKey.projectId,
			},
		},
	});

	if (!project) {
		throw new HTTPException(500, {
			message: "Could not find project",
		});
	}

	if (project.status === "deleted") {
		throw new HTTPException(410, {
			message: "Project has been archived and is no longer accessible",
		});
	}

	// Validate model
	const audioModel = getAudioModel(model);
	if (!audioModel) {
		throw new HTTPException(400, {
			message: `Unsupported TTS model: ${model}. Available models: ${audioModels.map((m: any) => m.id).join(", ")}`,
		});
	}

	// For now, only support elevenlabs
	const provider = "elevenlabs";
	const providerMapping = audioModel.providers.find(
		(p: any) => p.providerId === provider,
	);

	if (!providerMapping) {
		throw new HTTPException(500, {
			message: `Model ${model} has no provider mapping`,
		});
	}

	// Validate input length
	const characterCount = input.length;
	if (characterCount > providerMapping.maxCharacters) {
		throw new HTTPException(400, {
			message: `Input text too long. Maximum ${providerMapping.maxCharacters} characters, got ${characterCount}`,
		});
	}

	// Get provider API key
	let providerToken: string | undefined;

	if (project.mode === "api-keys") {
		const providerKey = await cdb.query.providerKey.findFirst({
			where: {
				status: {
					eq: "active",
				},
				organizationId: {
					eq: project.organizationId,
				},
				provider: {
					eq: provider,
				},
			},
		});

		if (!providerKey) {
			throw new HTTPException(400, {
				message: `No API key set for provider: ${provider}. Please add a provider key in your settings.`,
			});
		}

		providerToken = providerKey.token;
	} else if (project.mode === "credits" || project.mode === "hybrid") {
		// Check credits
		const organization = await cdb.query.organization.findFirst({
			where: {
				id: {
					eq: project.organizationId,
				},
			},
		});

		if (!organization) {
			throw new HTTPException(500, {
				message: "Could not find organization",
			});
		}

		if (parseFloat(organization.credits || "0") <= 0) {
			throw new HTTPException(402, {
				message: "Organization has insufficient credits",
			});
		}

		throw new HTTPException(501, {
			message:
				"Credits mode not yet implemented for audio. Please use API keys mode.",
		});
	}

	if (!providerToken) {
		throw new HTTPException(500, {
			message: "No provider token available",
		});
	}

	// Map voice name to provider voice ID
	const voiceId = getVoiceId(provider, voice);
	if (!voiceId) {
		throw new HTTPException(400, {
			message: `Invalid voice: ${voice}`,
		});
	}

	// Build ElevenLabs request
	const elevenlabsRequestBody = {
		text: input,
		model_id: providerMapping.modelName,
		voice_settings: {
			stability: 0.5,
			similarity_boost: 0.75,
		},
	};

	// Get endpoint
	const url = `${getProviderEndpoint(provider as any)}/v1/text-to-speech/${voiceId}`;

	// Map response format to ElevenLabs format
	const outputFormat = response_format || "mp3";

	try {
		const headers = getProviderHeaders(provider as any, providerToken);
		headers["Content-Type"] = "application/json";

		const res = await fetch(`${url}?output_format=${outputFormat}`, {
			method: "POST",
			headers,
			body: JSON.stringify(elevenlabsRequestBody),
		});

		if (!res.ok) {
			const errorText = await res.text();
			logger.error("ElevenLabs TTS error", {
				status: res.status,
				error: errorText,
				model,
				voiceId,
			});

			throw new HTTPException(res.status as 400, {
				message: `TTS provider error: ${errorText}`,
			});
		}

		// Get audio data
		const audioBuffer = await res.arrayBuffer();

		// Set character count header
		c.header("x-character-count", characterCount.toString());

		// Determine content type
		const contentTypeMap: Record<string, string> = {
			mp3: "audio/mpeg",
			mp3_22050_32: "audio/mpeg",
			mp3_44100_64: "audio/mpeg",
			mp3_44100_128: "audio/mpeg",
			opus: "audio/opus",
			aac: "audio/aac",
			flac: "audio/flac",
			wav: "audio/wav",
			pcm: "audio/pcm",
			pcm_16000: "audio/pcm",
			pcm_24000: "audio/pcm",
			ulaw_8000: "audio/basic",
		};

		const contentType = contentTypeMap[outputFormat] || "audio/mpeg";

		// Return audio
		return new Response(audioBuffer, {
			headers: {
				"Content-Type": contentType,
				"x-character-count": characterCount.toString(),
				"x-request-id": requestId,
			},
		});
	} catch (error) {
		if (error instanceof HTTPException) {
			throw error;
		}

		logger.error("Audio speech error", {
			error: error instanceof Error ? error.message : String(error),
			model,
			voice,
		});

		throw new HTTPException(500, {
			message: `Failed to generate speech: ${error instanceof Error ? error.message : String(error)}`,
		});
	}
});
