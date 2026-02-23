import { checkRateLimit, type RateLimitConfig } from "@/auth/config.js";

import type { ServerTypes } from "@/vars.js";
import type { MiddlewareHandler } from "hono";

export function rateLimitMiddleware(
	config: RateLimitConfig,
): MiddlewareHandler<ServerTypes> {
	return async (c, next) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		const result = await checkRateLimit(user.id, config);

		if (!result.allowed) {
			const retryAfter = Math.max(
				1,
				Math.ceil((result.resetTime - Date.now()) / 1000),
			);
			return c.json(
				{ error: "Too many requests. Please try again later." },
				429,
				{
					"Retry-After": String(retryAfter),
					"X-RateLimit-Remaining": "0",
					"X-RateLimit-Reset": String(result.resetTime),
				},
			);
		}

		c.header("X-RateLimit-Remaining", String(result.remaining));
		c.header("X-RateLimit-Reset", String(result.resetTime));
		return await next();
	};
}
