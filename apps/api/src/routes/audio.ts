import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import {
	getGoogleAccessToken,
	getGoogleProjectId,
	hasGoogleCredentials,
	resetGoogleAuthCache,
} from "@/lib/google-auth.js";

import { logger } from "@llmgateway/logger";

import type { ServerTypes } from "@/vars.js";

export const audio = new OpenAPIHono<ServerTypes>();

const CHIRP_REGION = process.env.GOOGLE_SPEECH_REGION ?? "us";

const transcriptionRoute = createRoute({
	operationId: "audio_transcriptions",
	summary: "Transcribe Audio",
	description:
		"Transcribes audio to text using Google Cloud Speech-to-Text API",
	method: "post",
	path: "/transcriptions",
	request: {
		body: {
			required: true,
			content: {
				"multipart/form-data": {
					schema: z.object({
						file: z.instanceof(File).openapi({
							type: "string",
							format: "binary",
							description: "Audio file to transcribe",
						}),
						language: z.string().optional().openapi({
							example: "en-US",
							description: "BCP-47 language code (default: en-US)",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						text: z.string().openapi({ description: "Transcribed text" }),
					}),
				},
			},
			description: "Transcription result",
		},
		401: {
			content: {
				"application/json": { schema: z.object({ error: z.string() }) },
			},
			description: "Unauthorized — missing or invalid authentication",
		},
		400: {
			content: {
				"application/json": { schema: z.object({ error: z.string() }) },
			},
			description: "Bad request — missing or invalid audio file",
		},
		500: {
			content: {
				"application/json": { schema: z.object({ error: z.string() }) },
			},
			description: "Service not configured or authentication failed",
		},
		502: {
			content: {
				"application/json": { schema: z.object({ error: z.string() }) },
			},
			description: "Google Speech-to-Text API error",
		},
	},
});

audio.openapi(transcriptionRoute, async (c) => {
	if (!hasGoogleCredentials()) {
		logger.error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not configured");
		return c.json({ error: "Speech-to-text service is not configured" }, 500);
	}

	const projectId = getGoogleProjectId();
	if (!projectId) {
		logger.error("Could not read project_id from Google credentials");
		return c.json({ error: "Speech-to-text service is misconfigured" }, 500);
	}

	let formData: FormData;
	try {
		formData = await c.req.formData();
	} catch {
		return c.json({ error: "Invalid multipart form data" }, 400);
	}

	const file = formData.get("file");
	if (!file || !(file instanceof File)) {
		return c.json({ error: "Missing required field: file" }, 400);
	}

	if (file.size === 0) {
		return c.json({ error: "Audio file is empty" }, 400);
	}

	const arrayBuffer = await file.arrayBuffer();
	const audioContent = Buffer.from(arrayBuffer).toString("base64");

	let accessToken: string;
	try {
		accessToken = await getGoogleAccessToken();
	} catch (err) {
		logger.error("Failed to obtain Google access token", { err });
		return c.json(
			{ error: "Failed to authenticate with transcription service" },
			500,
		);
	}

	// chirp_3: language-agnostic model that auto-detects language from audio.
	// Requires a regional endpoint (not global).
	const recognizer = `projects/${projectId}/locations/${CHIRP_REGION}/recognizers/_`;
	const requestBody = {
		recognizer,
		config: {
			autoDecodingConfig: {},
			languageCodes: ["auto"],
			model: "chirp_3",
		},
		content: audioContent,
	};

	const sttUrl = `https://${CHIRP_REGION}-speech.googleapis.com/v2/projects/${projectId}/locations/${CHIRP_REGION}/recognizers/_:recognize`;

	let googleResponse: Response;
	try {
		googleResponse = await fetch(sttUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify(requestBody),
		});
	} catch (err) {
		logger.error("Failed to reach Google Speech-to-Text API", { err });
		return c.json({ error: "Failed to reach transcription service" }, 502);
	}

	if (!googleResponse.ok) {
		const errorBody = await googleResponse.text();
		logger.error("Google Speech-to-Text API returned an error", {
			status: googleResponse.status,
			body: errorBody,
		});
		if (googleResponse.status === 401) {
			resetGoogleAuthCache();
		}
		return c.json(
			{ error: `Transcription service error: ${googleResponse.status}` },
			502,
		);
	}

	const data = (await googleResponse.json()) as {
		results?: Array<{
			alternatives?: Array<{ transcript?: string }>;
		}>;
	};

	const transcript =
		data.results
			?.flatMap((r) => r.alternatives ?? [])
			.map((a) => a.transcript ?? "")
			.join(" ")
			.trim() ?? "";

	return c.json({ text: transcript }, 200);
});
