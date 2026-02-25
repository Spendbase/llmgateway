/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";

import { useUsersQueryParams } from "./use-users-query-params";

// Mock the next/navigation hooks
const mockPush = vi.fn();
const mockReplace = vi.fn();

let mockSearch = "";

vi.mock("next/navigation", () => {
	// Let's create a local mutable state for the URL to simulate browser
	return {
		useRouter: () => ({
			push: mockPush,
			replace: mockReplace,
		}),
		usePathname: () => "/admin/users",
		useSearchParams: () => {
			// This needs to be mocked per-test, so we will use a hoisted spy or
			// rely on clearing modules and setting up a global mock.
			return new URLSearchParams(mockSearch);
		},
	};
});

describe("useUsersQueryParams", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset search string
		mockSearch = "";
	});

	const setURLSearch = (search: string) => {
		mockSearch = search;
	};

	test("parses default parameters correctly when URL is empty", () => {
		setURLSearch("");
		const { result } = renderHook(() => useUsersQueryParams());

		expect(result.current.query).toEqual({
			page: 1,
			pageSize: 20,
		});
		expect(result.current.hasActiveFilters).toBe(false);
	});

	test("parses complex query parameters correctly", () => {
		setURLSearch(
			"?page=3&pageSize=50&sortBy=email&order=desc&role=admin&accountStatus=active&registeredAtFrom=2024-01-01&userId=u123",
		);
		const { result } = renderHook(() => useUsersQueryParams());

		expect(result.current.query).toEqual({
			page: 3,
			pageSize: 50,
			sortBy: "email",
			order: "desc",
			role: "admin",
			accountStatus: "active",
			registeredAtFrom: "2024-01-01",
			userId: "u123",
		});
		expect(result.current.hasActiveFilters).toBe(true);
	});

	test("ignores invalid query parameters (e.g. invalid enums)", () => {
		setURLSearch(
			"?page=nope&pageSize=NaN&sortBy=invalidColumn&order=sideways&role=superuser&accountStatus=banned",
		);
		const { result } = renderHook(() => useUsersQueryParams());

		// 'nope' parses as NaN, but the hook uses parseInt which might return NaN or fallback
		// Wait, the hook does `parseInt("nope") || 1`, so it falls back to 1 if it's NaN!
		// Let's verify defaults for invalid inputs.
		expect(result.current.query.page).toBe(1);
		expect(result.current.query.pageSize).toBe(20);
		expect(result.current.query.sortBy).toBeUndefined();
		expect(result.current.query.order).toBeUndefined();
		expect(result.current.query.role).toBeUndefined();
		expect(result.current.query.accountStatus).toBeUndefined();
	});

	test("setQuery updates parameters and pushes to router", () => {
		setURLSearch("?page=2&pageSize=20&sortBy=name");
		const { result } = renderHook(() => useUsersQueryParams());

		act(() => {
			result.current.setQuery({ role: "owner", email: "test@example.com" });
		});

		// By default, changing filters resets page to 1
		expect(mockPush).toHaveBeenCalledWith(
			"/admin/users?page=1&pageSize=20&sortBy=name&role=owner&email=test%40example.com",
		);
	});

	test("setQuery respects options.replace", () => {
		setURLSearch("?page=1");
		const { result } = renderHook(() => useUsersQueryParams());

		act(() => {
			result.current.setQuery({ order: "asc" }, { replace: true });
		});

		expect(mockReplace).toHaveBeenCalledWith("/admin/users?page=1&order=asc");
		expect(mockPush).not.toHaveBeenCalled();
	});

	test("setQuery respects explicit options.resetPage = false", () => {
		setURLSearch("?page=3");
		const { result } = renderHook(() => useUsersQueryParams());

		act(() => {
			result.current.setQuery(
				{ accountStatus: "active" },
				{ resetPage: false },
			);
		});

		// Page should remain 3 since we explicitly disabled resetPage
		expect(mockPush).toHaveBeenCalledWith(
			"/admin/users?page=3&accountStatus=active",
		);
	});

	test("setQuery removes parameter if undefined or empty string is passed", () => {
		setURLSearch("?page=2&role=admin&name=John");
		const { result } = renderHook(() => useUsersQueryParams());

		act(() => {
			// Using empty string to clear name, and undefined to clear role (simulating form clears)
			result.current.setQuery({ name: "", role: undefined });
		});

		// Changing filters resets page to 1
		expect(mockPush).toHaveBeenCalledWith("/admin/users?page=1");
	});

	test("clearAllFilters removes all active filters but keeps pagination and sorting", () => {
		setURLSearch(
			"?page=3&pageSize=50&sortBy=email&order=desc&role=admin&name=Alice",
		);
		const { result } = renderHook(() => useUsersQueryParams());

		act(() => {
			result.current.clearAllFilters();
		});

		// Sorting & pageSize should be kept.
		// `page` must be reset to 1
		expect(mockPush).toHaveBeenCalledWith(
			"/admin/users?sortBy=email&order=desc&pageSize=50&page=1",
		);
	});
});
