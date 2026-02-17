import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { db, inArray, tables } from "@llmgateway/db";

import { internalModels } from "./internal-models.js";

// Run tests sequentially to avoid database conflicts
describe.sequential("internal-models endpoint", () => {
	// Generate unique ID prefix for this test run to avoid conflicts
	const testRunId = `test-${Date.now()}`;

	// Test data IDs with unique prefix
	const testProviderIds = [
		`${testRunId}-active-provider`,
		`${testRunId}-inactive-provider`,
		`${testRunId}-active-provider-2`,
		`${testRunId}-active-provider-3`,
	];
	const testModelIds = [
		`${testRunId}-model-with-active-provider`,
		`${testRunId}-model-with-inactive-provider`,
		`${testRunId}-model-with-mixed-providers`,
		`${testRunId}-model-with-mixed-mapping-statuses`,
		`${testRunId}-model-other-family`, // from family filter test
	];
	const testMappingIds = [
		`${testRunId}-mapping-1`,
		`${testRunId}-mapping-2`,
		`${testRunId}-mapping-3a`,
		`${testRunId}-mapping-3b`,
		`${testRunId}-mapping-4a`,
		`${testRunId}-mapping-4b`,
		`${testRunId}-mapping-4c`,
		`${testRunId}-mapping-other`, // from family filter test
	];

	// Clean up function for test data - only removes test records
	async function cleanupTestData() {
		// Delete only test data by ID in correct order (foreign keys)
		// Use inArray for efficient batch deletion
		await db
			.delete(tables.modelProviderMapping)
			.where(inArray(tables.modelProviderMapping.id, testMappingIds));

		await db.delete(tables.model).where(inArray(tables.model.id, testModelIds));

		await db
			.delete(tables.provider)
			.where(inArray(tables.provider.id, testProviderIds));
	}

	beforeEach(async () => {
		// Clean up any existing data first
		await cleanupTestData();

		// Insert providers with different statuses
		await db.insert(tables.provider).values([
			{
				id: testProviderIds[0], // active-provider
				name: "Active Provider",
				description: "Test active provider",
				status: "active",
			},
			{
				id: testProviderIds[1], // inactive-provider
				name: "Inactive Provider",
				description: "Test inactive provider",
				status: "inactive",
			},
			{
				id: testProviderIds[2], // active-provider-2
				name: "Active Provider 2",
				description: "Test active provider 2",
				status: "active",
			},
			{
				id: testProviderIds[3], // active-provider-3
				name: "Active Provider 3",
				description: "Test active provider 3",
				status: "active",
			},
		]);

		// Insert models
		await db.insert(tables.model).values([
			{
				id: testModelIds[0], // model-with-active-provider
				name: "Model with Active Provider",
				description: "Test model",
				family: "test",
			},
			{
				id: testModelIds[1], // model-with-inactive-provider
				name: "Model with Inactive Provider",
				description: "Test model",
				family: "test",
			},
			{
				id: testModelIds[2], // model-with-mixed-providers
				name: "Model with Mixed Providers",
				description: "Test model",
				family: "test",
			},
			{
				id: testModelIds[3], // model-with-mixed-mapping-statuses
				name: "Model with Mixed Mapping Statuses",
				description: "Test model",
				family: "test",
			},
		]);

		// Insert model provider mappings with different statuses
		await db.insert(tables.modelProviderMapping).values([
			// Model with only active provider and active mapping
			{
				id: testMappingIds[0], // mapping-1
				modelId: testModelIds[0], // model-with-active-provider
				providerId: testProviderIds[0], // active-provider
				modelName: "test-model-1",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			// Model with only inactive provider and active mapping
			{
				id: testMappingIds[1], // mapping-2
				modelId: testModelIds[1], // model-with-inactive-provider
				providerId: testProviderIds[1], // inactive-provider
				modelName: "test-model-2",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			// Model with both active and inactive providers
			{
				id: testMappingIds[2], // mapping-3a
				modelId: testModelIds[2], // model-with-mixed-providers
				providerId: testProviderIds[0], // active-provider
				modelName: "test-model-3",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			{
				id: testMappingIds[3], // mapping-3b
				modelId: testModelIds[2], // model-with-mixed-providers
				providerId: testProviderIds[1], // inactive-provider
				modelName: "test-model-3",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			// Model with active providers but mixed mapping statuses
			{
				id: testMappingIds[4], // mapping-4a
				modelId: testModelIds[3], // model-with-mixed-mapping-statuses
				providerId: testProviderIds[0], // active-provider
				modelName: "test-model-4",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			{
				id: testMappingIds[5], // mapping-4b
				modelId: testModelIds[3], // model-with-mixed-mapping-statuses
				providerId: testProviderIds[2], // active-provider-2
				modelName: "test-model-4-inactive",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "inactive",
			},
			{
				id: testMappingIds[6], // mapping-4c
				modelId: testModelIds[3], // model-with-mixed-mapping-statuses
				providerId: testProviderIds[3], // active-provider-3
				modelName: "test-model-4-deactivated",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "deactivated",
			},
		]);
	});

	afterEach(async () => {
		await cleanupTestData();
	});

	test("GET /internal/models should return only models with active providers by default", async () => {
		const res = await internalModels.request("/models");

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toHaveProperty("models");
		expect(Array.isArray(data.models)).toBe(true);

		// Should only include models with active providers
		// model-with-active-provider: 1 mapping (active provider + active mapping) ✓
		// model-with-inactive-provider: 0 mappings (inactive provider filtered out) ✗
		// model-with-mixed-providers: 1 mapping (only active provider) ✓
		// model-with-mixed-mapping-statuses: 1 mapping (active provider + active mapping) ✓

		// Check that test models are present (don't check absolute count as DB may have other models)
		const modelIds = data.models.map((m: any) => m.id);
		expect(modelIds).toContain(testModelIds[0]); // model-with-active-provider
		expect(modelIds).not.toContain(testModelIds[1]); // model-with-inactive-provider
		expect(modelIds).toContain(testModelIds[2]); // model-with-mixed-providers
		expect(modelIds).toContain(testModelIds[3]); // model-with-mixed-mapping-statuses
	});

	test("GET /internal/models should filter out mappings with inactive providers", async () => {
		const res = await internalModels.request("/models");

		expect(res.status).toBe(200);
		const data = await res.json();

		// Find model with mixed providers
		const mixedModel = data.models.find(
			(m: any) => m.id === testModelIds[2], // model-with-mixed-providers
		);

		expect(mixedModel).toBeDefined();
		expect(mixedModel.mappings.length).toBe(1); // Only active provider mapping
		expect(mixedModel.mappings[0].providerInfo.id).toBe(testProviderIds[0]); // active-provider
		expect(mixedModel.mappings[0].providerInfo.status).toBe("active");
	});

	test("GET /internal/models should filter out mappings with inactive/deactivated status", async () => {
		const res = await internalModels.request("/models");

		expect(res.status).toBe(200);
		const data = await res.json();

		// Find model with mixed mapping statuses
		const mixedStatusModel = data.models.find(
			(m: any) => m.id === testModelIds[3], // model-with-mixed-mapping-statuses
		);

		expect(mixedStatusModel).toBeDefined();
		expect(mixedStatusModel.mappings.length).toBe(1); // Only active mapping
		expect(mixedStatusModel.mappings[0].status).toBe("active");
		expect(mixedStatusModel.mappings[0].modelName).toBe("test-model-4");
	});

	test("GET /internal/models with includeAll=true should return all models and mappings", async () => {
		const res = await internalModels.request("/models?includeAll=true");

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toHaveProperty("models");
		expect(Array.isArray(data.models)).toBe(true);

		// Should include all test models (don't check absolute count as DB may have other models)
		const modelIds = data.models.map((m: any) => m.id);
		expect(modelIds).toContain(testModelIds[0]); // model-with-active-provider
		expect(modelIds).toContain(testModelIds[1]); // model-with-inactive-provider
		expect(modelIds).toContain(testModelIds[2]); // model-with-mixed-providers
		expect(modelIds).toContain(testModelIds[3]); // model-with-mixed-mapping-statuses

		// Check that inactive provider mappings are included
		const mixedModel = data.models.find(
			(m: any) => m.id === testModelIds[2], // model-with-mixed-providers
		);
		expect(mixedModel.mappings.length).toBe(2); // Both active and inactive providers

		// Check that all mapping statuses are included
		const mixedStatusModel = data.models.find(
			(m: any) => m.id === testModelIds[3], // model-with-mixed-mapping-statuses
		);
		expect(mixedStatusModel.mappings.length).toBe(3); // All statuses
		const statuses = mixedStatusModel.mappings.map((m: any) => m.status);
		expect(statuses).toContain("active");
		expect(statuses).toContain("inactive");
		expect(statuses).toContain("deactivated");
	});

	test("GET /internal/models should include providerInfo with each mapping", async () => {
		const res = await internalModels.request("/models");

		expect(res.status).toBe(200);
		const data = await res.json();

		const model = data.models[0];
		expect(model.mappings.length).toBeGreaterThan(0);

		const mapping = model.mappings[0];
		expect(mapping).toHaveProperty("providerInfo");
		expect(mapping.providerInfo).toHaveProperty("id");
		expect(mapping.providerInfo).toHaveProperty("name");
		expect(mapping.providerInfo).toHaveProperty("status");
		expect(mapping.providerInfo.status).toBe("active");
	});

	test("GET /internal/models should support status filter parameter", async () => {
		const res = await internalModels.request("/models?status=inactive");

		expect(res.status).toBe(200);
		const data = await res.json();

		// Should filter by mapping status = inactive
		// Only model-with-mixed-mapping-statuses has inactive mappings
		// But those mappings have active provider, so they won't be filtered out by provider status
		// However, the model itself won't appear because we filter out models without any mappings
		// after filtering by inactive provider status

		// Actually, with status=inactive:
		// - We filter mappings to only show status='inactive'
		// - Then we filter out mappings with inactive providers (unless includeAll)
		// - model-with-mixed-mapping-statuses has 1 inactive mapping with active provider

		// Check that our test model with inactive mapping is present
		const testModel = data.models.find(
			(m: any) => m.id === testModelIds[3], // model-with-mixed-mapping-statuses
		);
		expect(testModel).toBeDefined();
		expect(testModel.mappings.length).toBe(1);
		expect(testModel.mappings[0].status).toBe("inactive");
	});

	test("GET /internal/models should support search parameter", async () => {
		const res = await internalModels.request(
			`/models?search=${testModelIds[3]}`, // Search for model-with-mixed-mapping-statuses
		);

		expect(res.status).toBe(200);
		const data = await res.json();

		// Check that our test model is found
		const testModel = data.models.find(
			(m: any) => m.id === testModelIds[3], // model-with-mixed-mapping-statuses
		);
		expect(testModel).toBeDefined();
	});

	test("GET /internal/models should support family filter parameter", async () => {
		// Add a model with different family
		await db.insert(tables.model).values({
			id: testModelIds[4], // model-other-family
			name: "Other Family Model",
			description: "Test model",
			family: "other",
		});

		await db.insert(tables.modelProviderMapping).values({
			id: testMappingIds[7], // mapping-other
			modelId: testModelIds[4], // model-other-family
			providerId: testProviderIds[0], // active-provider
			modelName: "other-model",
			inputPrice: 0.01,
			outputPrice: 0.02,
			streaming: true,
			status: "active",
		});

		const res = await internalModels.request("/models?family=other");

		expect(res.status).toBe(200);
		const data = await res.json();

		// Check that our test model is present
		const testModel = data.models.find(
			(m: any) => m.id === testModelIds[4], // model-other-family
		);
		expect(testModel).toBeDefined();
		expect(testModel.family).toBe("other");

		// Cleanup happens in afterEach, no need for manual cleanup
	});

	test("GET /internal/providers should return only active providers by default", async () => {
		const res = await internalModels.request("/providers");

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toHaveProperty("providers");
		expect(Array.isArray(data.providers)).toBe(true);

		// Check that test providers are present (don't check absolute count as DB may have other providers)
		const providerIds = data.providers.map((p: any) => p.id);
		expect(providerIds).toContain(testProviderIds[0]); // active-provider
		expect(providerIds).toContain(testProviderIds[2]); // active-provider-2
		expect(providerIds).toContain(testProviderIds[3]); // active-provider-3
		expect(providerIds).not.toContain(testProviderIds[1]); // inactive-provider should not be in results

		// All test providers should be active
		const testProviders = data.providers.filter((p: any) =>
			testProviderIds.includes(p.id),
		);
		testProviders.forEach((provider: any) => {
			if (provider.id !== testProviderIds[1]) {
				// Skip inactive provider
				expect(provider.status).toBe("active");
			}
		});
	});

	test("GET /internal/providers with includeAll=true should return all providers", async () => {
		const res = await internalModels.request("/providers?includeAll=true");

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toHaveProperty("providers");
		expect(Array.isArray(data.providers)).toBe(true);

		// Check that all test providers are present (don't check absolute count as DB may have other providers)
		const providerIds = data.providers.map((p: any) => p.id);
		expect(providerIds).toContain(testProviderIds[0]); // active-provider
		expect(providerIds).toContain(testProviderIds[1]); // inactive-provider
		expect(providerIds).toContain(testProviderIds[2]); // active-provider-2
		expect(providerIds).toContain(testProviderIds[3]); // active-provider-3

		const activeProvider = data.providers.find(
			(p: any) => p.id === testProviderIds[0], // active-provider
		);
		const inactiveProvider = data.providers.find(
			(p: any) => p.id === testProviderIds[1], // inactive-provider
		);

		expect(activeProvider).toBeDefined();
		expect(inactiveProvider).toBeDefined();
		expect(activeProvider.status).toBe("active");
		expect(inactiveProvider.status).toBe("inactive");
	});

	test("GET /internal/models should not return models without any mappings after filtering", async () => {
		const res = await internalModels.request("/models");

		expect(res.status).toBe(200);
		const data = await res.json();

		// model-with-inactive-provider should not be in the results
		// because its only mapping has an inactive provider
		const modelWithInactiveProvider = data.models.find(
			(m: any) => m.id === testModelIds[1], // model-with-inactive-provider
		);

		expect(modelWithInactiveProvider).toBeUndefined();
	});
});
