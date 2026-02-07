import { createMiddleware } from "hono/factory";

import { db } from "@llmgateway/db";
import { httpCounter } from "@llmgateway/instrumentation";

export const grafanaMiddleware = createMiddleware(async (c, next) => {
	await next();

	const status = c.res.status;
	const user = c.get("user");

	if (user) {
		const userOrganization = await db.query.userOrganization.findFirst({
			where: {
				userId: {
					eq: user.id,
				},
			},
		});

		const organizationId = userOrganization?.id ?? "unknown";

		httpCounter.add(1, {
			method: c.req.method,
			route: c.req.path,
			status: String(status),
			org_id: organizationId,
			user_id: user.id,
			username: user.name,
			email: user.email,
		});
	}
});
