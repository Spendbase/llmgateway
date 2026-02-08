import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

export * from "./grafana.service.js";

export function initTelemetry(serviceName: string) {
	if (!process.env.GRAFANA_INSTANCE_ID || !process.env.GRAFANA_API_TOKEN || !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
		return;
	}

	const authHeader = `Basic ${Buffer.from(
		`${process.env.GRAFANA_INSTANCE_ID}:${process.env.GRAFANA_API_TOKEN}`,
	).toString("base64")}`;

	const metricExporter = new OTLPMetricExporter({
		url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
		headers: {
			Authorization: authHeader,
		},
	});

	const sdk = new NodeSDK({
		serviceName: serviceName,
		metricReader: new PeriodicExportingMetricReader({
			exporter: metricExporter,
			exportIntervalMillis: 10000,
		}),
	});

	sdk.start();

	process.on("SIGTERM", () => {
		sdk.shutdown().finally(() => process.exit(0));
	});
}
