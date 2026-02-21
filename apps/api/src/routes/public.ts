import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { PublicStatsService } from "@/services/public-stats.service.js";

import type { ServerTypes } from "@/vars.js";

export const publicRoutes = new OpenAPIHono<ServerTypes>();

const rankingsQuerySchema = z.object({
	period: z.enum(["24h", "7d", "30d"]).default("7d").openapi({
		description: "Time period for statistics",
		default: "7d",
	}),
	limit: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val, 10) : 50))
		.pipe(z.number().int().min(1).max(200))
		.openapi({
			description: "Number of rankings to return (max 200)",
			type: "integer",
			default: "50",
		}),
	groupBy: z.enum(["model", "modelProvider"]).default("modelProvider").openapi({
		description: "Grouping criteria",
		default: "modelProvider",
	}),
	providerId: z.string().optional().openapi({
		description: "Filter by specific provider ID",
	}),
	modelId: z.string().optional().openapi({
		description: "Filter by specific model ID",
	}),
});

const rankingsResponseSchema = z.object({
	period: z.enum(["24h", "7d", "30d"]),
	groupBy: z.enum(["model", "modelProvider"]),
	limit: z.number(),
	generatedAt: z.string(),
	data: z.array(
		z.object({
			rank: z.number(),
			modelId: z.string(),
			modelName: z.string(),
			providerId: z.string().optional(),
			providerName: z.string().optional(),
			totalTokens: z.number(),
			inputTokens: z.number(),
			outputTokens: z.number(),
			requestCount: z.number(),
			errorCount: z.number(),
			usagePercent: z.number(),
			avgLatencyMs: z.number(),
			avgTtftMs: z.number(),
			errorRate: z.number(),
			estimatedCost: z.number().optional(),
		}),
	),
});

const getRankings = createRoute({
	method: "get",
	path: "/rankings",
	request: {
		query: rankingsQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: rankingsResponseSchema,
				},
			},
			description: "Public rankings of models and providers",
		},
		400: {
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
			description:
				"Validation failures for query params (invalid period, out-of-range limit, etc.)",
		},
		500: {
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
			description: "Internal Server Error",
		},
	},
});

publicRoutes.openapi(getRankings, async (c) => {
	const query = c.req.valid("query");

	const result = await PublicStatsService.getRankings({
		period: query.period,
		limit: query.limit,
		groupBy: query.groupBy,
		providerId: query.providerId,
		modelId: query.modelId,
	});

	return c.json(result, 200);
});
