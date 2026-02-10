import { createMiddleware } from "hono/factory";

import {
	costCounter,
	modelUsageCounter,
	tokenCounter,
} from "@llmgateway/instrumentation";

export const grafanaMiddleware = createMiddleware(async (c, next) => {
	await next();

	if (!c.res.ok) {
		return;
	}
	const contentType = c.res.headers.get("content-type");
	if (!contentType || !contentType.includes("application/json")) {
		return;
	}

	const responseClone = c.res.clone();

	try {
		const body = await responseClone.json();

		const orgId = c.get("organizationId");
		const userId = c.get("userId");
		const env = process.env.NODE_ENV || "development";

		if (body.usage) {
			const model = body.model || body.metadata?.used_model || "unknown";

			tokenCounter.add(body.usage.prompt_tokens, {
				type: "prompt",
				model: model,
				org_id: orgId,
				user_id: userId,
				environment: env,
			});

			tokenCounter.add(body.usage.completion_tokens, {
				type: "completion",
				model: model,
				org_id: orgId,
				user_id: userId,
				environment: env,
			});

			if (body.usage.prompt_tokens_details?.cached_tokens) {
				tokenCounter.add(body.usage.prompt_tokens_details.cached_tokens, {
					type: "cached",
					model: model,
					org_id: orgId,
					user_id: userId,
					environment: env,
				});
			}
		}

		if (body.usage?.cost_usd_total) {
			costCounter.add(body.usage.cost_usd_total, {
				type: "model_usage",
				model: body.metadata?.used_model || body.model,
				org_id: orgId,
				environment: env,
			});
		}

		modelUsageCounter.add(1, {
			model: body.metadata?.used_model || body.model,
			org_id: orgId,
			user_id: userId,
			environment: env,
		});
	} catch {
		// console.error("Failed to collect metrics from response body", err);
	}
});
