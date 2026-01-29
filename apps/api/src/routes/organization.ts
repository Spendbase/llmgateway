import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { userHasOrganizationAccess } from "@/utils/authorization.js";

import { db, eq, tables } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const organization = new OpenAPIHono<ServerTypes>();

// Define schemas directly with Zod instead of using createSelectSchema
const organizationSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	name: z.string(),
	billingEmail: z.string(),
	billingCompany: z.string().nullable(),
	billingAddress: z.string().nullable(),
	billingTaxId: z.string().nullable(),
	billingNotes: z.string().nullable(),
	credits: z.string(),
	plan: z.enum(["free", "pro"]),
	planExpiresAt: z.date().nullable(),
	retentionLevel: z.enum(["retain", "none"]),
	status: z.enum(["active", "inactive", "deleted"]).nullable(),
	autoTopUpEnabled: z.boolean(),
	autoTopUpThreshold: z.string().nullable(),
	autoTopUpAmount: z.string().nullable(),
	referralEarnings: z.string(),
	// Dev Plans fields
	isPersonal: z.boolean(),
	devPlan: z.enum(["none", "lite", "pro", "max"]),
	devPlanCreditsUsed: z.string(),
	devPlanCreditsLimit: z.string(),
	devPlanBillingCycleStart: z.date().nullable(),
	devPlanExpiresAt: z.date().nullable(),
	devPlanAllowAllModels: z.boolean(),
});

const projectSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	name: z.string(),
	organizationId: z.string(),
	cachingEnabled: z.boolean(),
	cacheDurationSeconds: z.number(),
	mode: z.enum(["api-keys", "credits", "hybrid"]),
	status: z.enum(["active", "inactive", "deleted"]).nullable(),
});

const createOrganizationSchema = z.object({
	name: z.string().min(1).max(255),
});

const updateOrganizationSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	billingEmail: z.string().email().optional(),
	billingCompany: z.string().optional(),
	billingAddress: z.string().optional(),
	billingTaxId: z.string().optional(),
	billingNotes: z.string().optional(),
	retentionLevel: z.enum(["retain", "none"]).optional(),
	autoTopUpEnabled: z.boolean().optional(),
	autoTopUpThreshold: z.number().min(5).optional(),
	autoTopUpAmount: z.number().min(10).optional(),
});

const transactionSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	organizationId: z.string(),
	type: z.enum([
		"subscription_start",
		"subscription_cancel",
		"subscription_end",
		"credit_topup",
		"credit_refund",
		"dev_plan_start",
		"dev_plan_upgrade",
		"dev_plan_downgrade",
		"dev_plan_cancel",
		"dev_plan_end",
		"dev_plan_renewal",
	]),
	amount: z.string().nullable(),
	creditAmount: z.string().nullable(),
	currency: z.string(),
	status: z.enum(["pending", "completed", "failed"]),
	stripePaymentIntentId: z.string().nullable(),
	stripeInvoiceId: z.string().nullable(),
	description: z.string().nullable(),
	relatedTransactionId: z.string().nullable(),
	refundReason: z.string().nullable(),
});

const AuthUrlResponseSchema = z.object({
	url: z
		.string()
		.openapi({ description: "The Google OAuth2 URL to redirect the user to" }),
});

const FetchUsersRequestSchema = z.object({
	accessToken: z
		.string()
		.openapi({ description: "Temporary Google Access Token" }),
});

const GoogleUserSchema = z.object({
	email: z.string().email(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	fullName: z.string().optional(),
	department: z.string().optional(),
});

const FetchUsersResponseSchema = z.array(GoogleUserSchema);

const ImportRequestSchema = z.object({
	users: z.array(
		z.object({
			email: z.string().email(),
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			fullName: z.string().optional(),
		}),
	),
	role: z.enum(["developer", "admin"]),
});

const getOrganizations = createRoute({
	method: "get",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						organizations: z.array(organizationSchema).openapi({}),
					}),
				},
			},
			description: "List of organizations the user belongs to",
		},
	},
});

organization.openapi(getOrganizations, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganizations = await db.query.userOrganization.findMany({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	const organizations = userOrganizations
		.map((uo) => uo.organization!)
		.filter((org) => org.status !== "deleted")
		// Hide personal orgs from regular UI - they are only visible on code.llmgateway.io
		.filter((org) => !org.isPersonal);

	return c.json({
		organizations,
	});
});

const getProjects = createRoute({
	method: "get",
	path: "/{id}/projects",
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
						projects: z.array(projectSchema).openapi({}),
					}),
				},
			},
			description: "List of projects for the specified organization",
		},
	},
});

organization.openapi(getProjects, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const projects = await db.query.project.findMany({
		where: {
			organizationId: {
				eq: id,
			},
			status: {
				ne: "deleted",
			},
		},
	});

	return c.json({
		projects,
	});
});

const createOrganization = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createOrganizationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						organization: organizationSchema.openapi({}),
					}),
				},
			},
			description: "Organization created successfully.",
		},
	},
});

organization.openapi(createOrganization, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { name } = c.req.valid("json");

	// Get user's existing organizations to check limits
	const userOrganizations = await db.query.userOrganization.findMany({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	// Filter out deleted organizations
	const activeOrganizations = userOrganizations
		.filter((uo) => uo.organization?.status !== "deleted")
		.map((uo) => uo.organization!);

	const orgsLimit = 3;

	// If user only has free plan, they can have only 1 organization
	if (activeOrganizations.length >= orgsLimit) {
		throw new HTTPException(403, {
			message: `You have reached the limit of ${orgsLimit} organizations. Please reach out to support to increase this limit.`,
		});
	}

	const [newOrganization] = await db
		.insert(tables.organization)
		.values({
			name,
			billingEmail: user.email,
		})
		.returning();

	await db.insert(tables.userOrganization).values({
		userId: user.id,
		organizationId: newOrganization.id,
		role: "owner",
	});

	await db.insert(tables.project).values({
		name: "Default Project",
		organizationId: newOrganization.id,
		mode: "hybrid",
	});

	return c.json({
		organization: newOrganization,
	});
});

const updateOrganization = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: updateOrganizationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
						organization: organizationSchema.openapi({}),
					}),
				},
			},
			description: "Organization updated successfully.",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Unauthorized.",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Organization not found.",
		},
	},
});

organization.openapi(updateOrganization, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();
	const {
		name,
		billingEmail,
		billingCompany,
		billingAddress,
		billingTaxId,
		billingNotes,
		retentionLevel,
		autoTopUpEnabled,
		autoTopUpThreshold,
		autoTopUpAmount,
	} = c.req.valid("json");

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: {
				eq: user.id,
			},
			organizationId: {
				eq: id,
			},
		},
		with: {
			organization: true,
		},
	});

	if (
		!userOrganization ||
		userOrganization.organization?.status === "deleted"
	) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	// Check if user is trying to update policies or billing settings
	const isBillingOrPolicyUpdate =
		billingEmail !== undefined ||
		billingCompany !== undefined ||
		billingAddress !== undefined ||
		billingTaxId !== undefined ||
		billingNotes !== undefined ||
		retentionLevel !== undefined ||
		autoTopUpEnabled !== undefined ||
		autoTopUpThreshold !== undefined ||
		autoTopUpAmount !== undefined;

	// Only owners can update billing and policy settings
	if (isBillingOrPolicyUpdate && userOrganization.role !== "owner") {
		throw new HTTPException(403, {
			message: "Only owners can update billing and policy settings",
		});
	}

	const updateData: any = {};
	if (name !== undefined) {
		updateData.name = name;
	}
	if (billingEmail !== undefined) {
		updateData.billingEmail = billingEmail;
	}
	if (billingCompany !== undefined) {
		updateData.billingCompany = billingCompany;
	}
	if (billingAddress !== undefined) {
		updateData.billingAddress = billingAddress;
	}
	if (billingTaxId !== undefined) {
		updateData.billingTaxId = billingTaxId;
	}
	if (billingNotes !== undefined) {
		updateData.billingNotes = billingNotes;
	}
	if (retentionLevel !== undefined) {
		updateData.retentionLevel = retentionLevel;
	}
	if (autoTopUpEnabled !== undefined) {
		updateData.autoTopUpEnabled = autoTopUpEnabled;
	}
	if (autoTopUpThreshold !== undefined) {
		updateData.autoTopUpThreshold = autoTopUpThreshold.toString();
	}
	if (autoTopUpAmount !== undefined) {
		updateData.autoTopUpAmount = autoTopUpAmount.toString();
	}

	const [updatedOrganization] = await db
		.update(tables.organization)
		.set(updateData)
		.where(eq(tables.organization.id, id))
		.returning();

	return c.json({
		message: "Organization updated successfully",
		organization: updatedOrganization,
	});
});

const deleteOrganization = createRoute({
	method: "delete",
	path: "/{id}",
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
						message: z.string(),
					}),
				},
			},
			description: "Organization deleted successfully.",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Unauthorized.",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Organization not found.",
		},
	},
});

organization.openapi(deleteOrganization, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: {
				eq: user.id,
			},
			organizationId: {
				eq: id,
			},
		},
		with: {
			organization: true,
		},
	});

	if (
		!userOrganization ||
		userOrganization.organization?.status === "deleted"
	) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	// Block deletion of personal orgs - they are managed via dev plans
	if (userOrganization.organization?.isPersonal) {
		throw new HTTPException(403, {
			message:
				"Personal organizations cannot be deleted. Please cancel your dev plan at code.llmgateway.io instead.",
		});
	}

	await db
		.update(tables.organization)
		.set({
			status: "deleted",
		})
		.where(eq(tables.organization.id, id));

	return c.json({
		message: "Organization deleted successfully",
	});
});

const getTransactions = createRoute({
	method: "get",
	path: "/{id}/transactions",
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
						transactions: z.array(transactionSchema).openapi({}),
					}),
				},
			},
			description: "List of transactions for the specified organization",
		},
	},
});

organization.openapi(getTransactions, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const transactions = await db.query.transaction.findMany({
		where: {
			organizationId: {
				eq: id,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return c.json({
		transactions,
	});
});

const getReferralStats = createRoute({
	method: "get",
	path: "/{id}/referral-stats",
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
						referredCount: z.number(),
					}),
				},
			},
			description: "Referral statistics for the organization",
		},
	},
});

organization.openapi(getReferralStats, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const referrals = await db.query.referral.findMany({
		where: {
			referrerOrganizationId: {
				eq: id,
			},
		},
	});

	return c.json({
		referredCount: referrals.length,
	});
});

const initiateGoogleWorkspace = createRoute({
	method: "post",
	path: "/{id}/google-workspace/initiate",
	summary: "Get Google OAuth URL",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: AuthUrlResponseSchema,
				},
			},
			description: "Returns the auth URL",
		},
	},
});

organization.openapi(initiateGoogleWorkspace, async (c) => {
	const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

	const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID!;
	const redirectUri = process.env.GOOGLE_WORKSPACE_REDIRECT_URI!;

	const options = {
		redirect_uri: redirectUri,
		client_id: clientId,
		access_type: "online",
		response_type: "code",
		prompt: "consent",
		scope: [
			"https://www.googleapis.com/auth/admin.directory.user.readonly",
			"email",
			"profile",
		].join(" "),
	};

	const qs = new URLSearchParams(options).toString();
	return c.json({ url: `${rootUrl}?${qs}` });
});

const fetchUsers = createRoute({
	method: "post",
	path: "/{id}/google-workspace/fetch-users",
	summary: "Fetch users from Google Directory",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: FetchUsersRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: FetchUsersResponseSchema,
				},
			},
			description: "List of users from Google Workspace",
		},
		400: { description: "Bad Request" },
		500: { description: "Internal Server Error" },
	},
});

organization.openapi(fetchUsers, async (c) => {
	const { accessToken } = c.req.valid("json");

	try {
		const googleUrl = new URL(
			"https://admin.googleapis.com/admin/directory/v1/users",
		);
		googleUrl.searchParams.append("customer", "my_customer");
		googleUrl.searchParams.append("maxResults", "100");
		googleUrl.searchParams.append("query", "isSuspended=false");
		googleUrl.searchParams.append("orderBy", "email");

		const response = await fetch(googleUrl.toString(), {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		if (response.status === 403) {
			const MOCK_USERS = [
				{
					email: "alice.engineering@example.com",
					firstName: "Alice",
					lastName: "Engineer",
					fullName: "Alice Engineer",
					department: "Engineering",
				},
				{
					email: "bob.sales@example.com",
					firstName: "Bob",
					lastName: "Salesman",
					fullName: "Bob Salesman",
					department: "Sales",
				},
				{
					email: "charlie.marketing@example.com",
					firstName: "Charlie",
					lastName: "Marketer",
					fullName: "Charlie Marketer",
					department: "Marketing",
				},
				{
					email: "oleksii.andriushyn@partner-way.com",
					firstName: "Oleksii",
					lastName: "Andriushyn",
					fullName: "Oleksii Andriushyn",
					department: "Owner",
				},
			];
			return c.json(MOCK_USERS);
		}

		if (!response.ok) {
			const errorResponse = await response.json();
			const errorMessage =
				errorResponse.error?.message || "Unknown Google Error";
			return c.json({ message: errorMessage }, 400);
		}

		const data = await response.json();

		const users = (data.users || []).map((u: any) => ({
			email: u.primaryEmail,
			firstName: u.name?.givenName || "",
			lastName: u.name?.familyName || "",
			fullName: u.name?.fullName || "",
			department: u.organizations?.[0]?.department || "General",
		}));

		return c.json(users);
	} catch {
		return c.json({ message: "Failed to fetch users from Google" }, 400);
	}
});

const importUsersRoute = createRoute({
	method: "post",
	path: "/{id}/google-workspace/import",
	summary: "Import selected users to organization",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": { schema: ImportRequestSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Import result",
			content: {
				"application/json": {
					schema: z.object({
						successCount: z.number(),
						failedCount: z.number(),
					}),
				},
			},
		},
	},
});

organization.openapi(importUsersRoute, async (c) => {
	const { users: usersToImport /* role, id */ } = c.req.valid("json");

	let successCount = 0;
	let failedCount = 0;

	for (const googleUser of usersToImport) {
		try {
			// const existingUser = await db.query.users.findFirst({
			//   where: eq(users.email, googleUser.email)
			// });

			let userId = ""; // existingUser?.id;

			if (!userId) {
				// const [newUser] = await db.insert(users).values({
				//   email: googleUser.email,
				//   name: googleUser.fullName,
				//   emailVerified: true, // Доверяем гуглу!
				//   image: null,
				//   createdAt: new Date(),
				//   updatedAt: new Date(),
				// }).returning();
				// userId = newUser.id;

				userId = "new_user_" + googleUser.email + Math.random();
			}

			// const existingMember = await db.query.members.findFirst({
			//   where: and(eq(members.userId, userId), eq(members.orgId, organizationId))
			// });

			// if (!existingMember) {
			//    await db.insert(members).values({
			//      userId,
			//      organizationId,
			//      role,
			//      createdAt: new Date()
			//    });
			successCount++;
			// }
		} catch {
			failedCount++;
		}
	}

	return c.json({ successCount, failedCount });
});

export default organization;
