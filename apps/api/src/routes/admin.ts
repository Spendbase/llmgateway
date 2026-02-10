import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { trace } from "@opentelemetry/api";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import {
	and,
	db,
	desc,
	eq,
	gte,
	lt,
	sql,
	tables,
	inArray,
} from "@llmgateway/db";
import { costCounter } from "@llmgateway/instrumentation";

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
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						organizations: z.array(organizationSchema).openapi({}),
					}),
				},
			},
			description: "List of all organizations",
		},
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
				.default(20)
				.openapi({ example: 20 }),
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

	const activeSpan = trace.getActiveSpan();
	if (activeSpan) {
		activeSpan.setAttribute("user_id", user.id);
	}

	const organizations = await db
		.select()
		.from(tables.organization)
		.where(eq(tables.organization.status, "active"))
		.orderBy(desc(tables.organization.createdAt));

	return c.json({
		organizations,
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

		costCounter.add(result.transaction.creditAmount, {
			organizationId,
			userId: authUser.id,
			type: "deposit_credits",
		});

		return c.json({
			success: true,
			...result,
		});
	} catch (err: any) {
		if (err.message === "ORGANIZATION_NOT_FOUND") {
			throw new HTTPException(404, { message: "Organization not found" });
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

	const [totalUsersResult] = await db
		.select({ count: sql<number>`COUNT(*)`.as("count") })
		.from(tables.user);

	const totalUsers = Number(totalUsersResult?.count ?? 0);
	const totalPages = Math.ceil(totalUsers / pageSize);

	const usersData = await db
		.select({
			id: tables.user.id,
			name: tables.user.name,
			email: tables.user.email,
			emailVerified: tables.user.emailVerified,
			createdAt: tables.user.createdAt,
		})
		.from(tables.user)
		.orderBy(desc(tables.user.createdAt))
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

export default admin;
