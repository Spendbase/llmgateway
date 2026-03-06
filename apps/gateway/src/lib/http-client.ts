import { createHttpClient } from "@llmgateway/shared";

export const httpClient = createHttpClient({
	tracerName: "llmgateway-gateway",
	clientName: "gateway-http-client",
});

export type { HttpClientOptions } from "@llmgateway/shared";

/**
 * Fetch with automatic retry on 429 (rate limit) responses.
 * Respects Retry-After header; falls back to exponential backoff (1s, 2s, 4s).
 * Aborts retries if the provided AbortSignal fires.
 */
export async function fetchWithRetryOn429(
	url: string,
	options: RequestInit,
	maxRetries = 2,
): Promise<Response> {
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const response = await fetch(url, options);

		if (response.status !== 429 || attempt === maxRetries) {
			return response;
		}

		const retryAfterHeader = response.headers.get("Retry-After");
		const delayMs = retryAfterHeader
			? parseInt(retryAfterHeader, 10) * 1000
			: Math.min(1000 * Math.pow(2, attempt), 10000);

		await new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, delayMs);
			const signal = options.signal as AbortSignal | null | undefined;
			if (signal) {
				if (signal.aborted) {
					clearTimeout(timer);
					reject(new DOMException("Aborted", "AbortError"));
					return;
				}
				signal.addEventListener(
					"abort",
					() => {
						clearTimeout(timer);
						reject(new DOMException("Aborted", "AbortError"));
					},
					{ once: true },
				);
			}
		});
	}

	// Unreachable but satisfies TypeScript
	return await fetch(url, options);
}
