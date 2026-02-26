import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import {
	and,
	asc,
	count,
	db,
	desc,
	eq,
	exists,
	gte,
	ilike,
	lte,
	or,
	lt,
	sql,
	tables,
	inArray,
} from "@llmgateway/db";
import { revenueCounter } from "@llmgateway/instrumentation";
import { logger } from "@llmgateway/logger";

import type { ServerTypes } from "@/vars.js";

export const admin = new OpenAPIHono<ServerTypes>();

const adminMetricsSchema = z.object({
	totalCreditsIssued: z.number(),
	totalRevenue: z.number(),
	netProfit: z.number(),
	totalSignups: z.number(),
	verifiedUsers: z.number(),
	payingCustomers: z.number(),
	revenuePerCustomerPerMonth: z.number(),
	peakLoadSuccessRate: z.number(),
	customerInfraReplacementRate: z.number(),
});

const tokenWindowSchema = z.enum(["7d", "30d"]);

const adminTokenMetricsSchema = z.object({
	window: tokenWindowSchema,
	startDate: z.string(),
	endDate: z.string(),
	totalRequests: z.number(),
	totalTokens: z.number(),
	totalCost: z.number(),
	inputTokens: z.number(),
	inputCost: z.number(),
	outputTokens: z.number(),
	outputCost: z.number(),
	cachedTokens: z.number(),
	cachedCost: z.number(),
	mostUsedModel: z.string().nullable(),
	mostUsedProvider: z.string().nullable(),
	mostUsedModelRequestCount: z.number(),
});

const transactionObjectSchema = z.object({
	id: z.string(),
	organizationId: z.string(),
	creditAmount: z.string(),
	description: z.string(),
});

const depositRequestSchema = z.object({
	organizationId: z.string().openapi({ example: "org_123456" }),
	amount: z.number().positive().openapi({ example: 50.0 }),
	description: z
		.string()
		.trim()
		.min(1, "Description cannot be empty")
		.openapi({ example: "Compensation for downtime" }),
});

const depositResponseSchema = z.object({
	success: z.boolean(),
	transaction: transactionObjectSchema,
	newBalance: z.string().or(z.number()),
});

const organizationSchema = z.object({
	id: z.string(),
	name: z.string(),
	billingEmail: z.string(),
	credits: z.string(),
	plan: z.enum(["free", "pro"]),
	status: z.enum(["active", "inactive", "deleted"]).nullable(),
	createdAt: z.date(),
});

const bannerSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	enabled: z.boolean(),
	type: z.string(),
	priority: z.number(),
});

const updateBannerSchema = z.object({
	enabled: z.boolean(),
});

const depositTransactionSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	organizationId: z.string(),
	organizationName: z.string(),
	amount: z.string().nullable(),
	creditAmount: z.string().nullable(),
	currency: z.string(),
	status: z.enum(["pending", "completed", "failed"]),
	stripePaymentIntentId: z.string().nullable(),
	stripeInvoiceId: z.string().nullable(),
	description: z.string().nullable(),
	paymentMethod: z.string(),
});

const depositEventSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	type: z.enum(["created", "status_changed"]),
	newStatus: z.enum(["pending", "completed", "failed"]).nullable(),
	metadata: z.unknown().nullable(),
});

function isAdminEmail(email: string | null | undefined): boolean {
	const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
	const adminEmails = adminEmailsEnv
		.split(",")
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean);

	if (!email || adminEmails.length === 0) {
		return false;
	}

	return adminEmails.includes(email.toLowerCase());
}

function escapeLike(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

function parseCsvParam<T extends string>(
	value: unknown,
	allowed: readonly T[],
): T[] {
	const raw = Array.isArray(value)
		? value.join(",")
		: typeof value === "string"
			? value
			: "";

	if (!raw) {
		return [];
	}

	return raw
		.split(",")
		.map((v) => v.trim() as T)
		.filter((v) => allowed.includes(v));
}

const organizationPlansCsvSchema = z
	.preprocess(
		(val) => parseCsvParam(val, ["free", "pro"]),
		z.array(z.enum(["free", "pro"])),
	)
	.optional()
	.openapi({
		type: "array",
		items: { type: "string", enum: ["free", "pro"] },
		example: "free,pro",
		description: "Comma-separated plans: free,pro",
	});

const organizationStatusesCsvSchema = z
	.preprocess(
		(val) => parseCsvParam(val, ["active", "inactive", "deleted"]),
		z.array(z.enum(["active", "inactive", "deleted"])),
	)
	.optional()
	.openapi({
		type: "array",
		items: { type: "string", enum: ["active", "inactive", "deleted"] },
		example: ["active", "inactive"],
		description: "Comma-separated statuses: active,inactive,deleted",
	});

const getMetrics = createRoute({
	method: "get",
	path: "/metrics",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: adminMetricsSchema.openapi({}),
				},
			},
			description: "Admin dashboard metrics.",
		},
	},
});

const getTokenMetrics = createRoute({
	method: "get",
	path: "/tokens",
	request: {
		query: z.object({
			window: tokenWindowSchema.default("7d").optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: adminTokenMetricsSchema.openapi({}),
				},
			},
			description: "Admin token usage metrics.",
		},
	},
});

const depositCredits = createRoute({
	method: "post",
	path: "/deposit-credits",
	request: {
		body: {
			content: {
				"application/json": {
					schema: depositRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: depositResponseSchema,
				},
			},
			description: "Credits successfully deposited",
		},
		400: { description: "Validation error" },
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
		404: { description: "Organization not found" },
		500: { description: "Internal Server Error" },
	},
});

const getOrganizations = createRoute({
	method: "get",
	path: "/organizations",
	request: {
		query: z.object({
			page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
			pageSize: z.coerce
				.number()
				.int()
				.min(1)
				.max(100)
				.default(25)
				.openapi({ example: 25 }),
			search: z.string().optional(),
			plans: organizationPlansCsvSchema,
			statuses: organizationStatusesCsvSchema,
			from: z.string().datetime().optional(),
			to: z.string().datetime().optional(),
			sort: z
				.enum([
					"name",
					"billingEmail",
					"credits",
					"plan",
					"status",
					"createdAt",
				])
				.default("createdAt")
				.optional(),
			order: z.enum(["asc", "desc"]).default("desc").optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						organizations: z.array(organizationSchema).openapi({}),
						suggestions: z.array(z.string()),
						pagination: z.object({
							page: z.number(),
							pageSize: z.number(),
							totalOrganizations: z.number(),
							totalPages: z.number(),
						}),
					}),
				},
			},
			description: "Paginated list of organizations",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
	},
});

const updateUserStatus = createRoute({
	method: "patch",
	path: "/users/:id/status",
	request: {
		params: z.object({
			id: z.string().openapi({ example: "user_123456" }),
		}),
		body: {
			content: {
				"application/json": {
					schema: z.object({
						status: z
							.enum(["active", "blocked"])
							.openapi({ example: "blocked" }),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						user: z.object({
							id: z.string(),
							status: z.enum(["active", "blocked"]),
						}),
						affectedOrganizations: z.number(),
					}),
				},
			},
			description: "User status updated successfully",
		},
		400: { description: "Validation error" },
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
		404: { description: "User not found" },
		500: { description: "Internal Server Error" },
	},
});

const getUsers = createRoute({
	method: "get",
	path: "/users",
	request: {
		query: z.object({
			page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
			pageSize: z.coerce
				.number()
				.int()
				.min(1)
				.max(100)
				.default(20)
				.openapi({ example: 20 }),
			sortBy: z
				.enum(["createdAt", "name", "email", "status", "emailVerified", "id"])
				.optional(),
			order: z.enum(["asc", "desc"]).default("desc"),
			userId: z.string().optional(),
			name: z.string().optional(),
			email: z.string().optional(),
			role: z.enum(["owner", "admin", "developer"]).optional(),
			emailStatus: z.enum(["verified", "unverified"]).optional(),
			accountStatus: z.enum(["active", "blocked"]).optional(),
			registeredAtFrom: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
				.refine((val) => {
					const date = new Date(val);
					return (
						!Number.isNaN(date.getTime()) && date.toISOString().startsWith(val)
					);
				}, "Invalid date format or calendar date")
				.optional(),
			registeredAtTo: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
				.refine((val) => {
					const date = new Date(val);
					return (
						!Number.isNaN(date.getTime()) && date.toISOString().startsWith(val)
					);
				}, "Invalid date format or calendar date")
				.optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						users: z
							.array(
								z.object({
									id: z.string(),
									name: z.string().nullable(),
									email: z.string(),
									emailVerified: z.boolean(),
									createdAt: z.date(),
									status: z.enum(["active", "blocked"]),
									organizations: z.array(
										z.object({
											organizationId: z.string(),
											organizationName: z.string(),
											role: z.enum(["owner", "admin", "developer"]),
										}),
									),
								}),
							)
							.openapi({}),
						pagination: z.object({
							page: z.number(),
							pageSize: z.number(),
							totalUsers: z.number(),
							totalPages: z.number(),
						}),
					}),
				},
			},
			description: "Paginated list of users with organizations",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
	},
});

const getBannerSettings = createRoute({
	method: "get",
	path: "/banners",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						banners: z.array(bannerSchema).openapi({}),
					}),
				},
			},
			description: "List of all banners settings",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
	},
});

const getDeposits = createRoute({
	method: "get",
	path: "/deposits",
	request: {
		query: z.object({
			page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
			pageSize: z.coerce
				.number()
				.int()
				.min(1)
				.default(20)
				.openapi({ example: 20 }),
			status: z.enum(["pending", "completed", "failed"]).optional(),
			from: z.string().datetime().optional(), // ISO date string
			to: z.string().datetime().optional(), // ISO date string
			q: z.string().optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						deposits: z.array(depositTransactionSchema).openapi({}),
						pagination: z.object({
							page: z.number(),
							pageSize: z.number(),
							totalDeposits: z.number(),
							totalPages: z.number(),
						}),
					}),
				},
			},
			description: "Paginated list of deposit transactions",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
	},
});

const updateBannerSettings = createRoute({
	method: "patch",
	path: "/banners/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			required: true,
			content: {
				"application/json": {
					schema: updateBannerSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: bannerSchema.openapi({}),
				},
			},
			description: "Banner updated successfully",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
		404: { description: "Banner not found" },
	},
});

const getDeposit = createRoute({
	method: "get",
	path: "/deposits/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						deposit: depositTransactionSchema.openapi({}),
						events: z.array(depositEventSchema).openapi({}),
					}),
				},
			},
			description: "Deposit details and audit events",
		},
		404: { description: "Deposit not found" },
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
	},
});

const modelMappingStatusSchema = z.object({
	id: z.string(),
	status: z.enum(["active", "inactive", "deactivated"]),
	deactivatedAt: z.date().nullable(),
	deactivationReason: z.string().nullable(),
});

const updateModelMappingStatus = createRoute({
	method: "patch",
	path: "/models/mappings/{id}",
	request: {
		params: z.object({
			id: z.string().openapi({ example: "mapping_123" }),
		}),
		body: {
			content: {
				"application/json": {
					schema: z.object({
						status: z
							.enum(["active", "inactive", "deactivated"])
							.openapi({ example: "inactive" }),
						reason: z
							.string()
							.optional()
							.openapi({ example: "Model deprecated" }),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						mapping: modelMappingStatusSchema,
					}),
				},
			},
			description: "Model mapping status successfully updated",
		},
		400: { description: "Invalid status transition" },
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
		404: { description: "Model mapping not found" },
		500: { description: "Internal Server Error" },
	},
});

admin.openapi(getMetrics, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const now = new Date();

	// Total credits issued (completed credit top-ups, including bonuses)
	const [creditsRow] = await db
		.select({
			value:
				sql<number>`COALESCE(SUM(CAST(${tables.transaction.creditAmount} AS NUMERIC)), 0)`.as(
					"value",
				),
		})
		.from(tables.transaction)
		.where(
			and(
				eq(tables.transaction.type, "credit_topup"),
				eq(tables.transaction.status, "completed"),
			),
		);

	const totalCreditsIssued = Number(creditsRow?.value ?? 0);

	// Total revenue (all completed transactions – subscriptions + credit top-ups)
	const [revenueRow] = await db
		.select({
			value:
				sql<number>`COALESCE(SUM(CAST(${tables.transaction.amount} AS NUMERIC)), 0)`.as(
					"value",
				),
		})
		.from(tables.transaction)
		.where(eq(tables.transaction.status, "completed"));

	const totalRevenue = Number(revenueRow?.value ?? 0);

	// Total usage cost from logs (what customers have actually consumed)
	const [usageCostRow] = await db
		.select({
			value: sql<number>`COALESCE(SUM(${tables.log.cost}), 0)`.as("value"),
		})
		.from(tables.log);

	const totalUsageCost = Number(usageCostRow?.value ?? 0);

	// Simple net profit approximation: revenue minus metered usage cost
	const netProfit = totalRevenue - totalUsageCost;

	// Total signups (all users)
	const [signupsRow] = await db
		.select({
			count: sql<number>`COUNT(*)`.as("count"),
		})
		.from(tables.user);

	const totalSignups = Number(signupsRow?.count ?? 0);

	// Verified users (email verified)
	const [verifiedRow] = await db
		.select({
			count: sql<number>`COUNT(*)`.as("count"),
		})
		.from(tables.user)
		.where(eq(tables.user.emailVerified, true));

	const verifiedUsers = Number(verifiedRow?.count ?? 0);

	// Paying customers: organizations with at least one completed transaction
	const [payingRow] = await db
		.select({
			count:
				sql<number>`COUNT(DISTINCT ${tables.transaction.organizationId})`.as(
					"count",
				),
		})
		.from(tables.transaction)
		.where(eq(tables.transaction.status, "completed"));

	const payingCustomers = Number(payingRow?.count ?? 0);

	// Revenue per customer per month (last 30 days)
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const [recentRevenueRow] = await db
		.select({
			value:
				sql<number>`COALESCE(SUM(CAST(${tables.transaction.amount} AS NUMERIC)), 0)`.as(
					"value",
				),
		})
		.from(tables.transaction)
		.where(
			and(
				eq(tables.transaction.status, "completed"),
				gte(tables.transaction.createdAt, thirtyDaysAgo),
			),
		);

	const recentRevenue = Number(recentRevenueRow?.value ?? 0);

	const [recentPayingRow] = await db
		.select({
			count:
				sql<number>`COUNT(DISTINCT ${tables.transaction.organizationId})`.as(
					"count",
				),
		})
		.from(tables.transaction)
		.where(
			and(
				eq(tables.transaction.status, "completed"),
				gte(tables.transaction.createdAt, thirtyDaysAgo),
			),
		);

	const recentPayingCustomers = Number(recentPayingRow?.count ?? 0);

	const revenuePerCustomerPerMonth =
		recentPayingCustomers > 0 ? recentRevenue / recentPayingCustomers : 0;

	// Requests successfully served under recent peak load (approximate: last 24 hours)
	const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const [requestsRow] = await db
		.select({
			total: sql<number>`COUNT(*)`.as("total"),
			successful:
				sql<number>`SUM(CASE WHEN ${tables.log.hasError} = false THEN 1 ELSE 0 END)`.as(
					"successful",
				),
		})
		.from(tables.log)
		.where(gte(tables.log.createdAt, twentyFourHoursAgo));

	const totalRequests = Number(requestsRow?.total ?? 0);
	const successfulRequests = Number(requestsRow?.successful ?? 0);

	const peakLoadSuccessRate =
		totalRequests > 0 ? successfulRequests / totalRequests : 0;

	// Customer infra replacement rate: organizations with retentionLevel "retain"
	const [totalOrgsRow] = await db
		.select({
			count: sql<number>`COUNT(*)`.as("count"),
		})
		.from(tables.organization);

	const totalOrgs = Number(totalOrgsRow?.count ?? 0);

	const [retainedOrgsRow] = await db
		.select({
			count: sql<number>`COUNT(*)`.as("count"),
		})
		.from(tables.organization)
		.where(eq(tables.organization.retentionLevel, "retain"));

	const retainedOrgs = Number(retainedOrgsRow?.count ?? 0);

	const customerInfraReplacementRate =
		totalOrgs > 0 ? retainedOrgs / totalOrgs : 0;

	return c.json({
		totalCreditsIssued,
		totalRevenue,
		netProfit,
		totalSignups,
		verifiedUsers,
		payingCustomers,
		revenuePerCustomerPerMonth,
		peakLoadSuccessRate,
		customerInfraReplacementRate,
	});
});

admin.openapi(getTokenMetrics, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const query = c.req.valid("query");
	const windowParam = query.window ?? "7d";

	const now = new Date();
	const days = windowParam === "30d" ? 30 : 7;
	const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

	const rows = await db
		.select({
			usedModel: tables.log.usedModel,
			usedProvider: tables.log.usedProvider,
			requestsCount: sql<number>`COUNT(*)`.as("requestsCount"),
			inputTokens:
				sql<number>`COALESCE(SUM(CAST(${tables.log.promptTokens} AS INTEGER)), 0)`.as(
					"inputTokens",
				),
			outputTokens:
				sql<number>`COALESCE(SUM(CAST(${tables.log.completionTokens} AS INTEGER)), 0)`.as(
					"outputTokens",
				),
			cachedTokens:
				sql<number>`COALESCE(SUM(CAST(${tables.log.cachedTokens} AS INTEGER)), 0)`.as(
					"cachedTokens",
				),
			totalTokens:
				sql<number>`COALESCE(SUM(CAST(${tables.log.totalTokens} AS INTEGER)), 0)`.as(
					"totalTokens",
				),
			totalCost: sql<number>`COALESCE(SUM(${tables.log.cost}), 0)`.as(
				"totalCost",
			),
			inputCost: sql<number>`COALESCE(SUM(${tables.log.inputCost}), 0)`.as(
				"inputCost",
			),
			outputCost: sql<number>`COALESCE(SUM(${tables.log.outputCost}), 0)`.as(
				"outputCost",
			),
			cachedCost:
				sql<number>`COALESCE(SUM(${tables.log.cachedInputCost}), 0)`.as(
					"cachedCost",
				),
		})
		.from(tables.log)
		.where(
			and(gte(tables.log.createdAt, startDate), lt(tables.log.createdAt, now)),
		)
		.groupBy(tables.log.usedModel, tables.log.usedProvider);

	let totalRequests = 0;
	let totalTokens = 0;
	let totalCost = 0;
	let inputTokens = 0;
	let inputCost = 0;
	let outputTokens = 0;
	let outputCost = 0;
	let cachedTokens = 0;
	let cachedCost = 0;

	let mostUsedModel: string | null = null;
	let mostUsedProvider: string | null = null;
	let mostUsedModelRequestCount = 0;

	for (const row of rows) {
		totalRequests += row.requestsCount;
		totalTokens += row.totalTokens;
		totalCost += row.totalCost;
		inputTokens += row.inputTokens;
		inputCost += row.inputCost;
		outputTokens += row.outputTokens;
		outputCost += row.outputCost;
		cachedTokens += row.cachedTokens;
		cachedCost += row.cachedCost;

		if (row.requestsCount > mostUsedModelRequestCount) {
			mostUsedModelRequestCount = row.requestsCount;
			mostUsedModel = row.usedModel;
			mostUsedProvider = row.usedProvider;
		}
	}

	return c.json({
		window: windowParam,
		startDate: startDate.toISOString(),
		endDate: now.toISOString(),
		totalRequests,
		totalTokens,
		totalCost,
		inputTokens,
		inputCost,
		outputTokens,
		outputCost,
		cachedTokens,
		cachedCost,
		mostUsedModel,
		mostUsedProvider,
		mostUsedModelRequestCount,
	});
});

admin.openapi(getOrganizations, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(user.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const query = c.req.valid("query");

	const {
		search,
		plans: parsedPlans = [],
		statuses: parsedStatuses = [],
		from,
		to,
		sort: sortField = "createdAt",
		order: sortOrder = "desc",
	} = query;

	const normalizedSearch = search?.trim();
	const escapedSearch = normalizedSearch ? escapeLike(normalizedSearch) : "";
	const page = query.page;
	const pageSize = Math.min(100, query.pageSize);
	const offset = (page - 1) * pageSize;
	const conditions = [];

	const sortColumnMap = {
		name: tables.organization.name,
		billingEmail: tables.organization.billingEmail,
		credits: tables.organization.credits,
		plan: tables.organization.plan,
		status: tables.organization.status,
		createdAt: tables.organization.createdAt,
	} as const;

	const sortColumn = sortColumnMap[sortField] ?? tables.organization.createdAt;
	const orderFn = sortOrder === "asc" ? asc : desc;

	if (escapedSearch) {
		conditions.push(
			or(
				ilike(tables.organization.name, `%${escapedSearch}%`),
				ilike(tables.organization.billingEmail, `%${escapedSearch}%`),
				ilike(tables.organization.billingCompany, `%${escapedSearch}%`),
			),
		);
	}

	if (parsedPlans.length) {
		conditions.push(inArray(tables.organization.plan, parsedPlans));
	}

	if (parsedStatuses.length) {
		conditions.push(inArray(tables.organization.status, parsedStatuses));
	}

	if (from) {
		conditions.push(gte(tables.organization.createdAt, new Date(from)));
	}

	if (to) {
		conditions.push(lte(tables.organization.createdAt, new Date(to)));
	}

	const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

	const organizationsWithCount = await db
		.select({
			organization: tables.organization,
			count: sql<number>`count(*) over()::int`,
		})
		.from(tables.organization)
		.where(whereCondition)
		.orderBy(orderFn(sortColumn))
		.limit(pageSize)
		.offset(offset);

	const organizations = organizationsWithCount.map((row) => row.organization);
	const totalOrganizations = organizationsWithCount[0]?.count || 0;
	const totalPages = Math.max(1, Math.ceil(totalOrganizations / pageSize));

	const suggestions = Array.from(
		new Set(
			organizations
				.flatMap((organization) => [
					organization.name,
					organization.billingEmail,
					organization.billingCompany,
				])
				.filter((value) => Boolean(value)),
		),
	).slice(0, 20);

	return c.json({
		organizations,
		suggestions,
		pagination: {
			page,
			pageSize,
			totalOrganizations,
			totalPages,
		},
	});
});

admin.openapi(depositCredits, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const { organizationId, amount, description } = c.req.valid("json");

	try {
		const targetOrg = await db.query.organization.findFirst({
			where: {
				id: organizationId,
			},
			columns: {
				id: true,
				credits: true,
			},
		});

		if (!targetOrg) {
			throw new HTTPException(404, { message: "Organization not found" });
		}

		const result = await db.transaction(async (tx) => {
			const [newTx] = await tx
				.insert(tables.transaction)
				.values({
					organizationId,
					type: "credit_topup",
					amount: "0",
					creditAmount: String(amount),
					status: "completed",
					description: `Admin credit grant: ${description}`,
					currency: "USD",
					createdAt: new Date(),
				})
				.returning();

			const [updatedOrg] = await tx
				.update(tables.organization)
				.set({
					credits: sql`${tables.organization.credits} + ${amount}`,
				})
				.where(eq(tables.organization.id, organizationId))
				.returning({ newBalance: tables.organization.credits });

			return {
				transaction: {
					id: newTx.id,
					organizationId: newTx.organizationId,
					creditAmount: Number(newTx.creditAmount),
					description: newTx.description,
				},
				newBalance: Number(updatedOrg.newBalance),
			};
		});

		void db
			.insert(tables.transactionEvent)
			.values({
				transactionId: result.transaction.id,
				type: "created",
				newStatus: "completed",
				metadata: {
					type: "admin_credit_granted",
					adminUserId: authUser.id,
					organizationId,
					amount,
					description,
				},
			})
			.catch((logError) => {
				logger.error("Failed to log transaction event (best effort)", {
					err: logError,
				});
			});

		revenueCounter.add(result.transaction.creditAmount, {
			org_id: organizationId,
			user_id: authUser.id,
			type: "admin_grant",
		});

		return c.json({
			success: true,
			...result,
		});
	} catch (err: unknown) {
		if (err instanceof HTTPException) {
			throw err;
		}

		logger.error("Unexpected error in depositCredits", { err });

		throw new HTTPException(500, {
			message: "Internal Database Error",
		});
	}
});

admin.openapi(updateUserStatus, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const { id: userId } = c.req.valid("param");
	const { status } = c.req.valid("json");

	// Prevent admin from blocking their own account
	if (userId === authUser.id && status === "blocked") {
		throw new HTTPException(403, {
			message: "You cannot block your own account",
		});
	}

	try {
		// Check if user exists
		const targetUser = await db.query.user.findFirst({
			where: {
				id: userId,
			},
			columns: {
				id: true,
				status: true,
			},
		});

		if (!targetUser) {
			throw new HTTPException(404, { message: "User not found" });
		}

		// Update user status and affected organizations in a transaction
		const result = await db.transaction(async (tx) => {
			// Update user status
			const [updatedUser] = await tx
				.update(tables.user)
				.set({
					status,
					updatedAt: new Date(),
				})
				.where(eq(tables.user.id, userId))
				.returning({ id: tables.user.id, status: tables.user.status });

			// Find all organizations where user is the owner with their current status
			const ownedOrgs = await tx
				.select({
					organizationId: tables.userOrganization.organizationId,
					status: tables.organization.status,
				})
				.from(tables.userOrganization)
				.innerJoin(
					tables.organization,
					eq(tables.userOrganization.organizationId, tables.organization.id),
				)
				.where(
					and(
						eq(tables.userOrganization.userId, userId),
						eq(tables.userOrganization.role, "owner"),
					),
				);

			let affectedOrganizations = 0;

			// Update organization status based on user status
			if (ownedOrgs.length > 0) {
				if (status === "blocked") {
					// Block user: deactivate all active organizations
					const activeOrgIds = ownedOrgs
						.filter((o) => o.status === "active")
						.map((o) => o.organizationId);

					if (activeOrgIds.length > 0) {
						await tx
							.update(tables.organization)
							.set({
								status: "inactive",
								updatedAt: new Date(),
							})
							.where(inArray(tables.organization.id, activeOrgIds));

						affectedOrganizations = activeOrgIds.length;
					}
				} else {
					// Unblock user: only restore organizations that are currently inactive
					// This prevents restoring orgs that were manually deactivated for other reasons
					const inactiveOrgIds = ownedOrgs
						.filter((o) => o.status === "inactive")
						.map((o) => o.organizationId);

					if (inactiveOrgIds.length > 0) {
						await tx
							.update(tables.organization)
							.set({
								status: "active",
								updatedAt: new Date(),
							})
							.where(inArray(tables.organization.id, inactiveOrgIds));

						affectedOrganizations = inactiveOrgIds.length;
					}
				}
			}

			return {
				user: updatedUser,
				affectedOrganizations,
			};
		});

		return c.json({
			success: true,
			user: result.user,
			affectedOrganizations: result.affectedOrganizations,
		});
	} catch (err: unknown) {
		if (err instanceof HTTPException) {
			throw err;
		}

		throw new HTTPException(500, { message: "Internal Database Error" });
	}
});

admin.openapi(getUsers, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const query = c.req.valid("query");
	const page = query.page;
	const pageSize = Math.min(100, query.pageSize);
	const offset = (page - 1) * pageSize;

	const conditions = [];

	if (query.userId) {
		conditions.push(eq(tables.user.id, query.userId));
	}

	if (query.name) {
		const escaped = escapeLike(query.name);
		const search = `%${escaped}%`;
		conditions.push(
			sql`COALESCE(${tables.user.name}, '') ILIKE ${search} ESCAPE '\\'`,
		);
	}

	if (query.email) {
		const escaped = escapeLike(query.email);
		const search = `%${escaped}%`;
		conditions.push(sql`${tables.user.email} ILIKE ${search} ESCAPE '\\'`);
	}
	if (query.role) {
		conditions.push(
			exists(
				db
					.select({ id: sql`1` })
					.from(tables.userOrganization)
					.where(
						and(
							eq(tables.userOrganization.userId, tables.user.id),
							eq(tables.userOrganization.role, query.role),
						),
					),
			),
		);
	}
	if (query.emailStatus) {
		conditions.push(
			eq(tables.user.emailVerified, query.emailStatus === "verified"),
		);
	}
	if (query.accountStatus) {
		conditions.push(eq(tables.user.status, query.accountStatus));
	}
	if (query.registeredAtFrom) {
		const startOfDay = new Date(`${query.registeredAtFrom}T00:00:00.000Z`);
		conditions.push(gte(tables.user.createdAt, startOfDay));
	}
	if (query.registeredAtTo) {
		const endOfDayDate = new Date(`${query.registeredAtTo}T00:00:00.000Z`);
		const nextDay = new Date(endOfDayDate.getTime() + 24 * 60 * 60 * 1000);
		conditions.push(lt(tables.user.createdAt, nextDay));
	}

	const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

	const [totalUsersResult] = await db
		.select({ count: sql<number>`COUNT(*)`.as("count") })
		.from(tables.user)
		.where(whereCondition);

	const totalUsers = Number(totalUsersResult?.count ?? 0);
	const totalPages = Math.ceil(totalUsers / pageSize);

	const sortColumnMap = {
		createdAt: tables.user.createdAt,
		name: tables.user.name,
		email: tables.user.email,
		status: tables.user.status,
		emailVerified: tables.user.emailVerified,
		id: tables.user.id,
	} as const;

	const validSortBy =
		query.sortBy && query.sortBy in sortColumnMap
			? (query.sortBy as keyof typeof sortColumnMap)
			: "createdAt";

	const primarySortColumn = sortColumnMap[validSortBy];

	const primarySort =
		query.order === "asc" ? asc(primarySortColumn) : desc(primarySortColumn);

	const orderByParams = [primarySort];
	if (validSortBy !== "id") {
		orderByParams.push(asc(tables.user.id));
	}

	const usersData = await db
		.select({
			id: tables.user.id,
			name: tables.user.name,
			email: tables.user.email,
			emailVerified: tables.user.emailVerified,
			createdAt: tables.user.createdAt,
			status: tables.user.status,
		})
		.from(tables.user)
		.where(whereCondition)
		.orderBy(...orderByParams)
		.limit(pageSize)
		.offset(offset);

	const userIds = usersData.map((u) => u.id);

	let userOrganizations: Array<{
		userId: string;
		organizationId: string;
		organizationName: string;
		role: "owner" | "admin" | "developer";
	}> = [];

	if (userIds.length > 0) {
		userOrganizations = await db
			.select({
				userId: tables.userOrganization.userId,
				organizationId: tables.userOrganization.organizationId,
				organizationName: tables.organization.name,
				role: tables.userOrganization.role,
			})
			.from(tables.userOrganization)
			.innerJoin(
				tables.organization,
				eq(tables.organization.id, tables.userOrganization.organizationId),
			)
			.where(
				and(
					inArray(tables.userOrganization.userId, userIds),
					eq(tables.organization.status, "active"),
				),
			);
	}

	const users = usersData.map((user) => ({
		id: user.id,
		name: user.name,
		email: user.email,
		emailVerified: user.emailVerified,
		createdAt: user.createdAt,
		status: user.status,
		organizations: userOrganizations
			.filter((uo) => uo.userId === user.id)
			.map((uo) => ({
				organizationId: uo.organizationId,
				organizationName: uo.organizationName,
				role: uo.role,
			})),
	}));

	return c.json({
		users,
		pagination: {
			page,
			pageSize,
			totalUsers,
			totalPages,
		},
	});
});

admin.openapi(getBannerSettings, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const banners = await db.query.banner.findMany({
		orderBy: (banner, { desc }) => [desc(banner.priority)],
	});

	return c.json({
		banners,
	});
});

admin.openapi(updateBannerSettings, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const { id } = c.req.valid("param");
	const { enabled } = c.req.valid("json");

	const [updatedBanner] = await db
		.update(tables.banner)
		.set({
			enabled,
		})
		.where(eq(tables.banner.id, id))
		.returning();

	if (!updatedBanner) {
		throw new HTTPException(404, {
			message: "Banner not found",
		});
	}

	return c.json(updatedBanner);
});

admin.openapi(getDeposits, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const query = c.req.valid("query");
	const page = query.page;
	const pageSize = Math.min(100, query.pageSize);
	const offset = (page - 1) * pageSize;

	const conditions = [eq(tables.transaction.type, "credit_topup")];

	if (query.status) {
		conditions.push(eq(tables.transaction.status, query.status));
	}

	if (query.from) {
		conditions.push(gte(tables.transaction.createdAt, new Date(query.from)));
	}

	if (query.to) {
		conditions.push(lte(tables.transaction.createdAt, new Date(query.to)));
	}

	if (query.q) {
		const escaped = escapeLike(query.q);
		const search = `%${escaped}%`;
		const searchCondition = or(
			ilike(tables.transaction.id, search),
			ilike(tables.transaction.organizationId, search),
			ilike(tables.transaction.stripePaymentIntentId, search),
			ilike(tables.transaction.stripeInvoiceId, search),
			ilike(tables.organization.name, search),
		);
		if (searchCondition) {
			conditions.push(searchCondition);
		}
	}

	const [totalResult] = await db
		.select({
			count: sql<number>`COUNT(DISTINCT ${tables.transaction.id})`.as("count"),
		})
		.from(tables.transaction)
		.innerJoin(
			tables.organization,
			eq(tables.transaction.organizationId, tables.organization.id),
		)
		.where(and(...conditions));

	const totalDeposits = Number(totalResult?.count ?? 0);
	const totalPages = Math.ceil(totalDeposits / pageSize);

	const deposits = await db
		.select({
			id: tables.transaction.id,
			createdAt: tables.transaction.createdAt,
			organizationId: tables.transaction.organizationId,
			amount: tables.transaction.amount,
			creditAmount: tables.transaction.creditAmount,
			currency: tables.transaction.currency,
			status: tables.transaction.status,
			stripePaymentIntentId: tables.transaction.stripePaymentIntentId,
			stripeInvoiceId: tables.transaction.stripeInvoiceId,
			description: tables.transaction.description,
			organizationName: tables.organization.name,
			paymentMethod:
				sql<string>`CASE WHEN ${tables.transaction.stripePaymentIntentId} IS NOT NULL THEN 'Stripe' ELSE 'System' END`.as(
					"paymentMethod",
				),
		})
		.from(tables.transaction)
		.innerJoin(
			tables.organization,
			eq(tables.transaction.organizationId, tables.organization.id),
		)
		.where(and(...conditions))
		.orderBy(desc(tables.transaction.createdAt))
		.limit(pageSize)
		.offset(offset);

	return c.json({
		deposits,
		pagination: {
			page,
			pageSize,
			totalDeposits,
			totalPages,
		},
	});
});

admin.openapi(getDeposit, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const { id } = c.req.valid("param");

	const [deposit] = await db
		.select({
			id: tables.transaction.id,
			createdAt: tables.transaction.createdAt,
			organizationId: tables.transaction.organizationId,
			amount: tables.transaction.amount,
			creditAmount: tables.transaction.creditAmount,
			currency: tables.transaction.currency,
			status: tables.transaction.status,
			stripePaymentIntentId: tables.transaction.stripePaymentIntentId,
			stripeInvoiceId: tables.transaction.stripeInvoiceId,
			description: tables.transaction.description,
			organizationName: tables.organization.name,
			paymentMethod:
				sql<string>`CASE WHEN ${tables.transaction.stripePaymentIntentId} IS NOT NULL THEN 'Stripe' ELSE 'System' END`.as(
					"paymentMethod",
				),
		})
		.from(tables.transaction)
		.innerJoin(
			tables.organization,
			eq(tables.transaction.organizationId, tables.organization.id),
		)
		.where(
			and(
				eq(tables.transaction.id, id),
				eq(tables.transaction.type, "credit_topup"),
			),
		)
		.limit(1);

	if (!deposit) {
		throw new HTTPException(404, { message: "Deposit not found" });
	}

	const events = await db
		.select({
			id: tables.transactionEvent.id,
			createdAt: tables.transactionEvent.createdAt,
			type: tables.transactionEvent.type,
			newStatus: tables.transactionEvent.newStatus,
			metadata: tables.transactionEvent.metadata,
		})
		.from(tables.transactionEvent)
		.where(eq(tables.transactionEvent.transactionId, id))
		.orderBy(desc(tables.transactionEvent.createdAt));

	return c.json({
		deposit,
		events,
	});
});

admin.openapi(updateModelMappingStatus, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, {
			message: "Admin access required",
		});
	}

	const { id } = c.req.valid("param");
	const { status: newStatus, reason } = c.req.valid("json");

	try {
		const existingMapping = await db.query.modelProviderMapping.findFirst({
			where: {
				id: { eq: id },
			},
		});

		if (!existingMapping) {
			throw new HTTPException(404, { message: "Model mapping not found" });
		}

		const currentStatus = existingMapping.status;

		// Validate status transitions
		if (currentStatus === "deactivated") {
			throw new HTTPException(400, {
				message: "Cannot reactivate a deactivated model mapping",
			});
		}

		// Valid transitions:
		// active -> inactive, active -> deactivated
		// inactive -> active, inactive -> deactivated
		// deactivated -> (none - blocked above)

		const [updatedMapping] = await db
			.update(tables.modelProviderMapping)
			.set({
				status: newStatus,
				deactivatedAt: newStatus === "deactivated" ? new Date() : undefined,
				deactivationReason: newStatus === "deactivated" ? reason : undefined,
				updatedAt: new Date(),
			})
			.where(eq(tables.modelProviderMapping.id, id))
			.returning();

		return c.json({
			success: true,
			mapping: {
				id: updatedMapping.id,
				status: updatedMapping.status,
				deactivatedAt: updatedMapping.deactivatedAt,
				deactivationReason: updatedMapping.deactivationReason,
			},
		});
	} catch (err: any) {
		if (err instanceof HTTPException) {
			throw err;
		}

		throw new HTTPException(500, { message: "Internal Server Error" });
	}
});

// ─────────────────────────────────────────────
// Voucher schemas
// ─────────────────────────────────────────────

const voucherResponseSchema = z.object({
	id: z.string(),
	code: z.string(),
	depositAmount: z.string(),
	globalUsageLimit: z.number().int(),
	orgUsageLimit: z.number().int(),
	expiresAt: z.date().nullable(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const voucherWithAggregatesSchema = voucherResponseSchema.extend({
	totalRedemptionsAllOrgs: z.number().int(),
});

const createVoucherSchema = z.object({
	code: z
		.string()
		.trim()
		.toUpperCase()
		.optional()
		.openapi({ example: "PROMO2025" }),
	depositAmount: z.number().min(0).optional().default(0),
	globalUsageLimit: z.number().int().min(0).optional().default(1),
	orgUsageLimit: z.number().int().min(0).optional().default(1),
	expiresAt: z.string().nullable().optional(),
	isActive: z.boolean().optional().default(true),
});

// ─────────────────────────────────────────────
// Voucher createRoute definitions
// ─────────────────────────────────────────────

const createVoucherRoute = createRoute({
	method: "post",
	path: "/vouchers",
	request: {
		body: {
			required: true,
			content: {
				"application/json": {
					schema: createVoucherSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						voucher: voucherResponseSchema,
					}),
				},
			},
			description: "Voucher created successfully",
		},
		400: { description: "Validation error" },
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
		500: { description: "Internal Server Error" },
	},
});

const listVouchersRoute = createRoute({
	method: "get",
	path: "/vouchers",
	request: {
		query: z.object({
			page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
			pageSize: z.coerce
				.number()
				.int()
				.min(1)
				.max(100)
				.default(20)
				.openapi({ example: 20 }),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						items: z.array(voucherWithAggregatesSchema),
						total: z.number().int(),
						page: z.number().int(),
						pageSize: z.number().int(),
					}),
				},
			},
			description: "Paginated list of vouchers with aggregates",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
	},
});

const getVoucherRoute = createRoute({
	method: "get",
	path: "/vouchers/{id}",
	request: {
		params: z.object({
			id: z.string().openapi({ example: "abc123" }),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						voucher: voucherWithAggregatesSchema,
					}),
				},
			},
			description: "Voucher details with aggregate usage stats",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
		404: { description: "Voucher not found" },
	},
});

const deleteVoucherRoute = createRoute({
	method: "delete",
	path: "/vouchers/{id}",
	request: {
		params: z.object({
			id: z.string().openapi({ example: "abc123" }),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Voucher deleted successfully",
		},
		401: { description: "Unauthorized" },
		403: { description: "Forbidden" },
		404: { description: "Voucher not found" },
	},
});

// ─────────────────────────────────────────────
// Voucher route handlers
// ─────────────────────────────────────────────

const VOUCHER_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const VOUCHER_CODE_LENGTH = 10;

function generateVoucherCode(): string {
	let code = "";
	for (let i = 0; i < VOUCHER_CODE_LENGTH; i++) {
		const idx = Math.floor(Math.random() * VOUCHER_CODE_ALPHABET.length);
		code += VOUCHER_CODE_ALPHABET[idx];
	}
	return code;
}

admin.openapi(createVoucherRoute, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, { message: "Admin access required" });
	}

	const body = c.req.valid("json");

	const expiresAt =
		body.expiresAt !== null && body.expiresAt !== undefined
			? new Date(body.expiresAt)
			: null;

	// If code is provided, do a straight insert.
	if (body.code) {
		const [created] = await db
			.insert(tables.voucher)
			.values({
				code: body.code,
				depositAmount: String(body.depositAmount ?? 0),
				globalUsageLimit: body.globalUsageLimit ?? 1,
				orgUsageLimit: body.orgUsageLimit ?? 1,
				expiresAt: expiresAt ?? undefined,
				isActive: body.isActive ?? true,
			})
			.returning();

		return c.json({ voucher: created });
	}

	// Auto-generate unique code, retry up to 5 times.
	const MAX_ATTEMPTS = 5;
	let lastError: unknown;

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const code = generateVoucherCode();

		try {
			const [created] = await db
				.insert(tables.voucher)
				.values({
					code,
					depositAmount: String(body.depositAmount ?? 0),
					globalUsageLimit: body.globalUsageLimit ?? 1,
					orgUsageLimit: body.orgUsageLimit ?? 1,
					expiresAt: expiresAt ?? undefined,
					isActive: body.isActive ?? true,
				})
				.returning();

			return c.json({ voucher: created });
		} catch (err: any) {
			// Postgres unique violation
			if (err?.code === "23505") {
				lastError = err;
				continue;
			}
			throw err;
		}
	}

	logger.error("Failed to generate unique voucher code after max attempts", {
		lastError,
	});
	throw new HTTPException(500, {
		message: "Failed to generate a unique voucher code. Please try again.",
	});
});

admin.openapi(listVouchersRoute, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, { message: "Admin access required" });
	}

	const { page, pageSize } = c.req.valid("query");
	const offset = (page - 1) * pageSize;

	// Total count (separate query to avoid GROUP BY side-effects)
	const [{ total }] = await db.select({ total: count() }).from(tables.voucher);

	// List with aggregates
	const rows = await db
		.select({
			id: tables.voucher.id,
			code: tables.voucher.code,
			depositAmount: tables.voucher.depositAmount,
			globalUsageLimit: tables.voucher.globalUsageLimit,
			orgUsageLimit: tables.voucher.orgUsageLimit,
			expiresAt: tables.voucher.expiresAt,
			isActive: tables.voucher.isActive,
			createdAt: tables.voucher.createdAt,
			updatedAt: tables.voucher.updatedAt,
			totalRedemptionsAllOrgs:
				sql<number>`COUNT(DISTINCT ${tables.voucherLog.id})`.as(
					"totalRedemptionsAllOrgs",
				),
		})
		.from(tables.voucher)
		.leftJoin(
			tables.voucherLog,
			eq(tables.voucherLog.voucherId, tables.voucher.id),
		)
		.groupBy(tables.voucher.id)
		.orderBy(desc(tables.voucher.createdAt))
		.limit(pageSize)
		.offset(offset);

	const items = rows.map((r) => ({
		...r,
		totalRedemptionsAllOrgs: Number(r.totalRedemptionsAllOrgs),
	}));

	return c.json({ items, total: Number(total), page, pageSize });
});

admin.openapi(getVoucherRoute, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, { message: "Admin access required" });
	}

	const { id } = c.req.valid("param");

	const [row] = await db
		.select({
			id: tables.voucher.id,
			code: tables.voucher.code,
			depositAmount: tables.voucher.depositAmount,
			globalUsageLimit: tables.voucher.globalUsageLimit,
			orgUsageLimit: tables.voucher.orgUsageLimit,
			expiresAt: tables.voucher.expiresAt,
			isActive: tables.voucher.isActive,
			createdAt: tables.voucher.createdAt,
			updatedAt: tables.voucher.updatedAt,
			totalRedemptionsAllOrgs:
				sql<number>`COUNT(DISTINCT ${tables.voucherLog.id})`.as(
					"totalRedemptionsAllOrgs",
				),
		})
		.from(tables.voucher)
		.leftJoin(
			tables.voucherLog,
			eq(tables.voucherLog.voucherId, tables.voucher.id),
		)
		.where(eq(tables.voucher.id, id))
		.groupBy(tables.voucher.id);

	if (!row) {
		throw new HTTPException(404, { message: "Voucher not found" });
	}

	return c.json({
		voucher: {
			...row,
			totalRedemptionsAllOrgs: Number(row.totalRedemptionsAllOrgs),
		},
	});
});

admin.openapi(deleteVoucherRoute, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	if (!isAdminEmail(authUser.email)) {
		throw new HTTPException(403, { message: "Admin access required" });
	}

	const { id } = c.req.valid("param");

	const existing = await db.query.voucher.findFirst({
		where: { id },
		columns: { id: true },
	});

	if (!existing) {
		throw new HTTPException(404, { message: "Voucher not found" });
	}

	await db.delete(tables.voucher).where(eq(tables.voucher.id, id));

	return c.json({ success: true });
});

export default admin;
