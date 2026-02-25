import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { app } from "@/index.js";
import { createTestUser, deleteAll } from "@/testing.js";

import { db, tables } from "@llmgateway/db";

describe("admin users endpoint", () => {
	let token: string;
	let originalAdminEmails: string | undefined;

	beforeEach(async () => {
		originalAdminEmails = process.env.ADMIN_EMAILS;
		process.env.ADMIN_EMAILS = "admin@example.com";

		// This will create 'admin@example.com' and clear DB
		token = await createTestUser();

		// Create organization
		await db.insert(tables.organization).values({
			id: "org-1",
			name: "Test Organization",
			billingEmail: "billing@example.com",
		});

		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const lastWeek = new Date(today);
		lastWeek.setDate(lastWeek.getDate() - 7);

		// The test user is 'test-user-id' created by createTestUser
		// Let's create more users for testing filters
		await db.insert(tables.user).values([
			{
				id: "u1",
				name: "Alice Smith",
				email: "alice@example.com",
				emailVerified: true,
				status: "active",
				createdAt: today,
			},
			{
				id: "u2",
				name: "Bob Jones",
				email: "bob@test.com",
				emailVerified: false,
				status: "blocked",
				createdAt: yesterday,
			},
			{
				id: "u3",
				name: "Charlie Brown",
				email: "charlie@example.com",
				emailVerified: true,
				status: "active",
				createdAt: lastWeek,
			},
			{
				id: "u4",
				name: "Alice_Like%Test", // For testing escapeLike
				email: "weird@example.com",
				emailVerified: true,
				status: "active",
				createdAt: today,
			},
		]);

		await db.insert(tables.userOrganization).values([
			{
				id: "uo1",
				userId: "u1",
				organizationId: "org-1",
				role: "admin",
			},
			{
				id: "uo2",
				userId: "u2",
				organizationId: "org-1",
				role: "developer",
			},
			{
				id: "uo3",
				userId: "u3",
				organizationId: "org-1",
				role: "owner",
			},
		]);
	});

	afterEach(async () => {
		process.env.ADMIN_EMAILS = originalAdminEmails;
		await deleteAll();
	});

	test("GET /admin/users unauthorized if not admin", async () => {
		// Mock env to make test user NOT an admin, or test with no token
		const res = await app.request("/admin/users");
		expect(res.status).toBe(401);
	});

	// Note: createTestUser uses admin@example.com, and we assume process.env.ADMIN_EMAILS includes it
	// (usually set in vitest.workspace or similar). Let's explicitly set it just in case.
	test("GET /admin/users should return all users", async () => {
		const res = await app.request("/admin/users", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		// test-user-id + u1 + u2 + u3 + u4 = 5 users
		expect(data.users.length).toBe(5);
		expect(data.pagination.totalUsers).toBe(5);
	});

	test("GET /admin/users filter by name", async () => {
		const res = await app.request("/admin/users?name=Alice", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		// Alice Smith and Alice_Like%Test
		expect(data.users.length).toBe(2);
	});

	test("GET /admin/users filter by escape LIKE characters", async () => {
		// If we search for "%", without escaping it'd match all. Escaped, it matches "Alice_Like%Test"
		const res = await app.request("/admin/users?name=%25", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.users.length).toBe(1);
		expect(data.users[0].name).toBe("Alice_Like%Test");
	});

	test("GET /admin/users filter by email", async () => {
		const res = await app.request("/admin/users?email=test.com", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.users.length).toBe(1);
		expect(data.users[0].email).toBe("bob@test.com");
	});

	test("GET /admin/users filter by role", async () => {
		const res = await app.request("/admin/users?role=developer", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.users.length).toBe(1);
		expect(data.users[0].email).toBe("bob@test.com");
	});

	test("GET /admin/users filter by status and emailStatus", async () => {
		const res = await app.request(
			"/admin/users?accountStatus=blocked&emailStatus=unverified",
			{
				headers: { Cookie: token },
			},
		);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.users.length).toBe(1);
		expect(data.users[0].name).toBe("Bob Jones");
	});

	test("GET /admin/users filter by date range", async () => {
		const today = new Date();
		const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

		const res = await app.request(
			`/admin/users?registeredAtFrom=${todayStr}&registeredAtTo=${todayStr}`,
			{
				headers: { Cookie: token },
			},
		);
		expect(res.status).toBe(200);
		const data = await res.json();
		// Test User (created today) + u1 (today) + u4 (today)
		expect(data.users.length).toBeGreaterThanOrEqual(3);
	});

	test("GET /admin/users sorting", async () => {
		// Sort by email ASC
		const resAsc = await app.request("/admin/users?sortBy=email&order=asc", {
			headers: { Cookie: token },
		});
		expect(resAsc.status).toBe(200);
		const dataAsc = await resAsc.json();
		// admin@example.com, alice@example.com, bob@test.com, charlie@example.com, weird@example.com
		const emailsAsc = dataAsc.users.map((u: any) => u.email);
		const sortedAsc = [...emailsAsc].sort();
		expect(emailsAsc).toEqual(sortedAsc);

		// Sort by email DESC
		const resDesc = await app.request("/admin/users?sortBy=email&order=desc", {
			headers: { Cookie: token },
		});
		expect(resDesc.status).toBe(200);
		const dataDesc = await resDesc.json();
		const emailsDesc = dataDesc.users.map((u: any) => u.email);
		expect(emailsDesc).toEqual(sortedAsc.reverse());
	});

	test("GET /admin/users pagination", async () => {
		const res = await app.request(
			"/admin/users?page=1&pageSize=2&sortBy=email&order=asc",
			{
				headers: { Cookie: token },
			},
		);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.users.length).toBe(2);
		expect(data.pagination.page).toBe(1);
		expect(data.pagination.pageSize).toBe(2);
		expect(data.pagination.totalPages).toBe(3); // 5 users / 2 = 3 pages

		const res2 = await app.request(
			"/admin/users?page=3&pageSize=2&sortBy=email&order=asc",
			{
				headers: { Cookie: token },
			},
		);
		expect(res2.status).toBe(200);
		const data2 = await res2.json();
		expect(data2.users.length).toBe(1); // the last user
	});

	test("GET /admin/users validation errors", async () => {
		// invalid emailStatus
		let res = await app.request("/admin/users?emailStatus=bogus", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(400);

		// invalid date
		res = await app.request("/admin/users?registeredAtFrom=not-a-date", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(400);

		// negative page
		res = await app.request("/admin/users?page=-1", {
			headers: { Cookie: token },
		});
		expect(res.status).toBe(400);
	});
});
