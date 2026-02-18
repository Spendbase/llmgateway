import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { app } from "@/index.js";

// Mock instrumentation to avoid OTEL errors
vi.mock("@llmgateway/instrumentation", () => ({
	initTelemetry: vi.fn(),
	createHonoRequestLogger: vi.fn(() => (c: any, next: any) => next()),
	createRequestLifecycleMiddleware: vi.fn(() => (c: any, next: any) => next()),
	createTracingMiddleware: vi.fn(() => (c: any, next: any) => next()),
}));

// Mock cache module
const mocks = vi.hoisted(() => ({
	getCache: vi.fn(),
	setCache: vi.fn(),
	generateCacheKey: vi.fn((payload) => JSON.stringify(payload)),
	select: vi.fn(),
}));

vi.mock("@llmgateway/cache", async () => {
	const actual = await vi.importActual("@llmgateway/cache");
	return {
		...actual,
		getCache: mocks.getCache,
		setCache: mocks.setCache,
		generateCacheKey: mocks.generateCacheKey,
		redisClient: {
			on: vi.fn(),
			get: vi.fn(),
			set: vi.fn(),
			disconnect: vi.fn(),
			quit: vi.fn(),
		},
	};
});

// Mock Query Builder
const createMockBuilder = (result: any) => {
	const builder: any = {
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		mapWith: vi.fn().mockReturnThis(), // handle sql mapWith
		then: (resolve: any) => resolve(result),
	};
	return builder;
};

vi.mock("@llmgateway/db", async () => {
	const actual = await vi.importActual<any>("@llmgateway/db");
	return {
		...actual,
		db: {
			select: mocks.select,
		},
	};
});

describe("public rankings endpoint", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test("GET /public/rankings should filter by period and return data", async () => {
		// Setup mocks for 2 queries:
		// 1. Grand Total (returns [{ totalTokens: 1000 }])
		// 2. Main Query (returns list of items)

		const grandTotalBuilder = createMockBuilder([{ totalTokens: 10000 }]);
		const mainQueryBuilder = createMockBuilder([
			{
				modelId: "model-1",
				modelName: "Model One",
				// provider info present if groupBy=modelProvider (default)
				providerId: "provider-1",
				providerName: "Provider One",
				totalTokens: 1000,
				inputTokens: 400,
				outputTokens: 600,
				requestCount: 10,
				errorCount: 1,
				totalDuration: 5000,
				totalTtft: 2000,
				inputPrice: 10,
				outputPrice: 30,
				requestPrice: 0.5,
			},
		]);

		mocks.select
			.mockReturnValueOnce(grandTotalBuilder)
			.mockReturnValueOnce(mainQueryBuilder);

		const response = await app.request("/public/rankings?period=24h");
		expect(response.status).toBe(200);
		const json = await response.json();

		expect(json.period).toBe("24h");
		expect(json.data).toHaveLength(1);
		expect(json.data[0].modelId).toBe("model-1");
		// Usage percent: 1000 / 10000 = 10%
		expect(json.data[0].usagePercent).toBe(10);

		// Verify Period Filter Logic using spy
		// mainQueryBuilder.where was called.
		// We need to check if the arguments to where() contained the timestamp check.
		// Since we pass SQL objects to where(), strict equality check is hard.
		// But we can check calls.length.
		expect(mainQueryBuilder.where).toHaveBeenCalled();
	});

	test("GET /public/rankings should handle cache hit", async () => {
		const cachedResponse = {
			period: "24h",
			data: [{ modelId: "cached" }],
		};
		mocks.getCache.mockResolvedValueOnce(cachedResponse);

		const response = await app.request("/public/rankings?period=24h");
		expect(response.status).toBe(200);
		const json = await response.json();

		expect(json.data[0].modelId).toBe("cached");
		expect(mocks.select).not.toHaveBeenCalled();
	});

	test("GET /public/rankings should group by model correctly", async () => {
		const grandTotalBuilder = createMockBuilder([{ totalTokens: 100 }]);
		const mainQueryBuilder = createMockBuilder([]);
		mocks.select.mockReturnValue(mainQueryBuilder); // Default
		mocks.select
			.mockReturnValueOnce(grandTotalBuilder)
			.mockReturnValueOnce(mainQueryBuilder);

		await app.request("/public/rankings?groupBy=model");

		// Check if groupBy was called with model fields only
		// The service logic: if (groupBy === "model") query.groupBy(modelTable.id, modelTable.name)
		// else query.groupBy(modelTable.id, modelTable.name, providerTable.id, providerTable.name)

		// We can inspect the number of args passed to groupBy
		const groupByCalls = mainQueryBuilder.groupBy.mock.calls;
		expect(groupByCalls.length).toBeGreaterThan(0);
		// We expect 2 arguments (id, name) for 'model' mode
		// Note: Drizzle passes arguments to .groupBy(...args).
		expect(groupByCalls[0].length).toBe(2);
	});

	test("GET /public/rankings should group by modelProvider correctly", async () => {
		const grandTotalBuilder = createMockBuilder([{ totalTokens: 100 }]);
		const mainQueryBuilder = createMockBuilder([]);
		mocks.select
			.mockReturnValueOnce(grandTotalBuilder)
			.mockReturnValueOnce(mainQueryBuilder);

		await app.request("/public/rankings?groupBy=modelProvider");

		const groupByCalls = mainQueryBuilder.groupBy.mock.calls;
		expect(groupByCalls.length).toBeGreaterThan(0);
		// We expect 4 arguments (m.id, m.name, p.id, p.name)
		expect(groupByCalls[0].length).toBe(4);
	});
});
