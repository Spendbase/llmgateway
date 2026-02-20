import { generateCacheKey, getCache, setCache } from "@llmgateway/cache";
import { and, db, desc, eq, gte, sql, tables } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

export interface RankingsParams {
	period: "24h" | "7d" | "30d";
	limit?: number;
	groupBy: "model" | "modelProvider";
	providerId?: string;
	modelId?: string;
}

export interface RankedItem {
	rank: number;
	modelId: string;
	modelName: string;
	providerId?: string;
	providerName?: string;
	totalTokens: number;
	inputTokens: number;
	outputTokens: number;
	requestCount: number;
	errorCount: number;
	usagePercent: number;
	avgLatencyMs: number;
	avgTtftMs: number;
	errorRate: number;
	estimatedCost?: number;
}

export interface RankingsResponse {
	period: "24h" | "7d" | "30d";
	groupBy: "model" | "modelProvider";
	limit: number;
	generatedAt: string;
	data: RankedItem[];
}

export class PublicStatsService {
	public static async getRankings(
		params: RankingsParams,
	): Promise<RankingsResponse> {
		const { period, limit = 50, groupBy, providerId, modelId } = params;

		// Enforce max limit
		const enforcedLimit = Math.min(limit, 200);

		// A. Generate cache key
		const cacheKey = generateCacheKey({
			type: "public_rankings",
			period,
			limit: enforcedLimit,
			groupBy,
			providerId,
			modelId,
		});

		// B. Check cache first
		try {
			const cached = await getCache(cacheKey);
			if (cached) {
				return cached as RankingsResponse;
			}
		} catch (error) {
			logger.warn("Failed to get cache for public rankings", {
				error,
				cacheKey,
			});
			// Continue to DB path - treat as cache miss
		}

		// C. Compute start timestamp
		let startDate: Date | undefined;
		const now = new Date();
		if (period === "24h") {
			startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		} else if (period === "7d") {
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		} else if (period === "30d") {
			startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		} else {
			// Default to 7d if somehow we get here, though validation should prevent it.
			// Or strictly: since the type is narrowed, we can just assume one of the above matches
			// However, to be safe and satisfy the compiler that startDate is assigned:
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		}

		// D. Build aggregation query
		const historyTable = tables.modelProviderMappingHistory;
		const mappingTable = tables.modelProviderMapping;
		const modelTable = tables.model;
		const providerTable = tables.provider;

		const whereConditions = [];
		if (startDate) {
			whereConditions.push(gte(historyTable.minuteTimestamp, startDate));
		}
		if (providerId) {
			whereConditions.push(eq(mappingTable.providerId, providerId));
		}
		if (modelId) {
			whereConditions.push(eq(mappingTable.modelId, modelId));
		}

		// E. Compute grand total tokens for usage percent
		// We need a separate query for the denominator
		const grandTotalResult = await db
			.select({
				totalTokens: sql<number>`COALESCE(SUM(${historyTable.totalTokens}), 0)`,
			})
			.from(historyTable)
			// Apply filters on mappingTable, so we must join it
			.innerJoin(
				mappingTable,
				eq(historyTable.modelProviderMappingId, mappingTable.id),
			)
			.where(whereConditions.length ? and(...whereConditions) : undefined);

		const grandTotalTokens = Number(grandTotalResult[0]?.totalTokens || 0);

		// Main aggregation query
		const baseColumns = {
			modelId: modelTable.id,
			modelName: modelTable.name,
			totalTokens: sql<number>`SUM(${historyTable.totalTokens})`.mapWith(
				Number,
			),
			inputTokens: sql<number>`SUM(${historyTable.totalInputTokens})`.mapWith(
				Number,
			),
			outputTokens: sql<number>`SUM(${historyTable.totalOutputTokens})`.mapWith(
				Number,
			),
			requestCount: sql<number>`SUM(${historyTable.logsCount})`.mapWith(Number),
			errorCount: sql<number>`SUM(${historyTable.errorsCount})`.mapWith(Number),
			totalDuration: sql<number>`SUM(${historyTable.totalDuration})`.mapWith(
				Number,
			),
			totalTtft:
				sql<number>`SUM(${historyTable.totalTimeToFirstToken})`.mapWith(Number),
		};

		// Define strict types for result rows
		interface BaseResultRow {
			modelId: string;
			modelName: string;
			totalTokens: number;
			inputTokens: number;
			outputTokens: number;
			requestCount: number;
			errorCount: number;
			totalDuration: number;
			totalTtft: number;
		}

		type ProviderResultRow = BaseResultRow & {
			providerId: string;
			providerName: string;
			inputPrice: number | null;
			outputPrice: number | null;
			requestPrice: number | null;
		};

		let results: (BaseResultRow | ProviderResultRow)[];

		if (groupBy === "model") {
			// When grouping by model, we aggregate across all providers.
			// misuse of SUM() on prices is invalid, so we strictly omit price columns.
			// providerId/Name are also omitted.
			results = (await db
				.select(baseColumns)
				.from(historyTable)
				.innerJoin(
					mappingTable,
					eq(historyTable.modelProviderMappingId, mappingTable.id),
				)
				.innerJoin(modelTable, eq(mappingTable.modelId, modelTable.id))
				.where(whereConditions.length ? and(...whereConditions) : undefined)
				.groupBy(modelTable.id, modelTable.name)
				.orderBy(desc(sql`SUM(${historyTable.totalTokens})`))
				.limit(enforcedLimit)) as BaseResultRow[];
		} else {
			// groupBy === "modelProvider"
			// We select provider info and prices (using MAX for prices as they are from mapping table distinct per group)
			const providerColumns = {
				providerId: providerTable.id,
				providerName: providerTable.name,
				inputPrice:
					sql<number>`COALESCE(MAX(${mappingTable.inputPrice}), 0)`.mapWith(
						Number,
					),
				outputPrice:
					sql<number>`COALESCE(MAX(${mappingTable.outputPrice}), 0)`.mapWith(
						Number,
					),
				requestPrice:
					sql<number>`COALESCE(MAX(${mappingTable.requestPrice}), 0)`.mapWith(
						Number,
					),
			};

			results = (await db
				.select({ ...baseColumns, ...providerColumns })
				.from(historyTable)
				.innerJoin(
					mappingTable,
					eq(historyTable.modelProviderMappingId, mappingTable.id),
				)
				.innerJoin(modelTable, eq(mappingTable.modelId, modelTable.id))
				.innerJoin(providerTable, eq(mappingTable.providerId, providerTable.id))
				.where(whereConditions.length ? and(...whereConditions) : undefined)
				.groupBy(
					modelTable.id,
					modelTable.name,
					providerTable.id,
					providerTable.name,
				)
				.orderBy(desc(sql`SUM(${historyTable.totalTokens})`))
				.limit(enforcedLimit)) as ProviderResultRow[];
		}

		// F. Compute derived metrics
		const data: RankedItem[] = results.map((row, index) => {
			const requestCount = row.requestCount;
			const totalTokens = row.totalTokens;

			const avgLatencyMs =
				requestCount > 0 ? row.totalDuration / requestCount : 0;
			const avgTtftMs = requestCount > 0 ? row.totalTtft / requestCount : 0;
			const errorRate = requestCount > 0 ? row.errorCount / requestCount : 0;
			const usagePercent =
				grandTotalTokens > 0 ? (totalTokens / grandTotalTokens) * 100 : 0;

			const item: RankedItem = {
				rank: index + 1,
				modelId: row.modelId,
				modelName: row.modelName,
				totalTokens,
				inputTokens: row.inputTokens,
				outputTokens: row.outputTokens,
				requestCount,
				errorCount: row.errorCount,
				usagePercent: Number(usagePercent.toFixed(2)),
				avgLatencyMs: Math.round(avgLatencyMs),
				avgTtftMs: Math.round(avgTtftMs),
				errorRate: Number(errorRate.toFixed(4)), // 4 decimal places for rate
			};

			// Add provider fields and calculate cost ONLY if grouping by modelProvider
			if (groupBy === "modelProvider" && "providerId" in row) {
				const provRow = row as ProviderResultRow;
				item.providerId = provRow.providerId;
				item.providerName = provRow.providerName;

				// Cost estimation
				let estimatedCost = 0;
				if (requestCount > 0) {
					const iPrice = provRow.inputPrice || 0;
					const oPrice = provRow.outputPrice || 0;
					const rPrice = provRow.requestPrice || 0;

					// Prices in mapping are usually per 1M tokens or similar units?
					// The schema doesn't specify unit, but usually it's standard decimal.
					// Assuming prices are per UNIT (e.g. per 1M tokens) per user instructions.
					estimatedCost =
						row.inputTokens * iPrice +
						row.outputTokens * oPrice +
						row.requestCount * rPrice;

					item.estimatedCost = Number(estimatedCost.toFixed(6));
				} else {
					// Even if 0 usage, cost is 0 if intended to be shown
					item.estimatedCost = 0;
				}
			}

			return item;
		});

		const response: RankingsResponse = {
			period,
			groupBy,
			limit: enforcedLimit,
			generatedAt: new Date().toISOString(),
			data,
		};

		// I. Save to cache (Fire-and-forget)
		setCache(cacheKey, response, 600).catch((error) => {
			logger.warn("Failed to set cache for public rankings", {
				error,
				cacheKey,
			});
		});

		return response;
	}
}
