import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const internalModels = new OpenAPIHono<ServerTypes>();

// Helper to convert null to undefined for optional fields
const nullableToOptional = <T extends z.ZodTypeAny>(schema: T) =>
	schema.nullable().transform((v) => v ?? undefined);

// Provider schema
const providerSchema = z.object({
	id: z.string(),
	createdAt: z.coerce.date(),
	name: nullableToOptional(z.string()),
	description: nullableToOptional(z.string()),
	streaming: nullableToOptional(z.boolean()),
	cancellation: nullableToOptional(z.boolean()),
	color: nullableToOptional(z.string()),
	website: nullableToOptional(z.string()),
	announcement: nullableToOptional(z.string()),
	status: z.enum(["active", "inactive"]),
});

// Pricing tier schema
const pricingTierSchema = z.object({
	name: z.string(),
	upToTokens: nullableToOptional(z.number()),
	inputPrice: z.number(),
	outputPrice: z.number(),
});

// Model provider mapping schema
const modelProviderMappingSchema = z.object({
	id: z.string(),
	createdAt: z.coerce.date(),
	modelId: z.string(),
	providerId: z.string(),
	modelName: z.string(),
	inputPrice: nullableToOptional(z.number()),
	outputPrice: nullableToOptional(z.number()),
	cachedInputPrice: nullableToOptional(z.number()),
	imageInputPrice: nullableToOptional(z.number()),
	requestPrice: nullableToOptional(z.number()),
	contextSize: nullableToOptional(z.number()),
	maxOutput: nullableToOptional(z.number()),
	streaming: z.boolean(),
	vision: nullableToOptional(z.boolean()),
	reasoning: nullableToOptional(z.boolean()),
	reasoningOutput: nullableToOptional(z.string()),
	reasoningLevels: nullableToOptional(
		z.array(z.enum(["minimal", "low", "medium", "high"])),
	),
	tools: nullableToOptional(z.boolean()),
	jsonOutput: nullableToOptional(z.boolean()),
	jsonOutputSchema: nullableToOptional(z.boolean()),
	webSearch: nullableToOptional(z.boolean()),
	webSearchPrice: nullableToOptional(z.number()),
	discount: nullableToOptional(z.number()),
	pricingTiers: nullableToOptional(z.array(pricingTierSchema)),
	stability: nullableToOptional(
		z.enum(["stable", "beta", "unstable", "experimental"]),
	),
	supportedParameters: nullableToOptional(z.array(z.string())),
	deprecatedAt: nullableToOptional(z.coerce.date()),
	deactivatedAt: nullableToOptional(z.coerce.date()),
	deactivationReason: nullableToOptional(z.string()),
	status: z.enum(["active", "inactive", "deactivated"]),
	providerInfo: nullableToOptional(providerSchema),
});

// Model schema with mappings
const modelSchema = z.object({
	id: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
	releasedAt: nullableToOptional(z.coerce.date()),
	name: nullableToOptional(z.string()),
	aliases: nullableToOptional(z.array(z.string())),
	description: nullableToOptional(z.string()),
	family: z.string(),
	free: nullableToOptional(z.boolean()),
	output: nullableToOptional(z.array(z.string())),
	stability: nullableToOptional(
		z.enum(["stable", "beta", "unstable", "experimental"]),
	),
	status: z.enum(["active", "inactive"]),
	mappings: z.array(modelProviderMappingSchema),
});

// GET /internal/models - Returns models with mappings sorted by createdAt desc
const getModelsRoute = createRoute({
	operationId: "internal_get_models",
	summary: "Get all models",
	description:
		"Returns all models with their provider mappings with optional filtering, search and sorting",
	method: "get",
	path: "/models",
	request: {
		query: z.object({
			status: z
				.enum(["active", "inactive", "deactivated"])
				.optional()
				.openapi({ example: "active" }),
			search: z.string().optional().openapi({ example: "gpt" }),
			family: z.string().optional().openapi({ example: "openai" }),
			sort: z
				.enum(["name", "family", "status", "createdAt", "updatedAt"])
				.optional()
				.default("createdAt")
				.openapi({ example: "name" }),
			order: z
				.enum(["asc", "desc"])
				.optional()
				.default("desc")
				.openapi({ example: "asc" }),
			includeAll: z
				.string()
				.optional()
				.transform((val) => val === "true")
				.describe("Include all mapping statuses (for admin)")
				.openapi({ example: "false" }),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						models: z.array(modelSchema),
					}),
				},
			},
			description: "List of all models with their provider mappings",
		},
	},
});

internalModels.openapi(getModelsRoute, async (c) => {
	const query = c.req.valid("query");
	const {
		status,
		search,
		family,
		sort = "createdAt",
		order = "desc",
		includeAll = false,
	} = query;

	// Build where conditions using object syntax
	const whereConditions: any = {};

	if (family) {
		whereConditions.family = { eq: family };
	}

	// Note: search functionality requires SQL operators not supported by query API object syntax
	// For now we'll filter in memory, or consider using core API for this endpoint
	const [initialModels, providers] = await Promise.all([
		db.query.model.findMany({
			where:
				Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
			with: {
				modelProviderMappings: true,
			},
			orderBy: {
				[sort]: order,
			},
		}),
		db.query.provider.findMany({
			where: {
				status: { eq: "active" },
			},
		}),
	]);

	let models = initialModels;

	// Apply search filter in memory if needed
	if (search) {
		const searchLower = search.toLowerCase();
		models = models.filter(
			(model) =>
				model.id.toLowerCase().includes(searchLower) ||
				model.name?.toLowerCase().includes(searchLower),
		);
	}

	// Enrich with data from models package (e.g., reasoningLevels) and filter mappings
	const transformedModels = models
		.map((model) => {
			// Filter mappings
			const filteredMappings = model.modelProviderMappings.filter((mapping) => {
				// If specific status is provided, filter by it
				if (status) {
					return mapping.status === status;
				}
				// If includeAll=true (for admin panel), show all
				if (includeAll) {
					return true;
				}
				// By default, show only active mappings (for regular requests)
				return mapping.status === "active";
			});

			// Exclude modelProviderMappings from spread and add mappings instead
			const { modelProviderMappings: _modelProviderMappings, ...modelRest } =
				model;

			return {
				...modelRest,
				mappings: filteredMappings.map((mapping) => {
					// Find corresponding package mapping to enrich with static data

					// Find provider info from DB
					const providerInfo = providers.find(
						(p) => p.id === mapping.providerId,
					);

					return {
						...mapping,
						providerInfo,
					};
				}),
			};
		})
		.filter((model) => model.mappings.length > 0); // Don't return models without mappings

	const result = z.array(modelSchema).safeParse(transformedModels);

	if (!result.success) {
		throw new HTTPException(500, {
			message: "Model schema validation failed",
		});
	}

	return c.json({ models: result.data });
});

// GET /internal/providers - Returns providers sorted by createdAt desc
const getProvidersRoute = createRoute({
	operationId: "internal_get_providers",
	summary: "Get all providers",
	description: "Returns all providers, sorted by createdAt descending",
	method: "get",
	path: "/providers",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						providers: z.array(providerSchema),
					}),
				},
			},
			description: "List of all providers",
		},
	},
});

internalModels.openapi(getProvidersRoute, async (c) => {
	const providers = await db.query.provider.findMany({
		where: {
			status: { eq: "active" },
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	// Parse through Zod schema to apply transformations (null -> undefined)
	const parsedProviders = z.array(providerSchema).parse(providers);

	return c.json({ providers: parsedProviders });
});
