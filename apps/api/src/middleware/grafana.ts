import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { httpCounter } from "@llmgateway/instrumentation";

export const grafanaMiddleware = createMiddleware(async (c, next) => {
	await next();

	const status = c.res.status;
	const user = c.get("user");

	let finalOrgId = "unknown";

	const allCookies = getCookie(c);
	const prefix = "llmgateway-last-used-project-";

	const targetCookieName = Object.keys(allCookies).find((name) =>
		name.startsWith(prefix),
	);

	if (targetCookieName) {
		const orgIdFromCookie = targetCookieName.replace(prefix, "");

		if (orgIdFromCookie && /^[a-zA-Z0-9-]+$/.test(orgIdFromCookie)) {
			finalOrgId = orgIdFromCookie;
		}
	}

	httpCounter.add(1, {
		method: c.req.method,
		route: c.req.routePath,
		status: String(status),
		org_id: finalOrgId,
		user_id: user?.id || "anonymous",
	});
});
