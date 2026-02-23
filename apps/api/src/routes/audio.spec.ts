import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { checkRateLimit } from "@/auth/config.js";
import { app } from "@/index.js";
import {
	getGoogleAccessToken,
	getGoogleProjectId,
	hasGoogleCredentials,
} from "@/lib/google-auth.js";
import { createTestUser, deleteAll } from "@/testing.js";

import type * as AuthConfig from "@/auth/config.js";

vi.mock("@/auth/config.js", async (importOriginal) => {
	const actual = await importOriginal<typeof AuthConfig>();
	return {
		...actual,
		checkRateLimit: vi.fn(async () => ({
			allowed: true,
			remaining: 9,
			resetTime: Date.now() + 60_000,
		})),
	};
});

vi.mock("@/lib/google-auth.js", () => ({
	hasGoogleCredentials: vi.fn(() => true),
	getGoogleAccessToken: vi.fn(async () => "fake-access-token"),
	getGoogleProjectId: vi.fn(() => "test-project-id"),
	resetGoogleAuthCache: vi.fn(),
}));

const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockHasCredentials = vi.mocked(hasGoogleCredentials);
const mockGetToken = vi.mocked(getGoogleAccessToken);
const mockGetProjectId = vi.mocked(getGoogleProjectId);

const STT_RESPONSE_HELLO_WORLD = {
	results: [
		{ alternatives: [{ transcript: "Hello world", confidence: 0.98 }] },
	],
};

describe("POST /audio/transcriptions", () => {
	let cookie: string;

	afterEach(async () => {
		await deleteAll();
		vi.restoreAllMocks();
		mockHasCredentials.mockReturnValue(true);
		mockGetToken.mockResolvedValue("fake-access-token");
		mockGetProjectId.mockReturnValue("test-project-id");
		mockCheckRateLimit.mockResolvedValue({
			allowed: true,
			remaining: 9,
			resetTime: Date.now() + 60_000,
		});
	});

	beforeEach(async () => {
		cookie = await createTestUser();
	});

	test("returns 401 when unauthenticated", async () => {
		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["audio"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(401);
	});

	test("returns 500 when Google credentials are not configured", async () => {
		mockHasCredentials.mockReturnValue(false);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["audio"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(500);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("not configured");
	});

	test("returns 400 when file field is missing", async () => {
		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: new FormData(),
		});

		expect(res.status).toBe(400);
	});

	test("returns 400 when file is empty", async () => {
		const formData = new FormData();
		formData.append(
			"file",
			new Blob([], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("empty");
	});

	test("returns 500 when token acquisition fails", async () => {
		mockGetToken.mockRejectedValue(new Error("Auth failure"));

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(500);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("authenticate");
	});

	test("returns 200 with transcribed text on success", async () => {
		vi.spyOn(global, "fetch").mockResolvedValueOnce(
			new Response(JSON.stringify(STT_RESPONSE_HELLO_WORLD), { status: 200 }),
		);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["fake-audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { text: string };
		expect(body.text).toBe("Hello world");
	});

	test("returns 200 with empty text when Google returns no results", async () => {
		vi.spyOn(global, "fetch").mockResolvedValueOnce(
			new Response(JSON.stringify({}), { status: 200 }),
		);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["fake-audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { text: string };
		expect(body.text).toBe("");
	});

	test("returns 502 when Google STT API returns an error", async () => {
		vi.spyOn(global, "fetch").mockResolvedValueOnce(
			new Response(
				JSON.stringify({ error: { message: "Invalid credentials" } }),
				{ status: 400 },
			),
		);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["fake-audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(502);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("400");
	});

	test("returns 502 when fetch to Google fails (network error)", async () => {
		vi.spyOn(global, "fetch").mockRejectedValueOnce(
			new Error("Network failure"),
		);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["fake-audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(502);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("transcription service");
	});

	test("returns 429 when rate limit exceeded", async () => {
		mockCheckRateLimit.mockResolvedValueOnce({
			allowed: false,
			remaining: 0,
			resetTime: Date.now() + 30_000,
		});

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["fake-audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(429);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("Too many requests");
		expect(res.headers.get("Retry-After")).toBeTruthy();
		expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
	});

	test("includes rate limit headers on success", async () => {
		vi.spyOn(global, "fetch").mockResolvedValueOnce(
			new Response(JSON.stringify(STT_RESPONSE_HELLO_WORLD), { status: 200 }),
		);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["fake-audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("X-RateLimit-Remaining")).toBe("9");
		expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
	});

	test("returns 400 when file is too large", async () => {
		const oversizedBlob = new Blob([new Uint8Array(26 * 1024 * 1024)], {
			type: "audio/webm",
		});
		const formData = new FormData();
		formData.append("file", oversizedBlob, "recording.webm");

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string };
		expect(body.error).toContain("too large");
	});

	test("concatenates multiple result segments into single text", async () => {
		vi.spyOn(global, "fetch").mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					results: [
						{ alternatives: [{ transcript: "Hello" }] },
						{ alternatives: [{ transcript: "world" }] },
					],
				}),
				{ status: 200 },
			),
		);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob(["fake-audio-data"], { type: "audio/webm" }),
			"recording.webm",
		);

		const res = await app.request("/audio/transcriptions", {
			method: "POST",
			headers: { Cookie: cookie },
			body: formData,
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { text: string };
		expect(body.text).toBe("Hello world");
	});
});
