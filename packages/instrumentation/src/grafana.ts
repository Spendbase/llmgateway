import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

const authHeader = `Basic ${Buffer.from(`${process.env.GRAFANA_INSTANCE_ID}:${process.env.GRAFANA_API_TOKEN}`).toString("base64")}`;

const metricExporter = new OTLPMetricExporter({
	url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
	headers: {
		Authorization: authHeader,
	},
});

const sdk = new NodeSDK({
	serviceName: "my-hono-app",
	metricReader: new PeriodicExportingMetricReader({
		exporter: metricExporter,
		exportIntervalMillis: 10000,
	}),
});

sdk.start();

process.on("SIGTERM", () => {
	sdk.shutdown().finally(() => process.exit(0));
});
