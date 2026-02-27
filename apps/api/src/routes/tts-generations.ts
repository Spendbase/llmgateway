import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import { db, tables, desc, eq, and, lt } from "@llmgateway/db";
import { StorageService } from "@llmgateway/storage";

import type { ServerTypes } from "@/vars.js";

const ttsGenerations = new OpenAPIHono<ServerTypes>();

const ttsGenerationSchema = z.object({
	id: z.string(),
	model: z.string(),
	voice: z.string(),
	format: z.string(),
	text: z.string(),
	chars: z.number().nullable(),
	cost: z.number().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

const createTtsGenerationSchema = z.object({
	model: z.string().min(1),
	voice: z.string().min(1),
	format: z.string().min(1),
	text: z.string().min(1),
	chars: z.number().optional(),
	cost: z.number().optional(),
	file: z.string().min(1),
});

const listTtsGenerations = createRoute({
	method: "get",
	path: "/",
	request: {
		query: z.object({
			limit: z.coerce.number().min(1).max(50).optional().default(10),
			cursor: z.string().datetime().optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						generations: z.array(ttsGenerationSchema),
						hasMore: z.boolean(),
						nextCursor: z.string().datetime().nullable(),
					}),
				},
			},
			description: "List of TTS generations (metadata only, no audio)",
		},
	},
});

ttsGenerations.openapi(listTtsGenerations, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	const { limit, cursor } = c.req.valid("query");

	const conditions = [eq(tables.ttsGeneration.userId, user.id)];
	if (cursor) {
		conditions.push(lt(tables.ttsGeneration.createdAt, new Date(cursor)));
	}

	const rows = await db
		.select({
			id: tables.ttsGeneration.id,
			model: tables.ttsGeneration.model,
			voice: tables.ttsGeneration.voice,
			format: tables.ttsGeneration.format,
			text: tables.ttsGeneration.text,
			chars: tables.ttsGeneration.chars,
			cost: tables.ttsGeneration.cost,
			createdAt: tables.ttsGeneration.createdAt,
			updatedAt: tables.ttsGeneration.updatedAt,
		})
		.from(tables.ttsGeneration)
		.where(and(...conditions))
		.orderBy(desc(tables.ttsGeneration.createdAt))
		.limit(limit + 1);

	const hasMore = rows.length > limit;
	const items = hasMore ? rows.slice(0, limit) : rows;
	const nextCursor = hasMore
		? items[items.length - 1].createdAt.toISOString()
		: null;

	return c.json({
		generations: items.map((r) => ({
			id: r.id,
			model: r.model,
			voice: r.voice,
			format: r.format,
			text: r.text,
			chars: r.chars,
			cost: r.cost ?? null,
			createdAt: r.createdAt.toISOString(),
			updatedAt: r.updatedAt.toISOString(),
		})),
		hasMore,
		nextCursor,
	});
});

const createTtsGeneration = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createTtsGenerationSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: z.object({
						generation: ttsGenerationSchema,
					}),
				},
			},
			description: "TTS generation created",
		},
	},
});

ttsGenerations.openapi(createTtsGeneration, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	const body = c.req.valid("json");

	const [row] = await db
		.insert(tables.ttsGeneration)
		.values({
			userId: user.id,
			model: body.model,
			voice: body.voice,
			format: body.format,
			text: body.text,
			chars: body.chars ?? null,
			cost: body.cost ?? null,
			file: body.file,
		})
		.returning();

	return c.json(
		{
			generation: {
				id: row.id,
				model: row.model,
				voice: row.voice,
				format: row.format,
				text: row.text,
				chars: row.chars,
				cost: row.cost ?? null,
				createdAt: row.createdAt.toISOString(),
				updatedAt: row.updatedAt.toISOString(),
			},
		},
		201,
	);
});

const getTtsGenerationAudio = createRoute({
	method: "get",
	path: "/{id}/audio",
	request: {
		params: z.object({ id: z.string() }),
	},
	responses: {
		302: {
			description: "Redirect to pre-signed S3 audio URL",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
			description: "Generation not found",
		},
	},
});

ttsGenerations.openapi(getTtsGenerationAudio, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	const { id } = c.req.valid("param");

	const [row] = await db
		.select({ file: tables.ttsGeneration.file })
		.from(tables.ttsGeneration)
		.where(
			and(
				eq(tables.ttsGeneration.id, id),
				eq(tables.ttsGeneration.userId, user.id),
			),
		);

	if (!row) {
		return c.json({ message: "Generation not found" }, 404);
	}

	const storage = new StorageService();
	const signedUrl = await storage.getSignedUrl(row.file, 3600);

	return c.redirect(signedUrl, 302);
});

const deleteTtsGeneration = createRoute({
	method: "delete",
	path: "/{id}",
	request: {
		params: z.object({ id: z.string() }),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
			description: "Generation deleted",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({ message: z.string() }),
				},
			},
			description: "Generation not found",
		},
	},
});

ttsGenerations.openapi(deleteTtsGeneration, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	const { id } = c.req.valid("param");

	const [row] = await db
		.select({ file: tables.ttsGeneration.file })
		.from(tables.ttsGeneration)
		.where(
			and(
				eq(tables.ttsGeneration.id, id),
				eq(tables.ttsGeneration.userId, user.id),
			),
		);

	if (!row) {
		return c.json({ message: "Generation not found" }, 404);
	}

	const storage = new StorageService();
	await storage.delete(row.file);

	await db.delete(tables.ttsGeneration).where(eq(tables.ttsGeneration.id, id));

	return c.json({ message: "Generation deleted" });
});

export { ttsGenerations };
