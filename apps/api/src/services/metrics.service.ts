import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("llm-gateway");

export const signupCounter = meter.createCounter("user_signups_total", {
	description: "Number of new user signups",
});

export const activationCounter = meter.createCounter("user_activations_total", {
	description: "Number of users who made their first successful API call",
});

// 2. USAGE / MODEL / ERROR / DAU: Универсальный счетчик запросов
// Он закроет сразу 4 пункта из твоего списка!
export const modelUsageCounter = meter.createCounter("llm_requests_total", {
	description: "Total number of LLM API requests",
});

// 3. CREDIT CONSUMPTION: Деньги
// Counter умеет работать с дробями (например, $0.002)
export const costCounter = meter.createCounter("credits_consumed_total", {
	description: "Total spend in USD",
	unit: "USD",
});

// 4. TEAM SIZE: Размер команды
// UpDownCounter умеет идти в минус (если юзера удалили)
export const teamSizeGauge = meter.createUpDownCounter("org_team_size", {
	description: "Number of users in an organization",
});
