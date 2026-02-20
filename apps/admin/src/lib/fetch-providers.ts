import { fetchServerData } from "@/lib/server-api";

import type { Provider } from "./models";

interface ProviderWithMetrics extends Provider {
	logsCount: number;
	errorsCount: number;
	clientErrorsCount: number;
	gatewayErrorsCount: number;
	upstreamErrorsCount: number;
	cachedCount: number;
	avgTimeToFirstToken: number | null;
	avgTimeToFirstReasoningToken: number | null;
	statsUpdatedAt: Date | null;
}

export async function getProviders(): Promise<ProviderWithMetrics[] | null> {
	try {
		const data = await fetchServerData<{
			providers: ProviderWithMetrics[];
		} | null>("GET", "/internal/providers", {
			params: {
				query: {
					includeAll: "true",
				},
			},
		});

		if (!data?.providers) {
			return null;
		}

		return data.providers || [];
	} catch (error) {
		console.error("Failed to fetch providers:", error);
		return null;
	}
}
