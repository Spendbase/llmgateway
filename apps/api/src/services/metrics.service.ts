import { Registry, Counter } from "prom-client";

const register = new Registry();

export const httpRequestsTotal = new Counter({
	name: "http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "path", "status"],
	registers: [register],
});

export const userSignups = new Counter({
	name: "user_signups_total",
	help: "Total number of user signups",
	registers: [register],
	labelNames: ["method"],
});

export const llmUsageTotal = new Counter({
	name: "llm_api_calls_total",
	help: "Total LLM API calls",
	labelNames: ["model", "org_id", "status"],
	registers: [register],
});

export const creditsConsumed = new Counter({
	name: "credits_consumed_total",
	help: "Total credits spent in USD",
	labelNames: ["org_id"],
	registers: [register],
});

export { register };
