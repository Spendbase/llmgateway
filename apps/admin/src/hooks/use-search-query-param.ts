"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";

interface UseSearchQueryParamOptions {
	paramKey?: string;
	resetPageParam?: string;
	debounceMs?: number;
}

export const useSearchQueryParam = ({
	paramKey = "search",
	resetPageParam = "page",
	debounceMs = 300,
}: UseSearchQueryParamOptions = {}) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [searchValue, setSearchValue] = useState(
		searchParams.get(paramKey) || "",
	);
	const debouncedSearchValue = useDebounce(searchValue, debounceMs);

	useEffect(() => {
		setSearchValue(searchParams.get(paramKey) || "");
	}, [paramKey, searchParams]);

	useEffect(() => {
		const params = new URLSearchParams(searchParams);
		const currentSearch = params.get(paramKey) || "";

		if (debouncedSearchValue === currentSearch) {
			return;
		}

		if (debouncedSearchValue) {
			params.set(paramKey, debouncedSearchValue);
		} else {
			params.delete(paramKey);
		}

		params.set(resetPageParam, "1");
		router.push(`${pathname}?${params.toString()}`);
	}, [
		debouncedSearchValue,
		paramKey,
		pathname,
		resetPageParam,
		router,
		searchParams,
	]);

	const clearSearch = () => {
		setSearchValue("");
	};

	return {
		searchValue,
		setSearchValue,
		clearSearch,
	};
};
