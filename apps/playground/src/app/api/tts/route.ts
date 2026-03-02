import { cookies } from "next/headers";
import { z } from "zod";

import { getConfig } from "@/lib/config-server";
import { getUser } from "@/lib/getUser";

import { getStorageService } from "@llmgateway/storage";

const ttsRequestSchema = z.object({
	model: z.string().min(1),
	input: z.string().min(1),
	voice: z.string().min(1),
	response_format: z.string().optional(),
	speed: z.number().optional(),
});

export async function POST(req: Request) {
	const user = await getUser();

	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const cookieStore = await cookies();
	const cookieApiKey =
		cookieStore.get("llmgateway_playground_key")?.value ||
		cookieStore.get("__Host-llmgateway_playground_key")?.value;

	if (!cookieApiKey) {
		return new Response(JSON.stringify({ error: "Missing API key" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	let rawBody: unknown;
	try {
		rawBody = await req.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const parsed = ttsRequestSchema.safeParse(rawBody);
	if (!parsed.success) {
		return new Response(
			JSON.stringify({
				error: parsed.error.issues[0]?.message ?? "Invalid request body",
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const { model, input, voice, response_format, speed } = parsed.data;

	const gatewayUrl =
		process.env.GATEWAY_URL ||
		(process.env.NODE_ENV === "development"
			? "http://localhost:4001/v1"
			: "https://internal.llmapi.ai/v1");

	const format = response_format ?? "mp3";

	const gatewayRes = await fetch(`${gatewayUrl}/audio/speech`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookieApiKey}`,
			"x-source": "chat.llmapi.ai",
		},
		body: JSON.stringify({
			model,
			input,
			voice,
			response_format: format,
			speed: speed ?? 1.0,
		}),
	});

	if (!gatewayRes.ok) {
		let message: string;
		try {
			const errJson = await gatewayRes.json();
			message =
				errJson?.error?.message ??
				(typeof errJson?.error === "string" &&
				errJson.error !== String(gatewayRes.status)
					? errJson.error
					: undefined) ??
				errJson?.message ??
				null;
		} catch {
			message = await gatewayRes.text().catch(() => "");
		}

		if (!message || message === String(gatewayRes.status)) {
			const fallbacks: Record<number, string> = {
				401: "Invalid or missing API key. Check your key in the project settings.",
				403: "Access denied. Your API key doesn't have permission for this model.",
				429: "Rate limit exceeded. Please wait a moment and try again.",
				500: "The AI provider encountered an error. Please try again.",
				503: "The AI provider is temporarily unavailable. Please try again.",
			};
			message =
				fallbacks[gatewayRes.status] ??
				`Request failed with status ${gatewayRes.status}.`;
		}

		return new Response(JSON.stringify({ error: message }), {
			status: gatewayRes.status,
			headers: { "Content-Type": "application/json" },
		});
	}

	const audioBuffer = await gatewayRes.arrayBuffer();
	const contentType = gatewayRes.headers.get("Content-Type") ?? "audio/mpeg";
	const characterCount =
		gatewayRes.headers.get("x-character-count") ?? String(input.length);

	// Session cookie for backend API auth
	const sessionKey = "better-auth.session_token";
	const sessionCookie = cookieStore.get(sessionKey);
	const secureSessionCookie = cookieStore.get(`__Secure-${sessionKey}`);
	const cookieHeader = secureSessionCookie
		? `__Secure-${sessionKey}=${secureSessionCookie.value}`
		: sessionCookie
			? `${sessionKey}=${sessionCookie.value}`
			: "";

	await saveTtsGeneration(audioBuffer, {
		userId: user.id,
		model,
		input,
		voice,
		format,
		contentType,
		cookieHeader,
	});

	return new Response(audioBuffer, {
		status: 200,
		headers: {
			"Content-Type": contentType,
			"x-character-count": characterCount,
		},
	});
}

interface SaveParams {
	userId: string;
	model: string;
	input: string;
	voice: string;
	format: string;
	contentType: string;
	cookieHeader: string;
}

async function saveTtsGeneration(
	audioBuffer: ArrayBuffer,
	params: SaveParams,
): Promise<void> {
	try {
		const storage = getStorageService();
		const ext = params.format === "mp3" ? "mp3" : params.format;
		const key = storage.generateKey(`tts/${params.userId}`, ext);

		await storage.upload(Buffer.from(audioBuffer), key, params.contentType);

		const config = getConfig();
		const saveRes = await fetch(`${config.apiBackendUrl}/tts-generations`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: params.cookieHeader,
			},
			body: JSON.stringify({
				model: params.model,
				voice: params.voice,
				format: params.format,
				text: params.input,
				file: key,
			}),
		});

		if (!saveRes.ok) {
			throw new Error(
				`Failed to save TTS generation metadata: ${saveRes.status}`,
			);
		}
	} catch (err) {
		console.error("[tts] save failed:", err);
		throw err;
	}
}
