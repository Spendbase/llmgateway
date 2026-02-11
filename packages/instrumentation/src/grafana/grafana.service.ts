import { metrics, ValueType } from "@opentelemetry/api";

const meter = metrics.getMeter("llm-api");

export const signupCounter = meter.createCounter("user_signups_total", {
	description: "Number of new user signups",
});

export const activationCounter = meter.createCounter("user_activations_total", {
	description: "Number of users who made their first successful API call",
});

export const modelUsageCounter = meter.createCounter("llm_requests_total", {
	description: "Total number of LLM API requests",
});

export const revenueCounter = meter.createCounter("credits_purchased_total", {
	description: "Total revenue (credits bought) in USD",
	unit: "USD",
	valueType: ValueType.DOUBLE,
});

export const teamSizeGauge = meter.createUpDownCounter("org_team_size", {
	description: "Number of users in an organization",
});

export const tokenCounter = meter.createCounter("llm_tokens_total", {
	description: "Total number of tokens processed (prompt + completion)",
});

export const expensesCounter = meter.createCounter("credits_usage_cost_total", {
	description: "Total cost of provided services in USD",
	unit: "USD",
	valueType: ValueType.DOUBLE,
});
