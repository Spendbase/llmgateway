import { cookies } from "next/headers";

import { getConfig } from "@/lib/config-server";
import { getUser } from "@/lib/getUser";

import type { NextRequest } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getUser();
	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { id } = await params;
	const download = req.nextUrl.searchParams.get("download") === "true";

	const cookieStore = await cookies();
	const sessionKey = "better-auth.session_token";
	const sessionCookie = cookieStore.get(sessionKey);
	const secureSessionCookie = cookieStore.get(`__Secure-${sessionKey}`);
	const cookieHeader = secureSessionCookie
		? `__Secure-${sessionKey}=${secureSessionCookie.value}`
		: sessionCookie
			? `${sessionKey}=${sessionCookie.value}`
			: "";

	const config = getConfig();
	const res = await fetch(
		`${config.apiBackendUrl}/tts-generations/${id}/audio`,
		{
			method: "GET",
			headers: { Cookie: cookieHeader },
			redirect: "manual",
		},
	);

	if (res.status === 302 || res.status === 301) {
		const location = res.headers.get("location");
		if (!location) {
			return new Response(JSON.stringify({ error: "Missing redirect" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!download) {
			return Response.redirect(location, 302);
		}

		const s3Res = await fetch(location);
		const contentType = s3Res.headers.get("Content-Type") ?? "audio/mpeg";
		const ext = contentType.includes("mpeg")
			? "mp3"
			: (contentType.split("/")[1] ?? "mp3");

		return new Response(s3Res.body, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `attachment; filename="speech.${ext}"`,
			},
		});
	}

	if (res.status === 404) {
		return new Response(JSON.stringify({ error: "Generation not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ error: "Unexpected response" }), {
		status: 500,
		headers: { "Content-Type": "application/json" },
	});
}
