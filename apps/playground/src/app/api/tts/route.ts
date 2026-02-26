import { cookies } from "next/headers";

import { getUser } from "@/lib/getUser";

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

	const body = await req.json();
	const { model, input, voice, response_format } = body;

	if (!model || !input || !voice) {
		return new Response(
			JSON.stringify({ error: "Missing required fields: model, input, voice" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const gatewayUrl =
		process.env.GATEWAY_URL ||
		(process.env.NODE_ENV === "development"
			? "http://localhost:4001/v1"
			: "https://internal.llmapi.ai/v1");

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
			response_format: response_format ?? "mp3",
		}),
	});

	if (!gatewayRes.ok) {
		const errorText = await gatewayRes.text();
		return new Response(errorText, {
			status: gatewayRes.status,
			headers: { "Content-Type": "application/json" },
		});
	}

	const audioBuffer = await gatewayRes.arrayBuffer();
	const contentType = gatewayRes.headers.get("Content-Type") ?? "audio/mpeg";
	const characterCount =
		gatewayRes.headers.get("x-character-count") ?? String(input.length);

	return new Response(audioBuffer, {
		status: 200,
		headers: {
			"Content-Type": contentType,
			"x-character-count": characterCount,
		},
	});
}
