import { describe, it, expect } from "vitest";

import { getUniqueModelEntries } from "./model-helpers";

import type { ModelDefinition, ProviderDefinition } from "@llmgateway/models";

const mockProviders: ProviderDefinition[] = [
	{
		id: "openai",
		name: "OpenAI",
		description: "OpenAI",
		env: { required: {} },
		streaming: true,
		cancellation: true,
	},
	{
		id: "anthropic",
		name: "Anthropic",
		description: "Anthropic",
		env: { required: {} },
		streaming: true,
		cancellation: true,
	},
];

describe("getUniqueModelEntries", () => {
	it("should filter out custom models", () => {
		const models: ModelDefinition[] = [
			{
				id: "custom",
				name: "Custom Model",
				family: "custom",
				providers: [],
			},
		];
		const result = getUniqueModelEntries(models, mockProviders);
		expect(result).toHaveLength(0);
	});

	it("should filter out deactivated mappings", () => {
		const now = new Date("2024-01-01T00:00:00Z");
		const models: ModelDefinition[] = [
			{
				id: "gpt-4",
				name: "GPT-4",
				family: "gpt",
				providers: [
					{
						providerId: "openai",
						modelName: "gpt-4",
						deactivatedAt: new Date("2023-12-31T23:59:59Z"), // Deactivated in the past
						streaming: true,
					},
				],
			},
		];
		const result = getUniqueModelEntries(models, mockProviders, now);
		expect(result).toHaveLength(0);
	});

	it("should include active mappings", () => {
		const now = new Date("2024-01-01T00:00:00Z");
		const models: ModelDefinition[] = [
			{
				id: "gpt-4",
				name: "GPT-4",
				family: "gpt",
				providers: [
					{
						providerId: "openai",
						modelName: "gpt-4",
						// No deactivatedAt
						streaming: true,
					},
				],
			},
		];
		const result = getUniqueModelEntries(models, mockProviders, now);
		expect(result).toHaveLength(1);
		expect(result[0].mapping.providerId).toBe("openai");
	});

	it("should deduplicate by providerId, preferring non-deprecated mappings", () => {
		const now = new Date("2024-01-01T00:00:00Z");
		const models: ModelDefinition[] = [
			{
				id: "gpt-4",
				name: "GPT-4",
				family: "gpt",
				providers: [
					{
						providerId: "openai",
						modelName: "gpt-4-deprecated",
						deprecatedAt: new Date("2023-12-31T23:59:59Z"), // Deprecated
						streaming: true,
					},
					{
						providerId: "openai",
						modelName: "gpt-4-active",
						// Active
						streaming: true,
					},
				],
			},
		];
		const result = getUniqueModelEntries(models, mockProviders, now);
		// Should only have 1 entry for duplicate provider
		expect(result).toHaveLength(1);
		// Should be the active one
		expect(result[0].mapping.modelName).toBe("gpt-4-active");
	});

	it("should preserve deprecated mapping if it is the only one", () => {
		const now = new Date("2024-01-01T00:00:00Z");
		const models: ModelDefinition[] = [
			{
				id: "gpt-4",
				name: "GPT-4",
				family: "gpt",
				providers: [
					{
						providerId: "openai",
						modelName: "gpt-4-deprecated",
						deprecatedAt: new Date("2023-12-31T23:59:59Z"), // Deprecated
						streaming: true,
					},
				],
			},
		];
		const result = getUniqueModelEntries(models, mockProviders, now);
		expect(result).toHaveLength(1);
		expect(result[0].mapping.modelName).toBe("gpt-4-deprecated");
	});

	it("should handle multiple providers for same model", () => {
		const models: ModelDefinition[] = [
			{
				id: "gpt-4",
				name: "GPT-4",
				family: "gpt",
				providers: [
					{ providerId: "openai", modelName: "gpt-4", streaming: true },
					{
						providerId: "anthropic",
						modelName: "gpt-4-claude",
						streaming: true,
					},
				],
			},
		];
		const result = getUniqueModelEntries(models, mockProviders);
		expect(result).toHaveLength(2);
		const providers = result.map((r) => r.mapping.providerId).sort();
		expect(providers).toEqual(["anthropic", "openai"]);
	});
});
