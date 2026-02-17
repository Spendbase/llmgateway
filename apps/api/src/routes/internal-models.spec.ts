import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { db, eq, tables } from "@llmgateway/db";

import { internalModels } from "./internal-models.js";

describe("internal-models endpoint", () => {
	beforeEach(async () => {
		// Insert providers with different statuses
		await db.insert(tables.provider).values([
			{
				id: "active-provider",
				name: "Active Provider",
				description: "Test active provider",
				status: "active",
			},
			{
				id: "inactive-provider",
				name: "Inactive Provider",
				description: "Test inactive provider",
				status: "inactive",
			},
			{
				id: "active-provider-2",
				name: "Active Provider 2",
				description: "Test active provider 2",
				status: "active",
			},
			{
				id: "active-provider-3",
				name: "Active Provider 3",
				description: "Test active provider 3",
				status: "active",
			},
		]);

		// Insert models
		await db.insert(tables.model).values([
			{
				id: "model-with-active-provider",
				name: "Model with Active Provider",
				description: "Test model",
				family: "test",
			},
			{
				id: "model-with-inactive-provider",
				name: "Model with Inactive Provider",
				description: "Test model",
				family: "test",
			},
			{
				id: "model-with-mixed-providers",
				name: "Model with Mixed Providers",
				description: "Test model",
				family: "test",
			},
			{
				id: "model-with-mixed-mapping-statuses",
				name: "Model with Mixed Mapping Statuses",
				description: "Test model",
				family: "test",
			},
		]);

		// Insert model provider mappings with different statuses
		await db.insert(tables.modelProviderMapping).values([
			// Model with only active provider and active mapping
			{
				id: "mapping-1",
				modelId: "model-with-active-provider",
				providerId: "active-provider",
				modelName: "test-model-1",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			// Model with only inactive provider and active mapping
			{
				id: "mapping-2",
				modelId: "model-with-inactive-provider",
				providerId: "inactive-provider",
				modelName: "test-model-2",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			// Model with both active and inactive providers
			{
				id: "mapping-3a",
				modelId: "model-with-mixed-providers",
				providerId: "active-provider",
				modelName: "test-model-3",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			{
				id: "mapping-3b",
				modelId: "model-with-mixed-providers",
				providerId: "inactive-provider",
				modelName: "test-model-3",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			// Model with active providers but mixed mapping statuses
			{
				id: "mapping-4a",
				modelId: "model-with-mixed-mapping-statuses",
				providerId: "active-provider",
				modelName: "test-model-4",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "active",
			},
			{
				id: "mapping-4b",
				modelId: "model-with-mixed-mapping-statuses",
				providerId: "active-provider-2",
				modelName: "test-model-4-inactive",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "inactive",
			},
			{
				id: "mapping-4c",
				modelId: "model-with-mixed-mapping-statuses",
				providerId: "active-provider-3",
				modelName: "test-model-4-deactivated",
				inputPrice: 0.01,
				outputPrice: 0.02,
				streaming: true,
				status: "deactivated",
			},
		]);
	});

	afterEach(async () => {
		await db.delete(tables.modelProviderMapping);
		await db.delete(tables.model);
		await db.delete(tables.provider);
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
		expect(data.models.length).toBe(3);

		const modelIds = data.models.map((m: any) => m.id);
		expect(modelIds).toContain("model-with-active-provider");
		expect(modelIds).not.toContain("model-with-inactive-provider");
		expect(modelIds).toContain("model-with-mixed-providers");
		expect(modelIds).toContain("model-with-mixed-mapping-statuses");
	});

	test("GET /internal/models should filter out mappings with inactive providers", async () => {
		const res = await internalModels.request("/models");

		expect(res.status).toBe(200);
		const data = await res.json();

		// Find model with mixed providers
		const mixedModel = data.models.find(
			(m: any) => m.id === "model-with-mixed-providers",
		);

		expect(mixedModel).toBeDefined();
		expect(mixedModel.mappings.length).toBe(1); // Only active provider mapping
		expect(mixedModel.mappings[0].providerInfo.id).toBe("active-provider");
		expect(mixedModel.mappings[0].providerInfo.status).toBe("active");
	});

	test("GET /internal/models should filter out mappings with inactive/deactivated status", async () => {
		const res = await internalModels.request("/models");

		expect(res.status).toBe(200);
		const data = await res.json();

		// Find model with mixed mapping statuses
		const mixedStatusModel = data.models.find(
			(m: any) => m.id === "model-with-mixed-mapping-statuses",
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

		// Should include all models
		expect(data.models.length).toBe(4);

		const modelIds = data.models.map((m: any) => m.id);
		expect(modelIds).toContain("model-with-active-provider");
		expect(modelIds).toContain("model-with-inactive-provider");
		expect(modelIds).toContain("model-with-mixed-providers");
		expect(modelIds).toContain("model-with-mixed-mapping-statuses");

		// Check that inactive provider mappings are included
		const mixedModel = data.models.find(
			(m: any) => m.id === "model-with-mixed-providers",
		);
		expect(mixedModel.mappings.length).toBe(2); // Both active and inactive providers

		// Check that all mapping statuses are included
		const mixedStatusModel = data.models.find(
			(m: any) => m.id === "model-with-mixed-mapping-statuses",
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
		expect(data.models.length).toBe(1);
		expect(data.models[0].id).toBe("model-with-mixed-mapping-statuses");
		expect(data.models[0].mappings.length).toBe(1);
		expect(data.models[0].mappings[0].status).toBe("inactive");
	});

	test("GET /internal/models should support search parameter", async () => {
		const res = await internalModels.request(
			"/models?search=mixed-mapping-statuses",
		);

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.models.length).toBe(1);
		expect(data.models[0].id).toBe("model-with-mixed-mapping-statuses");
	});

	test("GET /internal/models should support family filter parameter", async () => {
		// Add a model with different family
		await db.insert(tables.model).values({
			id: "model-other-family",
			name: "Other Family Model",
			description: "Test model",
			family: "other",
		});

		await db.insert(tables.modelProviderMapping).values({
			id: "mapping-other",
			modelId: "model-other-family",
			providerId: "active-provider",
			modelName: "other-model",
			inputPrice: 0.01,
			outputPrice: 0.02,
			streaming: true,
			status: "active",
		});

		const res = await internalModels.request("/models?family=other");

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data.models.length).toBe(1);
		expect(data.models[0].id).toBe("model-other-family");
		expect(data.models[0].family).toBe("other");

		// Cleanup
		await db
			.delete(tables.modelProviderMapping)
			.where(eq(tables.modelProviderMapping.id, "mapping-other"));
		await db
			.delete(tables.model)
			.where(eq(tables.model.id, "model-other-family"));
	});

	test("GET /internal/providers should return only active providers by default", async () => {
		const res = await internalModels.request("/providers");

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toHaveProperty("providers");
		expect(Array.isArray(data.providers)).toBe(true);
		expect(data.providers.length).toBe(3); // active, active-2, active-3

		const providerIds = data.providers.map((p: any) => p.id);
		expect(providerIds).toContain("active-provider");
		expect(providerIds).toContain("active-provider-2");
		expect(providerIds).toContain("active-provider-3");

		// All should be active
		data.providers.forEach((provider: any) => {
			expect(provider.status).toBe("active");
		});
	});

	test("GET /internal/providers with includeAll=true should return all providers", async () => {
		const res = await internalModels.request("/providers?includeAll=true");

		expect(res.status).toBe(200);
		const data = await res.json();

		expect(data).toHaveProperty("providers");
		expect(Array.isArray(data.providers)).toBe(true);
		expect(data.providers.length).toBe(4); // active, inactive, active-2, active-3

		const providerIds = data.providers.map((p: any) => p.id);
		expect(providerIds).toContain("active-provider");
		expect(providerIds).toContain("inactive-provider");
		expect(providerIds).toContain("active-provider-2");
		expect(providerIds).toContain("active-provider-3");

		const activeProvider = data.providers.find(
			(p: any) => p.id === "active-provider",
		);
		const inactiveProvider = data.providers.find(
			(p: any) => p.id === "inactive-provider",
		);

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
			(m: any) => m.id === "model-with-inactive-provider",
		);

		expect(modelWithInactiveProvider).toBeUndefined();
	});
});
