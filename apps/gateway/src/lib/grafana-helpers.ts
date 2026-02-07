import { costCounter, modelUsageCounter } from "@llmgateway/instrumentation";

const environment = process.env.NODE_ENV || "development";

export const sendModelUsage = (
	orgId = "unknown org",
	model = "unknown model",
) => {
	modelUsageCounter.add(1, {
		org_id: orgId,
		model: model,
		environment,
	});
};

export const sendCostUsage = (
	cost: number,
	orgId = "unknown org",
	model = "unknown model",
	type = "cost",
) => {
	costCounter.add(cost, {
		org_id: orgId,
		model: model,
		environment,
		type,
	});
};
