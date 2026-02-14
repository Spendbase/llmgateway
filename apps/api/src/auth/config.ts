import { instrumentBetterAuth } from "@kubiks/otel-better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { passkey } from "better-auth/plugins/passkey";
import { Redis } from "ioredis";

import { getResetPasswordEmail } from "@/emails/templates/reset-password.js";
import { getVerifyEmail } from "@/emails/templates/verify-email.js";
import { validateEmail } from "@/utils/email-validation.js";
import { sendTransactionalEmail } from "@/utils/email.js";

import { db, eq, tables, shortid } from "@llmgateway/db";
import { signupCounter } from "@llmgateway/instrumentation";
import { logger } from "@llmgateway/logger";

const apiUrl = process.env.API_URL || "http://localhost:4002";
const cookieDomain = process.env.COOKIE_DOMAIN || "localhost";
const uiUrl = process.env.UI_URL || "http://localhost:3002";
const originUrls =
	process.env.ORIGIN_URLS ||
	"http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:4002,http://localhost:3006";
const isHosted = process.env.HOSTED === "true";

export const redisClient = new Redis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
	password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err: unknown) =>
	logger.error(
		"Redis Client Error for auth",
		err instanceof Error ? err : new Error(String(err)),
	),
);

export interface RateLimitConfig {
	keyPrefix: string;
	windowSizeMs: number;
	maxRequests: number;
}

export interface RateLimitResult {
	allowed: boolean;
	resetTime: number;
	remaining: number;
}

/**
 * Check and record password reset attempt with strict rate limiting
 * Limit: 3 requests per hour per email
 */
/**
 * specific helper to mask email for logging privacy
 * retains first char of local part + domain
 */
function maskEmail(email: string): string {
	const parts = email.split("@");
	if (parts.length < 2) {
		return email;
	}
	const [local, ...domainParts] = parts;
	const domain = domainParts.join("@");
	if (local.length === 0) {
		return `***@${domain}`;
	}
	return `${local[0]}***@${domain}`;
}

export async function checkResetPasswordRateLimit(
	email: string,
): Promise<RateLimitResult> {
	// Normalize email to prevent bypasses
	const normalizedEmail = email.toLowerCase().trim();
	const key = `reset_password_limit:${normalizedEmail}`;
	const now = Date.now();
	const windowSizeMs = 60 * 60 * 1000; // 1 hour
	const maxRequests = 3;

	try {
		// Redis transaction to check and update count with atomic expire
		const pipeline = redisClient.pipeline();
		// Simple Fixed Window approach:
		pipeline.incr(key);
		pipeline.expire(key, 60 * 60, "NX"); // Set expiry only if key has no expiry
		pipeline.ttl(key);
		const results = await pipeline.exec();

		if (!results) {
			throw new Error("Redis pipeline execution failed");
		}

		const count = (results[0][1] as number) || 1;
		const ttl = (results[2][1] as number) || -1;

		if (count > maxRequests) {
			logger.warn("Password reset rate limit exceeded", {
				email: maskEmail(normalizedEmail),
				count,
			});
			return {
				allowed: false,
				resetTime: now + (ttl > 0 ? ttl * 1000 : windowSizeMs),
				remaining: 0,
			};
		}

		return {
			allowed: true,
			resetTime: now + windowSizeMs,
			remaining: maxRequests - count,
		};
	} catch (error) {
		logger.error(
			"Password reset rate limit check failed",
			error instanceof Error ? error : new Error(String(error)),
		);
		// Fail open to avoid DOSing legitimate users if Redis is down, but log heavily
		return {
			allowed: true,
			resetTime: now + windowSizeMs,
			remaining: 0,
		};
	}
}

/**
 * Check and record signup attempt with exponential backoff
 * This applies to ALL signup attempts regardless of success/failure
 */
export async function checkAndRecordSignupAttempt(
	ipAddress: string,
): Promise<RateLimitResult> {
	const key = `signup_rate_limit:${ipAddress}`;
	const attemptsKey = `signup_rate_limit_attempts:${ipAddress}`;
	const now = Date.now();

	try {
		const pipeline = redisClient.pipeline();
		pipeline.get(key);
		pipeline.get(attemptsKey);
		const results = await pipeline.exec();

		if (!results) {
			throw new Error("Redis pipeline execution failed");
		}

		const lastAttemptTime = results[0][1] as string | null;
		const attemptCount = parseInt((results[1][1] as string) || "0", 10);

		// Check if we're currently in a rate limit period
		if (lastAttemptTime && attemptCount > 0) {
			const lastTime = parseInt(lastAttemptTime, 10);
			const delayMs = Math.min(
				60 * 1000 * Math.pow(2, attemptCount - 1), // Start at 1 minute, double each time
				24 * 60 * 60 * 1000, // Cap at 24 hours
			);
			const resetTime = lastTime + delayMs;

			if (now < resetTime) {
				return {
					allowed: false,
					resetTime,
					remaining: 0,
				};
			}
		}

		// Allow the request and record the attempt
		const newAttemptCount = attemptCount + 1;
		const nextDelayMs = Math.min(
			60 * 1000 * Math.pow(2, newAttemptCount - 1), // Next delay
			24 * 60 * 60 * 1000, // Cap at 24 hours
		);
		const nextResetTime = now + nextDelayMs;

		// Update Redis with new attempt
		const updatePipeline = redisClient.pipeline();
		updatePipeline.set(key, now.toString());
		updatePipeline.set(attemptsKey, newAttemptCount.toString());
		updatePipeline.expire(key, Math.ceil((24 * 60 * 60 * 1000) / 1000)); // 24 hours
		updatePipeline.expire(attemptsKey, Math.ceil((24 * 60 * 60 * 1000) / 1000));
		await updatePipeline.exec();

		logger.debug("Signup attempt recorded", {
			ipAddress,
			attemptCount: newAttemptCount,
			nextDelayMs,
			nextResetTime,
		});

		return {
			allowed: true,
			resetTime: nextResetTime,
			remaining: 0,
		};
	} catch (error) {
		logger.error(
			"Signup attempt check failed",
			error instanceof Error ? error : new Error(String(error)),
		);

		// Fail open - allow the request if Redis is down
		return {
			allowed: true,
			resetTime: now,
			remaining: 0,
		};
	}
}

export async function checkEmailResendRateLimit(
	email: string,
): Promise<RateLimitResult> {
	const normalizedEmail = email.toLowerCase().trim();
	const key = `email_resend_limit:${normalizedEmail}`;
	const now = Date.now();
	const windowSizeSeconds = 60;

	try {
		const pipeline = redisClient.pipeline();
		pipeline.incr(key);
		pipeline.expire(key, windowSizeSeconds, "NX");
		pipeline.ttl(key);
		const results = await pipeline.exec();

		if (!results) {
			throw new Error("Redis pipeline execution failed");
		}

		const count = (results[0][1] as number) || 1;
		const ttl = (results[2][1] as number) || -1;

		if (count > 1) {
			logger.warn("Email resend rate limit exceeded", {
				email: maskEmail(normalizedEmail),
				count,
			});
			return {
				allowed: false,
				resetTime: now + (ttl > 0 ? ttl * 1000 : windowSizeSeconds * 1000),
				remaining: 0,
			};
		}

		return {
			allowed: true,
			resetTime: now + windowSizeSeconds * 1000,
			remaining: 0,
		};
	} catch (error) {
		logger.error(
			"Email resend rate limit check failed",
			error instanceof Error ? error : new Error(String(error)),
		);
		return { allowed: true, resetTime: now, remaining: 0 };
	}
}

export interface ExponentialRateLimitConfig {
	keyPrefix: string;
	baseDelayMs: number;
	maxDelayMs: number;
}

/**
 * Exponential backoff rate limiting function using Redis
 * Each failed attempt increases the delay exponentially
 */
export async function checkExponentialRateLimit(
	identifier: string,
	config: ExponentialRateLimitConfig,
): Promise<RateLimitResult> {
	const key = `${config.keyPrefix}:${identifier}`;
	const attemptsKey = `${config.keyPrefix}_attempts:${identifier}`;
	const now = Date.now();

	try {
		// Get the last attempt time and attempt count
		const pipeline = redisClient.pipeline();
		pipeline.get(key);
		pipeline.get(attemptsKey);
		const results = await pipeline.exec();

		if (!results) {
			throw new Error("Redis pipeline execution failed");
		}

		const lastAttemptTime = results[0][1] as string | null;
		const attemptCount = parseInt((results[1][1] as string) || "0", 10);

		if (lastAttemptTime) {
			const lastTime = parseInt(lastAttemptTime, 10);
			const delayMs = Math.min(
				config.baseDelayMs * Math.pow(2, attemptCount - 1),
				config.maxDelayMs,
			);
			const resetTime = lastTime + delayMs;

			if (now < resetTime) {
				// Still rate limited
				logger.debug("Exponential rate limit check", {
					identifier,
					attemptCount,
					delayMs,
					allowed: false,
					resetTime,
					remaining: 0,
				});

				return {
					allowed: false,
					resetTime,
					remaining: 0,
				};
			}
		}

		// Allow the request and record the attempt
		const newAttemptCount = attemptCount + 1;
		const nextDelayMs = Math.min(
			config.baseDelayMs * Math.pow(2, newAttemptCount - 1),
			config.maxDelayMs,
		);
		const nextResetTime = now + nextDelayMs;

		// Update Redis with new attempt
		const updatePipeline = redisClient.pipeline();
		updatePipeline.set(key, now.toString());
		updatePipeline.set(attemptsKey, newAttemptCount.toString());
		updatePipeline.expire(key, Math.ceil(config.maxDelayMs / 1000));
		updatePipeline.expire(attemptsKey, Math.ceil(config.maxDelayMs / 1000));
		await updatePipeline.exec();

		logger.debug("Exponential rate limit check", {
			identifier,
			attemptCount: newAttemptCount,
			nextDelayMs,
			allowed: true,
			nextResetTime,
			remaining: 0,
		});

		return {
			allowed: true,
			resetTime: nextResetTime,
			remaining: 0,
		};
	} catch (error) {
		logger.error(
			"Exponential rate limit check failed",
			error instanceof Error ? error : new Error(String(error)),
		);

		// Fail open - allow the request if Redis is down
		return {
			allowed: true,
			resetTime: now + config.baseDelayMs,
			remaining: 0,
		};
	}
}

/**
 * Reset exponential backoff for successful operations
 */
export async function resetExponentialRateLimit(
	identifier: string,
	config: ExponentialRateLimitConfig,
): Promise<void> {
	const key = `${config.keyPrefix}:${identifier}`;
	const attemptsKey = `${config.keyPrefix}_attempts:${identifier}`;

	try {
		const pipeline = redisClient.pipeline();
		pipeline.del(key);
		pipeline.del(attemptsKey);
		await pipeline.exec();

		logger.debug("Exponential rate limit reset", {
			identifier,
		});
	} catch (error) {
		logger.error(
			"Failed to reset exponential rate limit",
			error instanceof Error ? error : new Error(String(error)),
		);
	}
}

/**
 * Generic rate limiting function using sliding window with Redis
 * (kept for backward compatibility if needed elsewhere)
 */
export async function checkRateLimit(
	identifier: string,
	config: RateLimitConfig,
): Promise<RateLimitResult> {
	const key = `${config.keyPrefix}:${identifier}`;
	const now = Date.now();
	const windowStart = now - config.windowSizeMs;

	try {
		// First, clean up expired entries and count current requests
		const cleanupPipeline = redisClient.pipeline();
		cleanupPipeline.zremrangebyscore(key, 0, windowStart);
		cleanupPipeline.zcard(key);

		const cleanupResults = await cleanupPipeline.exec();

		if (!cleanupResults) {
			throw new Error("Redis pipeline execution failed");
		}

		// Get the count after removing expired entries
		const currentCount = (cleanupResults[1][1] as number) || 0;
		const allowed = currentCount < config.maxRequests;
		const remaining = Math.max(
			0,
			config.maxRequests - currentCount - (allowed ? 1 : 0),
		);
		const resetTime = now + config.windowSizeMs;

		// Only add the request if it's allowed
		if (allowed) {
			const addPipeline = redisClient.pipeline();
			addPipeline.zadd(key, now, now);
			addPipeline.expire(key, Math.ceil(config.windowSizeMs / 1000));
			await addPipeline.exec();
		}

		logger.debug("Rate limit check", {
			identifier,
			currentCount,
			maxRequests: config.maxRequests,
			allowed,
			remaining,
			resetTime,
		});

		return {
			allowed,
			resetTime,
			remaining,
		};
	} catch (error) {
		logger.error(
			"Rate limit check failed",
			error instanceof Error ? error : new Error(String(error)),
		);

		// Fail open - allow the request if Redis is down
		return {
			allowed: true,
			resetTime: now + config.windowSizeMs,
			remaining: config.maxRequests - 1,
		};
	}
}

export const apiAuth: ReturnType<typeof betterAuth> = instrumentBetterAuth(
	betterAuth({
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
				domain: cookieDomain,
			},
			defaultCookieAttributes: {
				domain: cookieDomain,
			},
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60,
			},
			expiresIn: 60 * 60 * 24 * 30, // 30 days
			updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
		},
		basePath: "/auth",
		trustedOrigins: originUrls.split(","),
		plugins: [
			passkey({
				rpID: process.env.PASSKEY_RP_ID || "localhost",
				rpName: process.env.PASSKEY_RP_NAME || "LLMGateway",
				origin: uiUrl,
			}),
		],
		emailAndPassword: {
			enabled: true,
			// In hosted (cloud) mode we require email verification before login.
			// Users are not auto-signed in on initial sign-up; instead they are
			// signed in after verifying their email via the verification link.
			requireEmailVerification: isHosted,
			sendVerificationOnSignIn: false,
			// For self-hosted instances we keep the default autoSignIn behaviour.
			autoSignIn: !isHosted,
			resetPasswordTokenExpiresIn: 60 * 60 * 24, // 24 hours
			async sendResetPassword({ user, token }) {
				const url = `${uiUrl}/reset-password?token=${encodeURIComponent(token)}`;
				const html = getResetPasswordEmail({ url });

				try {
					await sendTransactionalEmail({
						to: user.email,
						subject: "Reset your password",
						html,
					});
				} catch (err) {
					const error = err instanceof Error ? err : new Error(String(err)); // Normalize error

					logger.error("Failed to send reset password email", {
						err: error,
						email: maskEmail(user.email), // Log masked email for privacy
					});

					// Throw a user-friendly error but keep the original cause
					throw new Error(
						"Failed to send reset password email. Please try again.",
						{
							cause: error,
						},
					);
				}
			},
		},
		baseURL: apiUrl || "http://localhost:4002",
		secret: process.env.AUTH_SECRET || "your-secret-key",
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: {
				user: tables.user,
				session: tables.session,
				account: tables.account,
				verification: tables.verification,
				passkey: tables.passkey,
			},
		}),
		socialProviders: {
			github: {
				clientId: process.env.GITHUB_CLIENT_ID!,
				clientSecret: process.env.GITHUB_CLIENT_SECRET!,
			},
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			},
		},
		emailVerification: isHosted
			? {
					sendOnSignUp: true,
					autoSignInAfterVerification: true,
					// TODO this should be afterEmailVerification in better-auth v1.3
					// onEmailVerification: async (user: {
					// 	id: string;
					// 	email: string;
					// 	name?: string | null;
					// }) => {

					// },
					sendVerificationEmail: async ({ user, token }) => {
						try {
							const callbackURL = `${uiUrl}/dashboard?emailVerified=true`;
							const url = `${apiUrl}/auth/verify-email?token=${encodeURIComponent(
								token,
							)}&callbackURL=${encodeURIComponent(callbackURL)}`;

							const html = getVerifyEmail({ url });

							await sendTransactionalEmail({
								to: user.email,
								subject: "Verify your email address",
								html,
							});
						} catch (error) {
							logger.error(
								"Failed to send verification email",
								error instanceof Error ? error : new Error(String(error)),
							);
							throw new Error(
								"Failed to send verification email. Please try again.",
							);
						}
					},
				}
			: {
					sendOnSignUp: false,
					autoSignInAfterVerification: false,
				},
		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				// Rate limit password reset requests
				if (ctx.path.startsWith("/forget-password")) {
					const body = ctx.body as { email?: string } | undefined;
					if (body?.email) {
						const rateLimit = await checkResetPasswordRateLimit(body.email);
						if (!rateLimit.allowed) {
							return new Response(
								JSON.stringify({
									error: "too_many_requests",
									message:
										"Too many password reset attempts. Please try again in 1 hour.",
									retryAfter: Math.ceil(
										(rateLimit.resetTime - Date.now()) / 1000,
									),
								}),
								{
									status: 429,
									headers: {
										"Content-Type": "application/json",
										"Retry-After": Math.ceil(
											(rateLimit.resetTime - Date.now()) / 1000,
										).toString(),
									},
								},
							);
						}
					}
				}

				// Check and record rate limit for ALL signup attempts
				if (ctx.path.startsWith("/sign-up")) {
					// Get IP address from various possible headers, prioritizing CF-Connecting-IP
					let ipAddress = ctx.headers?.get("cf-connecting-ip");
					if (!ipAddress) {
						ipAddress = ctx.headers?.get("x-forwarded-for");
						if (ipAddress) {
							// x-forwarded-for can be a comma-separated list, take the first IP
							ipAddress = ipAddress.split(",")[0]?.trim();
						} else {
							ipAddress =
								ctx.headers?.get("x-real-ip") ||
								ctx.headers?.get("x-client-ip") ||
								"unknown";
						}
					}

					// Check and record signup attempt with exponential backoff
					const rateLimitResult = await checkAndRecordSignupAttempt(ipAddress);

					if (!rateLimitResult.allowed) {
						logger.warn("Signup rate limit exceeded", {
							ip: ipAddress,
							resetTime: new Date(rateLimitResult.resetTime),
						});

						const retryAfterSeconds = Math.ceil(
							(rateLimitResult.resetTime - Date.now()) / 1000,
						);

						const minutes = Math.ceil(retryAfterSeconds / 60);
						const hours = Math.floor(minutes / 60);
						const displayMinutes = minutes % 60;

						let timeMessage = "";
						if (hours > 0) {
							timeMessage = `${hours}h ${displayMinutes}m`;
						} else {
							timeMessage = `${minutes}m`;
						}

						return new Response(
							JSON.stringify({
								error: "too_many_requests",
								message: `Too many signup attempts. Please try again in ${timeMessage}.`,
								retryAfter: retryAfterSeconds,
							}),
							{
								status: 429,
								headers: {
									"Content-Type": "application/json",
									"Retry-After": retryAfterSeconds.toString(),
								},
							},
						);
					}

					// Validate email for blocked domains and + sign (only in HOSTED mode)
					if (isHosted) {
						const body = ctx.body as { email?: string } | undefined;
						if (body?.email) {
							const emailValidation = validateEmail(body.email);
							if (!emailValidation.valid) {
								logger.warn("Signup blocked due to invalid email", {
									ip: ipAddress,
									reason: emailValidation.reason,
								});

								return new Response(
									JSON.stringify({
										error: "invalid_email",
										message: emailValidation.message,
									}),
									{
										status: 400,
										headers: {
											"Content-Type": "application/json",
										},
									},
								);
							}
						}
					}
				}

				if (ctx.path.startsWith("/send-verification-email")) {
					const body = ctx.body as { email?: string } | undefined;
					if (body?.email) {
						const rateLimit = await checkEmailResendRateLimit(body.email);

						if (!rateLimit.allowed) {
							const retryAfter = Math.ceil(
								(rateLimit.resetTime - Date.now()) / 1000,
							);

							return new Response(
								JSON.stringify({
									error: "too_many_requests",
									message: `Please wait ${retryAfter} seconds before requesting another email.`,
									retryAfter,
								}),
								{
									status: 429,
									headers: {
										"Content-Type": "application/json",
										"Retry-After": retryAfter.toString(),
									},
								},
							);
						}
					}
				}
				return;
			}),
			after: createAuthMiddleware(async (ctx) => {
				// Create default org/project for first-time sessions (email signup or first social sign-in)
				const newSession = ctx.context.newSession;
				if (!newSession?.user) {
					return;
				}

				const userId = newSession.user.id;

				// Check if the user already has any active organizations
				const userOrganizations = await db.query.userOrganization.findMany({
					where: {
						userId,
					},
					with: {
						organization: true,
					},
				});

				const activeOrganizations = userOrganizations.filter(
					(uo) => uo.organization?.status !== "deleted",
				);

				if (activeOrganizations.length > 0) {
					// User already has an organization, nothing to do
					return;
				}

				// Perform all DB operations in a single transaction for atomicity
				await db.transaction(async (tx) => {
					// For self-hosted installations, automatically verify the user's email
					if (!isHosted) {
						await tx
							.update(tables.user)
							.set({ emailVerified: true })
							.where(eq(tables.user.id, userId));

						logger.info("Automatically verified email for self-hosted user", {
							userId,
						});
					}

					const autoDepositAmount = process.env.AUTO_DEPOSIT_CREDITS ?? 50;

					// Create a default organization
					const [organization] = await tx
						.insert(tables.organization)
						.values({
							name: "Default Organization",
							billingEmail: newSession.user.email,
							credits: String(autoDepositAmount),
						})
						.returning();

					// Link user to organization
					await tx.insert(tables.userOrganization).values({
						userId,
						organizationId: organization.id,
					});

					// Create a default project with credits mode for better conversion
					const [project] = await tx
						.insert(tables.project)
						.values({
							name: "Default Project",
							organizationId: organization.id,
							mode: "credits",
						})
						.returning();

					// Auto-create an API key for the playground to use
					// Generate a token with a prefix for better identification
					const prefix =
						process.env.NODE_ENV === "development" ? `llmgdev_` : "llmgtwy_";
					const token = prefix + shortid(40);

					await tx.insert(tables.apiKey).values({
						projectId: project.id,
						token: token,
						description: "Auto-generated playground key",
						usageLimit: null, // No limit for playground key
						createdBy: userId,
					});

					// Handle referral if cookie is present
					const cookieHeader = ctx.request?.headers.get("cookie") || "";
					const referralMatch = cookieHeader.match(
						/llmgateway_referral=([^;]+)/,
					);
					if (referralMatch) {
						const referrerOrgId = decodeURIComponent(referralMatch[1]);
						// Verify the referrer organization exists and is active
						const referrerOrg = await tx.query.organization.findFirst({
							where: {
								id: { eq: referrerOrgId },
								status: { eq: "active" },
							},
						});

						if (referrerOrg) {
							// Create the referral record
							await tx.insert(tables.referral).values({
								referrerOrganizationId: referrerOrgId,
								referredOrganizationId: organization.id,
							});

							logger.info("Created referral record", {
								referrerOrgId,
								referredOrgId: organization.id,
							});
						}
					}

					await tx.insert(tables.transaction).values({
						organizationId: organization.id,
						type: "credit_topup",
						amount: "0",
						creditAmount: String(autoDepositAmount),
						status: "completed",
						description: "Welcome credits for new registration",
						currency: "USD",
					});
				});

				signupCounter.add(1, { method: "new_onboarding" });
			}),
		},
	}),
);

export interface Variables {
	user: typeof apiAuth.$Infer.Session.user | null;
	session: typeof apiAuth.$Infer.Session.session | null;
}
