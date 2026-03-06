import { drizzle } from "drizzle-orm/node-postgres";
import { withReplicas } from "drizzle-orm/pg-core";
import { Pool } from "pg";

import { redisClient } from "@llmgateway/cache";
import { logger } from "@llmgateway/logger";

import { RedisCache } from "./redis-cache.js";
import { relations } from "./relations.js";

const cachedPool = new Pool({
	connectionString:
		process.env.DATABASE_URL || "postgres://postgres:pw@localhost:5432/db",
});

const primaryCdb = drizzle({
	client: cachedPool,
	casing: "snake_case",
	relations,
	cache: new RedisCache(redisClient),
});

const replicaCachedPool = process.env.DATABASE_READ_URL
	? new Pool({ connectionString: process.env.DATABASE_READ_URL })
	: null;

export const cdb = replicaCachedPool
	? withReplicas(primaryCdb, [
			drizzle({
				client: replicaCachedPool,
				casing: "snake_case",
				relations,
				cache: new RedisCache(redisClient),
			}),
		])
	: primaryCdb;

export async function closeCachedDatabase(): Promise<void> {
	try {
		await cachedPool.end();
		if (replicaCachedPool) {
			await replicaCachedPool.end();
		}
		logger.info("Cached database connection pool closed");
	} catch (error) {
		logger.error(
			"Error closing cached database connection pool",
			error instanceof Error ? error : new Error(String(error)),
		);
		throw error;
	}
}
