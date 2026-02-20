import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { app } from "@/index.js";
import {
	getGoogleAccessToken,
	getGoogleProjectId,
	hasGoogleCredentials,
} from "@/lib/google-auth.js";
import { createTestUser, deleteAll } from "@/testing.js";

vi.mock("@/lib/google-auth.js", () => ({
	hasGoogleCredentials: vi.fn(() => true),
	getGoogleAccessToken: vi.fn(async () => "fake-access-token"),
	getGoogleProjectId: vi.fn(() => "test-project-id"),
	resetGoogleAuthCache: vi.fn(),
}));

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
