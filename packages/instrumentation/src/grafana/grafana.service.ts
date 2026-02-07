import { metrics, ValueType } from "@opentelemetry/api";

const meter = metrics.getMeter("llm-api");

export const httpCounter = meter.createCounter("http_requests_total", {
	description: "Total number of HTTP requests",
});

export const signupCounter = meter.createCounter("user_signups_total", {
	description: "Number of new user signups",
});

export const activationCounter = meter.createCounter("user_activations_total", {
	description: "Number of users who made their first successful API call",
});

export const modelUsageCounter = meter.createCounter("llm_requests_total", {
	description: "Total number of LLM API requests",
});

export const costCounter = meter.createCounter("credits_consumed_total", {
	description: "Total spend in USD",
	unit: "USD",
	valueType: ValueType.DOUBLE,
});

export const teamSizeGauge = meter.createUpDownCounter("org_team_size", {
	description: "Number of users in an organization",
});
