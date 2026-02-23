import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { db } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const banners = new OpenAPIHono<ServerTypes>();

const bannerSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	enabled: z.boolean(),
	type: z.string(),
	priority: z.number(),
});

const getBanners = createRoute({
	method: "get",
	path: "/",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						banners: z.array(bannerSchema).openapi({}),
					}),
				},
			},
			description: "List of all banners",
		},
		401: { description: "Unauthorized" },
	},
});

banners.openapi(getBanners, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const banners = await db.query.banner.findMany({
		where: {
			enabled: {
				eq: true,
			},
		},
		orderBy: (banner, { desc }) => [desc(banner.priority)],
	});

	return c.json({
		banners,
	});
});
