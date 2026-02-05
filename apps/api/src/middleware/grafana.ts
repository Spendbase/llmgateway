import { httpRequestsTotal } from "@/services/metrics.service.js";

export const grafanaMiddleWare = async (c: any, next: any) => {
	await next();

	httpRequestsTotal.inc({
		method: c.req.method,
		path: c.req.path,
		status: c.res.status,
	});
};
