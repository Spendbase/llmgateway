import { instrumentDrizzle } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { withReplicas } from "drizzle-orm/pg-core";
import { Pool } from "pg";

import { logger } from "@llmgateway/logger";

import { relations } from "./relations.js";

const otelConfig = {
	dbSystem: "postgresql",
	dbName: "llmgateway",
	captureQueryText: true,
	maxQueryTextLength: 5000,
} as const;

const pool = new Pool({
	connectionString:
		process.env.DATABASE_URL || "postgres://postgres:pw@localhost:5432/db",
});

const instrumentedPool = instrumentDrizzle(pool, otelConfig);

export const primaryDb = drizzle({
	client: instrumentedPool,
	casing: "snake_case",
	relations,
});

const replicaPool = process.env.DATABASE_READ_URL
	? new Pool({ connectionString: process.env.DATABASE_READ_URL })
	: null;

export const db = replicaPool
	? withReplicas(primaryDb, [
			drizzle({
				client: instrumentDrizzle(replicaPool, otelConfig),
				casing: "snake_case",
				relations,
			}),
		])
	: primaryDb;

export async function closeDatabase(): Promise<void> {
	try {
		await pool.end();
		if (replicaPool) {
			await replicaPool.end();
		}
		logger.info("Database connection pool closed");
	} catch (error) {
		logger.error(
			"Error closing database connection pool",
			error instanceof Error ? error : new Error(String(error)),
		);
		throw error;
	}
}
