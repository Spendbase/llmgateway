import { cookies } from "next/headers";

const API_URL = process.env.API_BACKEND_URL || "http://localhost:4002";

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
		const cookieStore = await cookies();
		const key = "better-auth.session_token";
		const sessionCookie = cookieStore.get(key);
		const secureSessionCookie = cookieStore.get(`__Secure-${key}`);

		const response = await fetch(`${API_URL}/internal/providers`, {
			headers: {
				Cookie: secureSessionCookie
					? `__Secure-${key}=${secureSessionCookie.value}`
					: sessionCookie
						? `${key}=${sessionCookie.value}`
						: "",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return data.providers || [];
	} catch (error) {
		console.error("Failed to fetch providers:", error);
		return null;
	}
}
