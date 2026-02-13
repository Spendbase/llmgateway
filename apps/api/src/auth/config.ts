import { instrumentBetterAuth } from "@kubiks/otel-better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { passkey } from "better-auth/plugins/passkey";
import { Redis } from "ioredis";

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
						const callbackUrl = `${uiUrl}/?emailVerified=true`;
						const url = `${apiUrl}/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(
							callbackUrl,
						)}`;
						const html = `
							<!DOCTYPE html>
								<html>
									<head>
										<meta charset="utf-8">
										<meta name="viewport" content="width=device-width, initial-scale=1.0">
										<title>Verify your email</title>
									</head>
									<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #444444; background-color: #ffffff; margin: 0; padding: 0;">
										<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 40px 20px;">
											<tr>
												<td align="center">
													<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff;">
														<tr>
															<td style="padding-bottom: 32px;" align="left">
																<div style="display: flex; align-items: center; gap: 2px;">
																	<svg
																		width="27"
																		height="27"
																		viewBox="0 0 72 72"
																		fill="none"
																		xmlns="http://www.w3.org/2000/svg"
																	>
																		<rect width="72" height="72" rx="8" fill="#3F35FF" />
																		<path
																			d="M24.136 33.9485L12.0218 27.1098L24.136 20.2711L36.2501 27.1098L24.136 33.9485Z"
																			fill="white"
																		/>
																		<path
																			d="M23.907 19.3922C24.1323 19.3336 24.3742 19.3628 24.5822 19.4801L36.6971 26.3176C36.9826 26.4788 37.1585 26.7827 37.1585 27.1106C37.1582 27.4382 36.9824 27.7406 36.6971 27.9017L24.5822 34.7391C24.3048 34.8956 23.9666 34.8957 23.6893 34.7391L11.5743 27.9017C11.2892 27.7405 11.1132 27.4381 11.1129 27.1106C11.1129 26.7828 11.2889 26.4789 11.5743 26.3176L23.6893 19.4801L23.907 19.3922ZM13.8715 27.1086L24.1347 32.9034L34.3999 27.1086L24.1347 21.3139L13.8715 27.1086Z"
																			fill="black"
																		/>
																		<path
																			d="M12.0218 27.1098V44.1205L24.136 50.9591V42.7527V33.9485L12.0218 27.1098Z"
																			fill="black"
																		/>
																		<path
																			d="M23.2278 34.4786L12.9306 28.6659V43.5893L23.2278 49.4021V34.4786ZM25.0456 50.9581C25.0456 51.2813 24.8733 51.5822 24.5941 51.7451C24.3152 51.9077 23.9705 51.9097 23.6893 51.7511L11.5743 44.9117C11.2892 44.7504 11.113 44.4483 11.1129 44.1206V27.1098C11.1129 26.7866 11.2852 26.4877 11.5643 26.3248C11.8434 26.1622 12.188 26.16 12.4692 26.3188L24.5821 33.1563C24.8677 33.3175 25.0456 33.6214 25.0456 33.9493V50.9581Z"
																			fill="black"
																		/>
																		<path
																			d="M36.2501 27.1098V44.1205L24.1359 50.9591V42.7527V33.9485L36.2501 27.1098Z"
																			fill="white"
																		/>
																		<path
																			d="M35.8034 26.3188C36.0848 26.1599 36.4291 26.1619 36.7082 26.3248C36.9874 26.4878 37.1597 26.7866 37.1597 27.1098V44.1206C37.1596 44.4485 36.9818 44.7505 36.6962 44.9117L24.5833 51.7512C24.3022 51.9098 23.9574 51.9075 23.6784 51.7452C23.3993 51.5822 23.227 51.2814 23.227 50.9581V33.9493C23.227 33.6214 23.403 33.3175 23.6884 33.1563L35.8034 26.3188ZM25.0447 49.4001L35.3419 43.5893V28.6639L25.0447 34.4786V49.4001Z"
																			fill="black"
																		/>
																		<path
																			d="M48.3642 33.9485L36.25 27.1098L48.3642 20.2711L60.4784 27.1098L48.3642 33.9485Z"
																			fill="white"
																		/>
																		<path
																			d="M48.1352 19.3922C48.3605 19.3336 48.6025 19.3628 48.8104 19.4801L60.9253 26.3176C61.2109 26.4788 61.3868 26.7827 61.3868 27.1106C61.3864 27.4382 61.2107 27.7406 60.9253 27.9017L48.8104 34.7391C48.5331 34.8956 48.1948 34.8957 47.9175 34.7391L35.8026 27.9017C35.5175 27.7405 35.3415 27.4381 35.3412 27.1106C35.3412 26.7828 35.5171 26.4789 35.8026 26.3176L47.9175 19.4801L48.1352 19.3922ZM38.0997 27.1086L48.363 32.9034L58.6282 27.1086L48.363 21.3139L38.0997 27.1086Z"
																			fill="black"
																		/>
																		<path
																			d="M60.4784 27.1098V44.1205L48.3642 50.9591V42.7527V33.9485L60.4784 27.1098Z"
																			fill="white"
																		/>
																		<path
																			d="M60.0317 26.3188C60.3131 26.1599 60.6575 26.1619 60.9366 26.3248C61.2157 26.4878 61.388 26.7866 61.388 27.1098V44.1206C61.388 44.4485 61.2101 44.7505 60.9246 44.9117L48.8117 51.7512C48.5306 51.9098 48.1857 51.9075 47.9068 51.7452C47.6277 51.5822 47.4554 51.2814 47.4554 50.9581V33.9493C47.4554 33.6214 47.6313 33.3175 47.9168 33.1563L60.0317 26.3188ZM49.2731 49.4001L59.5703 43.5893V28.6639L49.2731 34.4786V49.4001Z"
																			fill="black"
																		/>
																		<path
																			d="M24.136 47.6218L12.0218 40.7832L24.136 33.9445L36.2501 40.7832L24.136 47.6218Z"
																			fill="white"
																		/>
																		<path
																			d="M23.907 33.0656C24.1323 33.0069 24.3742 33.0362 24.5822 33.1535L36.6971 39.991C36.9826 40.1522 37.1585 40.4561 37.1585 40.784C37.1582 41.1116 36.9824 41.4139 36.6971 41.575L24.5822 48.4125C24.3048 48.569 23.9666 48.5691 23.6893 48.4125L11.5743 41.575C11.2892 41.4139 11.1132 41.1115 11.1129 40.784C11.1129 40.4561 11.2889 40.1522 11.5743 39.991L23.6893 33.1535L23.907 33.0656ZM13.8715 40.782L24.1347 46.5768L34.3999 40.782L24.1347 34.9872L13.8715 40.782Z"
																			fill="black"
																		/>
																		<path
																			d="M12.0218 40.7831V57.7977L24.136 64.6363V56.4299V47.6218L12.0218 40.7831Z"
																			fill="black"
																		/>
																		<path
																			d="M23.2278 48.1519L12.9306 42.3392V57.2666L23.2278 63.0794V48.1519ZM25.0456 64.6354C25.0456 64.9585 24.8731 65.2575 24.5941 65.4205C24.3151 65.5833 23.9707 65.5871 23.6893 65.4284L11.5743 58.589C11.2892 58.4277 11.113 58.1256 11.1129 57.7979V40.7831C11.1129 40.4599 11.2852 40.1611 11.5643 39.9981C11.8434 39.8355 12.188 39.8333 12.4692 39.9921L24.5821 46.8296C24.8677 46.9908 25.0456 47.2947 25.0456 47.6226V64.6354Z"
																			fill="black"
																		/>
																		<path
																			d="M36.2501 40.7831V57.7977L24.1359 64.6363V56.4299V47.6218L36.2501 40.7831Z"
																			fill="white"
																		/>
																		<path
																			d="M35.8034 39.9921C36.0848 39.8332 36.4291 39.8352 36.7082 39.9981C36.9874 40.1611 37.1597 40.4599 37.1597 40.7831V57.7979C37.1596 58.1258 36.9817 58.4278 36.6962 58.589L24.5833 65.4285C24.3019 65.5873 23.9575 65.5833 23.6784 65.4205C23.3993 65.2575 23.227 64.9587 23.227 64.6354V47.6226C23.227 47.2948 23.403 46.9908 23.6884 46.8296L35.8034 39.9921ZM25.0447 63.0774L35.3419 57.2666V42.3372L25.0447 48.152V63.0774Z"
																			fill="black"
																		/>
																		<path
																			d="M48.3642 47.6218L36.25 40.7832L48.3642 33.9445L60.4784 40.7832L48.3642 47.6218Z"
																			fill="white"
																		/>
																		<path
																			d="M48.1352 33.0656C48.3605 33.0069 48.6024 33.0362 48.8104 33.1535L60.9253 39.991C61.2109 40.1522 61.3867 40.4561 61.3867 40.784C61.3864 41.1116 61.2106 41.4139 60.9253 41.575L48.8104 48.4125C48.533 48.569 48.1948 48.5691 47.9175 48.4125L35.8026 41.575C35.5174 41.4139 35.3414 41.1115 35.3411 40.784C35.3411 40.4561 35.5171 40.1522 35.8026 39.991L47.9175 33.1535L48.1352 33.0656ZM38.0997 40.782L48.3629 46.5768L58.6282 40.782L48.3629 34.9872L38.0997 40.782Z"
																			fill="black"
																		/>
																		<path
																			d="M36.25 40.7831V57.7977L48.3642 64.6363V56.4299V47.6218L36.25 40.7831Z"
																			fill="black"
																		/>
																		<path
																			d="M47.456 48.1519L37.1588 42.3392V57.2666L47.456 63.0794V48.1519ZM49.2738 64.6354C49.2738 64.9585 49.1013 65.2575 48.8223 65.4205C48.5433 65.5833 48.1989 65.5871 47.9175 65.4284L35.8025 58.589C35.5174 58.4277 35.3412 58.1256 35.3411 57.7979V40.7831C35.3411 40.4599 35.5134 40.1611 35.7925 39.9981C36.0716 39.8355 36.4162 39.8333 36.6974 39.9921L48.8103 46.8296C49.0959 46.9908 49.2738 47.2947 49.2738 47.6226V64.6354Z"
																			fill="black"
																		/>
																		<path
																			d="M60.4784 40.7831V57.7977L48.3642 64.6363V56.4299V47.6218L60.4784 40.7831Z"
																			fill="white"
																		/>
																		<path
																			d="M60.0317 39.9921C60.3131 39.8332 60.6575 39.8352 60.9366 39.9981C61.2157 40.1611 61.388 40.4599 61.388 40.7831V57.7979C61.3879 58.1258 61.2101 58.4278 60.9246 58.589L48.8117 65.4285C48.5303 65.5873 48.1859 65.5833 47.9068 65.4205C47.6277 65.2575 47.4554 64.9587 47.4554 64.6354V47.6226C47.4554 47.2948 47.6313 46.9908 47.9168 46.8296L60.0317 39.9921ZM49.2731 63.0774L59.5703 57.2666V42.3372L49.2731 48.152V63.0774Z"
																			fill="black"
																		/>
																		<path
																			d="M35.9375 40.0909C44.9748 40.0909 52.3011 32.7647 52.3011 23.7273C52.3011 14.6899 44.9748 7.36365 35.9375 7.36365C26.9001 7.36365 19.5738 14.6899 19.5738 23.7273C19.5738 32.7647 26.9001 40.0909 35.9375 40.0909Z"
																			fill="white"
																		/>
																		<path
																			d="M51.3922 23.7273C51.3922 15.192 44.4728 8.27251 35.9374 8.27251C27.4021 8.27251 20.4827 15.192 20.4827 23.7273C20.4827 32.2626 27.4021 39.182 35.9374 39.182C44.4728 39.182 51.3922 32.2626 51.3922 23.7273ZM53.2099 23.7273C53.2099 33.2667 45.4769 40.9998 35.9374 40.9998C26.398 40.9998 18.6649 33.2667 18.6649 23.7273C18.6649 14.1878 26.398 6.45477 35.9374 6.45477C45.4769 6.45477 53.2099 14.1878 53.2099 23.7273Z"
																			fill="black"
																		/>
																		<path d="M25.3011 23.1818H31.8465V29.7273H25.3011V23.1818Z" fill="black" />
																		<path d="M27.3465 25.2273H29.8011V29.7273H27.3465V25.2273Z" fill="white" />
																		<path d="M40.0284 23.1818H46.5738V29.7273H40.0284V23.1818Z" fill="black" />
																		<path d="M42.0738 25.2273H44.5284V29.7273H42.0738V25.2273Z" fill="white" />
																		<path d="M222.939 50.175V21.825H227.556V50.175H222.939Z" fill="black" />
																		<path
																			d="M199.982 50.175V21.825H210.107C212.078 21.825 213.806 22.149 215.291 22.797C216.776 23.418 217.937 24.3495 218.774 25.5915C219.611 26.8335 220.03 28.359 220.03 30.168C220.03 31.977 219.598 33.516 218.734 34.785C217.897 36.027 216.736 36.972 215.251 37.62C213.766 38.241 212.051 38.5515 210.107 38.5515H204.599V50.175H199.982ZM204.599 34.623H209.986C211.957 34.623 213.334 34.2315 214.117 33.4485C214.927 32.6385 215.332 31.545 215.332 30.168C215.332 28.818 214.927 27.738 214.117 26.928C213.334 26.118 211.957 25.713 209.986 25.713H204.599V34.623Z"
																			fill="black"
																		/>
																		<path
																			d="M171.526 50.175L181.894 21.825H186.997L197.365 50.175H192.505L190.156 43.452H178.694L176.305 50.175H171.526ZM180.031 39.7665H188.86L184.405 27.2115L180.031 39.7665Z"
																			fill="black"
																		/>
																		<path
																			d="M133.089 50.175V21.825H138.516L147.183 40.5765L155.688 21.825H161.155V50.175H156.538V30.0465L148.924 46.4085H145.32L137.706 30.0465V50.175H133.089Z"
																			fill="black"
																		/>
																		<path
																			d="M112.544 50.175V21.825H117.161V46.3275H129.716V50.175H112.544Z"
																			fill="black"
																		/>
																		<path
																			d="M92 50.175V21.825H96.617V46.3275H109.172V50.175H92Z"
																			fill="black"
																		/>
																	</svg>
																	<span style="font-weight: 700; font-size: 20px; color: #1a1a1a; margin-left: 4px;">LLM API</span>
																</div>
															</td>
														</tr>
														<tr>
															<td align="left">
																<p style="margin: 0 0 16px 0; font-size: 14px; color: #333333;">
																	Thanks for signing up! Please verify your email address to complete your registration and start using your account.
																</p>
																<p style="margin: 0 0 24px 0; font-size: 14px; color: #333333;">
																	Click the button below to confirm your email:
																</p>
																
																<div style="text-align:center; margin: 32px 0;">
																	<a href="${url}" 
																	style="display: inline-block; padding: 12px 36px; border-radius: 6px; background-color: #1D61DB; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
																		Verify email
																	</a>
																</div>
									
																<p style="margin: 32px 0 8px 0; font-size: 13px; color: #666666;">
																	If that button doesn't work, copy and paste this link into your browser:
																</p>
																<p style="margin: 0 0 40px 0; font-size: 13px; word-break: break-all;">
																	<a
																		href="${url}"
																		style="color: #1D61DB; text-decoration: none; display: block; width: 100%; max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
																	>
																		${url}
																	</a>
																</p>
									
																<p style="margin: 0; font-size: 14px; color: #333333;">
																	<strong>
																		Thanks,<br>
																		The LLM API team
																	</strong>
																</p>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</table>
									</body>
								</html>
							`.trim();

						try {
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
