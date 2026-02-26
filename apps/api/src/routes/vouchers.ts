import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db, eq, sql, tables } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const vouchers = new OpenAPIHono<ServerTypes>();

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

const redeemVoucherSchema = z.object({
	code: z.string().trim().min(1).openapi({ example: "PROMO2025" }),
});

const redeemVoucherResponseSchema = z.object({
	success: z.boolean(),
	creditAmount: z.number(),
	transactionId: z.string(),
});

// ─────────────────────────────────────────────
// Route definition
// ─────────────────────────────────────────────

const redeemVoucher = createRoute({
	method: "post",
	path: "/redeem",
	request: {
		body: {
			required: true,
			content: {
				"application/json": {
					schema: redeemVoucherSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: redeemVoucherResponseSchema,
				},
			},
			description: "Voucher redeemed successfully",
		},
		401: { description: "Unauthorized" },
		403: {
			description: "Forbidden — voucher inactive, expired, or limit reached",
		},
		404: { description: "Voucher or organization not found" },
		500: { description: "Internal Server Error" },
	},
});

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────

vouchers.openapi(redeemVoucher, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}

	// Resolve org from user context (repo convention — first matched org)
	const userOrganization = await db.query.userOrganization.findFirst({
		where: { userId: user.id },
		with: { organization: true },
	});

	if (!userOrganization?.organization) {
		throw new HTTPException(404, { message: "Organization not found" });
	}

	const organizationId = userOrganization.organization.id;

	// Normalize code before lookup
	const { code } = c.req.valid("json");
	const normalizedCode = code.trim().toUpperCase();

	// Pre-flight reads outside the transaction (cheap, no locks yet)
	const voucher = await db.query.voucher.findFirst({
		where: { code: normalizedCode },
	});

	if (!voucher) {
		throw new HTTPException(404, { message: "Voucher not found" });
	}

	if (!voucher.isActive) {
		throw new HTTPException(403, { message: "Voucher is not active" });
	}

	const now = new Date();
	if (voucher.expiresAt !== null && voucher.expiresAt <= now) {
		throw new HTTPException(403, { message: "Voucher has expired" });
	}

	// ── Transactional section ──────────────────────────────────────────────
	const result = await db.transaction(async (tx) => {
		// Step 1: Lock voucher row FOR UPDATE — prevents concurrent redemptions
		await tx.execute(
			sql`SELECT id FROM voucher WHERE id = ${voucher.id} FOR UPDATE`,
		);

		// Step 2: Count-based limit checks (inside tx, so reads are serialised after locks)

		// Global limit
		const globalResult = await tx.execute(
			sql`SELECT COUNT(*) AS cnt FROM voucher_log
				WHERE voucher_id = ${voucher.id}`,
		);
		const globalCount = Number(
			(globalResult.rows[0] as { cnt: string } | undefined)?.cnt ?? 0,
		);

		if (globalCount >= voucher.globalUsageLimit) {
			throw new HTTPException(403, {
				message: "Voucher redemption limit has been reached",
			});
		}

		// Org limit
		const orgCountResult = await tx.execute(
			sql`SELECT COUNT(*) AS cnt FROM voucher_log
				WHERE voucher_id = ${voucher.id}
				  AND organization_id = ${organizationId}`,
		);
		const orgCount = Number(
			(orgCountResult.rows[0] as { cnt: string } | undefined)?.cnt ?? 0,
		);

		if (orgCount >= voucher.orgUsageLimit) {
			throw new HTTPException(403, {
				message: "Voucher limit for your organization has been reached",
			});
		}

		// Step 3: Create the transaction record
		const [newTx] = await tx
			.insert(tables.transaction)
			.values({
				organizationId,
				type: "credit_topup",
				amount: "0",
				creditAmount: voucher.depositAmount,
				status: "completed",
				currency: "USD",
				description: `Voucher redemption: ${voucher.code}`,
				createdAt: new Date(),
			})
			.returning();

		// Step 4: Credit the organisation balance
		await tx
			.update(tables.organization)
			.set({
				credits: sql`${tables.organization.credits} + ${voucher.depositAmount}`,
			})
			.where(eq(tables.organization.id, organizationId));

		// Step 5: Record the redemption (transactionId NOT NULL — must be after step 3)
		await tx.insert(tables.voucherLog).values({
			voucherId: voucher.id,
			organizationId,
			userId: user.id,
			transactionId: newTx.id,
			redeemedAt: new Date(),
		});

		return { transactionId: newTx.id };
	});

	return c.json({
		success: true,
		creditAmount: Number(voucher.depositAmount),
		transactionId: result.transactionId,
	});
});
