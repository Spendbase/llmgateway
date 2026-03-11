import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { getLowBalanceAlertEmail } from "@/emails/templates/low-balance-alert.js";
import { sendTransactionalEmail } from "@/utils/email.js";

import { db, eq, tables } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

import type { ServerTypes } from "@/vars.js";

export const internalBilling = new OpenAPIHono<ServerTypes>();

const sendLowBalanceAlertRoute = createRoute({
	operationId: "internal_send_low_balance_alert",
	summary: "Send low balance alert email",
	description:
		"Internal endpoint called by the worker to send low balance alert emails to organization recipients.",
	method: "post",
	path: "/low-balance-alert",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						organizationId: z.string(),
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
					}),
				},
			},
			description: "Low balance alert emails sent successfully.",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Unauthorized. Missing or invalid internal secret.",
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
		409: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Organization no longer qualifies for low balance alert.",
		},
		500: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Failed to send low balance alert emails.",
		},
	},
});

internalBilling.openapi(sendLowBalanceAlertRoute, async (c) => {
	// 1. Validate internal secret
	const expectedSecret = process.env.INTERNAL_API_SECRET;
	const providedSecret = c.req.header("X-Internal-Secret");

	if (!expectedSecret || providedSecret !== expectedSecret) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	const { organizationId } = c.req.valid("json");

	// 2. Fetch organization with alert recipients
	const org = await db.query.organization.findFirst({
		where: {
			id: {
				eq: organizationId,
			},
		},
		with: {
			alertRecipients: true,
		},
	});

	if (!org || org.status === "deleted") {
		return c.json({ message: "Organization not found" }, 404);
	}

	// 3. Re-check alert eligibility from fresh DB state
	if (!org.lowBalanceAlertEnabled) {
		return c.json({ message: "Low balance alert is disabled" }, 409);
	}

	if (!org.lowBalanceAlertThreshold) {
		return c.json({ message: "Low balance alert threshold is not set" }, 409);
	}

	const currentBalance = Number(org.credits || 0);
	const threshold = Number(org.lowBalanceAlertThreshold);

	if (currentBalance >= threshold) {
		return c.json(
			{
				message: "Organization balance is no longer below threshold",
			},
			409,
		);
	}

	if (org.lowBalanceAlertLastStateBelow) {
		return c.json(
			{
				message:
					"Low balance alert already sent for current below-threshold state",
			},
			409,
		);
	}

	if (!org.alertRecipients || org.alertRecipients.length === 0) {
		return c.json({ message: "No alert recipients configured" }, 409);
	}

	// 4. Deduplicate recipients as an extra safeguard
	const uniqueEmails = [...new Set(org.alertRecipients.map((r) => r.email))];

	// 5. Generate email HTML
	const html = getLowBalanceAlertEmail({
		orgName: org.name,
		currentBalance,
		threshold,
	});

	// 6. Send email to every unique recipient, tracking successes
	const subject = `Low balance alert: ${org.name}`;
	let sentCount = 0;

	for (const email of uniqueEmails) {
		try {
			await sendTransactionalEmail({
				to: email,
				subject,
				html,
			});
			sentCount++;
		} catch (error) {
			logger.error(
				`Failed to send low balance alert to ${email} for org ${organizationId}`,
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	}

	// 7. Only set latch if at least one email was sent successfully
	if (sentCount === 0) {
		return c.json({ message: "Failed to send low balance alert emails" }, 500);
	}

	await db
		.update(tables.organization)
		.set({
			lowBalanceAlertLastStateBelow: true,
		})
		.where(eq(tables.organization.id, organizationId));

	logger.info(
		`Low balance alert sent for organization ${organizationId} to ${sentCount}/${uniqueEmails.length} recipient(s)`,
	);

	return c.json({ success: true }, 200);
});
