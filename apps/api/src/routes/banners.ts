import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { db } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const banners = new OpenAPIHono<ServerTypes>();

const bannerSchema = z.object({
	id: z.string(),
	bannerId: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	enabled: z.boolean(),
});

const getBannersRoute = createRoute({
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

const getBannerRoute = createRoute({
	method: "get",
	path: "/{bannerId}",
	request: {
		params: z.object({
			bannerId: z.string().openapi({ example: "banner-id" }),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						banner: bannerSchema.openapi({}),
					}),
				},
			},
			description: "Get banner by bannerId",
		},
		401: { description: "Unauthorized" },
	},
});

banners.openapi(getBannersRoute, async (c) => {
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
	});

	return c.json({
		banners,
	});
});

banners.openapi(getBannerRoute, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { bannerId } = c.req.valid("param");

	const banner = await db.query.banner.findFirst({
		where: {
			bannerId: {
				eq: bannerId,
			},
			enabled: {
				eq: true,
			},
		},
	});

	return c.json({
		banner,
	});
});
