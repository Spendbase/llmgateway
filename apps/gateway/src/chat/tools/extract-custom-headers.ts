/**
 * Extracts X-LLMAPI-* headers from the request context
 * Returns a key-value object where keys are the suffix after x-llmapi- and values are header values
 */
export function extractCustomHeaders(c: any): Record<string, string> {
	const customHeaders: Record<string, string> = {};

	// Get all headers from the raw request
	const headers = c.req.raw.headers;

	// Iterate through all headers
	for (const [key, value] of headers.entries()) {
		if (key.toLowerCase().startsWith("x-llmapi-")) {
			// Extract the suffix after x-llmgateway- and store with lowercase key
			const suffix = key.toLowerCase().substring("x-llmapi-".length);
			customHeaders[suffix] = value;
		}
	}

	return customHeaders;
}
