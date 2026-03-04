import { stripe } from "@/routes/payments.js";

import { and, db, eq, sql, tables } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

const REFERRAL_DEPOSIT_THRESHOLD = 50;
const REFERRAL_REWARD_AMOUNT = 20;

/**
 * If the organization was referred and has deposited at least $50 (sum of
 * completed credit_topup paid amounts), grant $20 to the referrer once.
 *
 * Uses an atomic UPDATE with a WHERE guard on rewardGranted = false so that
 * concurrent calls for the same referred org cannot double-grant the reward.
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

		const referredPaymentMethods = await db.query.paymentMethod.findMany({
			where: { organizationId: { eq: referredOrganizationId } },
		});
		const referrerPaymentMethods = await db.query.paymentMethod.findMany({
			where: {
				organizationId: { eq: referralRecord.referrerOrganizationId },
			},
		});

		if (
			referredPaymentMethods.length > 0 &&
			referrerPaymentMethods.length > 0
		) {
			const getFingerprints = async (
				methods: typeof referredPaymentMethods,
			) => {
				const fingerprints = new Set<string>();
				for (const pm of methods) {
					try {
						const sp = await stripe.paymentMethods.retrieve(
							pm.stripePaymentMethodId,
						);
						if (sp.card?.fingerprint) {
							fingerprints.add(sp.card.fingerprint);
						}
					} catch {}
				}
				return fingerprints;
			};

			const referredFingerprints = await getFingerprints(
				referredPaymentMethods,
			);
			const referrerFingerprints = await getFingerprints(
				referrerPaymentMethods,
			);

			const hasOverlap = [...referredFingerprints].some((fingerprint) =>
				referrerFingerprints.has(fingerprint),
			);

			if (hasOverlap) {
				logger.warn("Referral reward blocked: same card fingerprint detected", {
					referredOrganizationId,
					referrerOrganizationId: referralRecord.referrerOrganizationId,
				});
				return;
			}
		}

		await db.transaction(async (tx) => {
			const claimed = await tx
				.update(tables.referral)
				.set({ rewardGranted: true })
				.where(
					and(
						eq(tables.referral.id, referralRecord.id),
						eq(tables.referral.rewardGranted, false),
					),
				)
				.returning({ id: tables.referral.id });

			if (claimed.length === 0) {
				return;
			}

			await tx
				.update(tables.organization)
				.set({
					credits: sql`${tables.organization.credits} + ${REFERRAL_REWARD_AMOUNT}`,
					referralEarnings: sql`${tables.organization.referralEarnings} + ${REFERRAL_REWARD_AMOUNT}`,
				})
				.where(
					eq(tables.organization.id, referralRecord.referrerOrganizationId),
				);

			await tx.insert(tables.transaction).values({
				organizationId: referralRecord.referrerOrganizationId,
				type: "credit_topup",
				amount: "0",
				creditAmount: String(REFERRAL_REWARD_AMOUNT),
				status: "completed",
				description: `Referral reward: referred user deposited $${totalDeposited.toFixed(2)}+`,
				currency: "USD",
			});
		});

		logger.info(
			`Granted $${REFERRAL_REWARD_AMOUNT} referral reward to org ${referralRecord.referrerOrganizationId} (referred org ${referredOrganizationId} deposited $${totalDeposited.toFixed(2)})`,
		);
	} catch (err) {
		logger.error("Error processing referral reward:", err as Error);
	}
}
