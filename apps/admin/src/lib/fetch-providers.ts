import { fetchServerData } from "@/lib/server-api";

interface Provider {
	id: string;
	createdAt: Date;
	name: string | null;
	description: string | null;
	streaming: boolean | null;
	cancellation: boolean | null;
	color: string | null;
	website: string | null;
	announcement: string | null;
	status: "active" | "inactive";
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

export async function getProviders(): Promise<Provider[] | null> {
	try {
		const data = await fetchServerData<{ providers: Provider[] } | null>(
			"GET",
			"/internal/providers",
		);

		if (!data?.providers) {
			return null;
		}

		return data.providers || [];
	} catch (error) {
		console.error("Failed to fetch providers:", error);
		return null;
	}
}
