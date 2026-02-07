import { metrics } from "@opentelemetry/api";
import { createMiddleware } from "hono/factory";

const meter = metrics.getMeter("api-gateway");

const httpCounter = meter.createCounter("http_requests_total", {
	description: "Total number of HTTP requests",
});

const latencyHistogram = meter.createHistogram("http_request_duration_ms", {
	description: "Duration of HTTP requests in milliseconds",
	unit: "ms",
});

export const grafanaMiddleware = createMiddleware(async (c, next) => {
	const start = performance.now();

	await next();

	const duration = performance.now() - start;
	const status = c.res.status;

	const organizationId = c.get("organizationId") || "anonymous";

	httpCounter.add(1, {
		method: c.req.method,
		route: c.req.path,
		status: String(status),
		org_id: organizationId,
	});

	latencyHistogram.record(duration, {
		route: c.req.path,
		status: String(status),
	});
});
