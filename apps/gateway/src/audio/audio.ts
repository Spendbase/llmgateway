import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import { getModelMappingStatuses } from "@/lib/filter-model-mappings.js";
import { insertLog } from "@/lib/logs.js";

import { db as cdb, shortid } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";
import {
	audioModels,
	getAudioModel,
	getProviderEnvVar,
	getProviderHeaders,
} from "@llmgateway/models";

import { toContentType, toElevenLabsFormat } from "./elevenlabs-formats.js";
import {
	handleVoiceNotFound,
	resolveVoiceId,
} from "./elevenlabs-voice-service.js";

import type { ServerTypes } from "@/vars.js";

export const audio = new OpenAPIHono<ServerTypes>();

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

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

async function callElevenLabsTTS(
	voiceId: string,
	modelName: string,
	text: string,
	outputFormat: string,
	providerToken: string,
): Promise<Response> {
	const url = `${ELEVENLABS_TTS_URL}/${voiceId}`;
	const headers = getProviderHeaders("elevenlabs", providerToken);
	headers["Content-Type"] = "application/json";

	return await fetch(`${url}?output_format=${outputFormat}`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			text,
			model_id: modelName,
			voice_settings: {
				stability: 0.5,
				similarity_boost: 0.75,
			},
		}),
	});
}

function isVoiceNotFoundError(errorBody: unknown): boolean {
	if (typeof errorBody !== "object" || errorBody === null) {
		return false;
	}
	const detail = (errorBody as Record<string, any>).detail;
	return detail?.code === "voice_not_found";
}

audio.openapi(audioSpeechRoute, async (c) => {
	const requestId = c.req.header("x-request-id") || shortid(40);
	c.header("x-request-id", requestId);

	const { model, input, voice, response_format } = c.req.valid("json");

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

	const mappingStatuses = await getModelMappingStatuses(model);
	const mappingStatus = mappingStatuses.get(`${model}:${provider}`);
	if (mappingStatus === "inactive") {
		throw new HTTPException(400, {
			message: `TTS model ${model} is currently disabled`,
		});
	}
	if (mappingStatus === "deactivated") {
		throw new HTTPException(410, {
			message: `TTS model ${model} has been deactivated and is no longer available`,
		});
	}

	// Validate input length
	const characterCount = input.length;
	if (characterCount > providerMapping.maxCharacters) {
		throw new HTTPException(400, {
			message: `Input text too long. Maximum ${providerMapping.maxCharacters} characters, got ${characterCount}`,
		});
	}

	const requestStartTime = Date.now();

	// Check if organization is active and get organization data
	const organization = await cdb.query.organization.findFirst({
		where: {
			id: {
				eq: project.organizationId,
			},
		},
	});

	if (!organization || organization.status !== "active") {
		throw new HTTPException(403, {
			message:
				"Organization has been suspended. Please contact support for assistance.",
		});
	}

	let providerToken: string | undefined;
	let usedMode: "credits" | "api-keys" = "credits";

	if (project.mode === "api-keys" || project.mode === "hybrid") {
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

		if (providerKey) {
			providerToken = providerKey.token;
			usedMode = "api-keys";
		} else if (project.mode === "api-keys") {
			throw new HTTPException(400, {
				message: `No API key set for provider: ${provider}. Please add a provider key in your settings.`,
			});
		}
	}

	if (!providerToken) {
		const envVarName = getProviderEnvVar(provider as any);
		const envToken = envVarName ? process.env[envVarName] : undefined;

		if (!envToken) {
			throw new HTTPException(400, {
				message: `No API key set for provider: ${provider}. Please add a provider key in your settings or set the ${envVarName} environment variable.`,
			});
		}

		if (parseFloat(organization.credits || "0") <= 0) {
			throw new HTTPException(402, {
				message: "Organization has insufficient credits",
			});
		}

		providerToken = envToken;
		usedMode = "credits";
	}

	const outputFormat = toElevenLabsFormat(response_format);

	try {
		let voiceId = await resolveVoiceId(voice, providerToken);

		let res = await callElevenLabsTTS(
			voiceId,
			providerMapping.modelName,
			input,
			outputFormat,
			providerToken,
		);

		if (!res.ok) {
			const errorBody = await res.json().catch(() => null);

			if (isVoiceNotFoundError(errorBody)) {
				voiceId = await handleVoiceNotFound(voice, providerToken);
				res = await callElevenLabsTTS(
					voiceId,
					providerMapping.modelName,
					input,
					outputFormat,
					providerToken,
				);
			}

			if (!res.ok) {
				const errorText = await res.text().catch(() => String(res.status));
				logger.error("ElevenLabs TTS error", {
					status: res.status,
					error: errorText,
					model,
					voiceId,
				});
				if (res.status === 403) {
					throw new HTTPException(403, {
						message: `The requested output format "${response_format}" requires a paid ElevenLabs plan. Use mp3 or opus instead, or provide your own ElevenLabs API key with the required plan.`,
					});
				}
				throw new HTTPException(res.status as 400, {
					message: `TTS provider error: ${errorText}`,
				});
			}
		}

		const audioBuffer = await res.arrayBuffer();
		const contentType = toContentType(outputFormat);
		const duration = Date.now() - requestStartTime;
		const cost = characterCount * providerMapping.characterPrice;

		insertLog({
			requestId,
			organizationId: project.organizationId,
			projectId: project.id,
			apiKeyId: apiKey.id,
			requestedModel: model,
			usedModel: model,
			usedProvider: provider,
			mode: project.mode,
			usedMode,
			duration,
			responseSize: audioBuffer.byteLength,
			cost,
			cached: false,
			streamed: false,
			content: input,
			finishReason: "stop",
			unifiedFinishReason: "completed",
			userId: apiKey.createdBy,
		}).catch((err: unknown) => {
			logger.error("Failed to write TTS log entry", { error: err });
		});

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
