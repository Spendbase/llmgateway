import { and, db, eq, sql, tables } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

const REFERRAL_DEPOSIT_THRESHOLD = 50;
const REFERRAL_REWARD_AMOUNT = 20;

/**
 * If the organization was referred and has deposited at least $50 (sum of
 * completed credit_topup amounts in dollars), grant $20 to the referrer
 * once. Called after any credit top-up (Stripe, admin, etc.).
 */
export async function grantReferralReward(
	referredOrganizationId: string,
): Promise<void> {
	try {
		const referralRecord = await db.query.referral.findFirst({
			where: {
				referredOrganizationId: { eq: referredOrganizationId },
				rewardGranted: { eq: false },
			},
		});

		if (!referralRecord) {
			return;
		}

		const [row] = await db
			.select({
				total: sql<string>`COALESCE(SUM(${tables.transaction.amount}::numeric), 0)`,
			})
			.from(tables.transaction)
			.where(
				and(
					eq(tables.transaction.organizationId, referredOrganizationId),
					eq(tables.transaction.type, "credit_topup"),
					eq(tables.transaction.status, "completed"),
					sql`${tables.transaction.amount}::numeric > 0`,
				),
			);

		const totalDeposited = parseFloat(row?.total ?? "0");
		if (totalDeposited < REFERRAL_DEPOSIT_THRESHOLD) {
			return;
		}

		await db
			.update(tables.organization)
			.set({
				credits: sql`${tables.organization.credits} + ${REFERRAL_REWARD_AMOUNT}`,
				referralEarnings: sql`${tables.organization.referralEarnings} + ${REFERRAL_REWARD_AMOUNT}`,
			})
			.where(eq(tables.organization.id, referralRecord.referrerOrganizationId));

		await db
			.update(tables.referral)
			.set({ rewardGranted: true })
			.where(eq(tables.referral.id, referralRecord.id));

		await db.insert(tables.transaction).values({
			organizationId: referralRecord.referrerOrganizationId,
			type: "credit_topup",
			amount: "0",
			creditAmount: String(REFERRAL_REWARD_AMOUNT),
			status: "completed",
			description: `Referral reward: referred user deposited $${totalDeposited.toFixed(2)}+`,
			currency: "USD",
		});

		logger.info(
			`Granted $${REFERRAL_REWARD_AMOUNT} referral reward to org ${referralRecord.referrerOrganizationId} (referred org ${referredOrganizationId} deposited $${totalDeposited.toFixed(2)})`,
		);
	} catch (err) {
		logger.error("Error processing referral reward:", err as Error);
	}
}
