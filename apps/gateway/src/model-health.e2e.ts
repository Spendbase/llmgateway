import "dotenv/config";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "vitest";

import { app } from "@/app.js";
import {
	afterAllHook,
	beforeAllHook,
	beforeEachHook,
	getConcurrentTestOptions,
	getTestOptions,
	logMode,
	testModels,
	validateResponse,
} from "@/chat-helpers.e2e.js";

import { models, type ProviderModelMapping } from "@llmgateway/models";

const deactivatedModels = models
	.filter((m) => !["custom", "auto"].includes(m.id))
	.filter((model) => {
		const now = new Date();
		const activeProviders = (model.providers as ProviderModelMapping[]).filter(
			(p) => !p.deactivatedAt || now <= p.deactivatedAt,
		);
		return activeProviders.length === 0;
	})
	.flatMap((model) =>
		(model.providers as ProviderModelMapping[]).slice(0, 1).map((p) => ({
			model: `${p.providerId}/${model.id}`,
			provider: p,
			originalModel: model.id,
		})),
	);

describe("e2e model health", getConcurrentTestOptions(), () => {
	beforeAll(beforeAllHook);
	afterAll(afterAllHook);
	beforeEach(beforeEachHook);

	test("empty", () => {
		expect(true).toBe(true);
	});

	test.each(testModels)(
		"health check $model",
		{ ...getTestOptions({ completions: true }), retry: 2 },
		async ({ model }) => {
			const res = await app.request("/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer real-token",
				},
				body: JSON.stringify({
					model,
					messages: [
						{
							role: "user",
							content: "Reply with just the word OK",
						},
					],
				}),
			});

			if (res.status !== 200) {
				const text = await res.text();
				if (logMode) {
					console.log(`health check failed for ${model}:`, text);
				}
				throw new Error(
					`Health check failed for ${model}: status=${res.status} body=${text}`,
				);
			}

			expect(res.status).toBe(200);
			const json = await res.json();
			validateResponse(json);
		},
	);

	test.each(deactivatedModels)(
		"deactivated $model returns error",
		getTestOptions(),
		async ({ model }) => {
			const res = await app.request("/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer real-token",
				},
				body: JSON.stringify({
					model,
					messages: [{ role: "user", content: "test" }],
				}),
			});

			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.status).toBeLessThan(500);
		},
	);
});
