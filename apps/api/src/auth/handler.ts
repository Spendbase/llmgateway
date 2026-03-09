import { OpenAPIHono } from "@hono/zod-openapi";

import { getTimeMessage } from "@/utils/convert-time.js";

import { apiAuth, verifyEmailWithCode } from "./config.js";

import type { ServerTypes } from "@/vars.js";

// Create a Hono app for auth routes
export const authHandler = new OpenAPIHono<ServerTypes>();

authHandler.use("*", async (c, next) => {
	const session = await apiAuth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return await next();
	}

	c.set("user", session.user);
	c.set("session", session.session);
	return await next();
});

authHandler.post("/auth/verify-email-with-code", async (c) => {
	let body: { email?: string; code?: string };
	try {
		body = (await c.req.json()) as { email?: string; code?: string };
	} catch {
		return c.json({ error: "invalid_body", message: "Invalid JSON body" }, 400);
	}

	const email = typeof body.email === "string" ? body.email.trim() : "";
	const code = typeof body.code === "string" ? body.code.trim() : "";

	if (!email || !code) {
		return c.json(
			{ error: "validation", message: "Email and code are required" },
			400,
		);
	}

	const result = await verifyEmailWithCode(email, code);

	if (result.success) {
		return c.json({ success: true });
	}

	if (result.error === "too_many_attempts") {
		const timeMessage = getTimeMessage(result.retryAfter - Date.now());

		return c.json(
			{
				error: "too_many_attempts",
				message: `Too many attempts. Please try again in ${timeMessage}.`,
				retryAfter: result.retryAfter,
			},
			429,
			{
				"Retry-After": String(result.retryAfter),
			},
		);
	}

	return c.json(
		{
			error: "invalid_or_expired",
			message: "Invalid or expired verification code",
		},
		400,
	);
});

authHandler.on(["POST", "GET"], "/auth/*", (c) => {
	return apiAuth.handler(c.req.raw);
});
