"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export function ModelsSearch() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [searchValue, setSearchValue] = useState(
		searchParams.get("search") || "",
	);
	const debouncedSearch = useDebounce(searchValue, 300);

	useEffect(() => {
		const params = new URLSearchParams(searchParams);
		const currentSearch = params.get("search") || "";

		// Update URL only if the value actually changed
		if (debouncedSearch !== currentSearch) {
			if (debouncedSearch) {
				params.set("search", debouncedSearch);
			} else {
				params.delete("search");
			}

			router.push(`${pathname}?${params.toString()}`);
		}
	}, [debouncedSearch, pathname, searchParams, router]);

	const handleClear = () => {
		setSearchValue("");
	};

	return (
		<div className="relative flex-1 max-w-md">
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search by name or ID..."
				value={searchValue}
				onChange={(e) => setSearchValue(e.target.value)}
				className="pl-9 pr-9"
			/>
			{searchValue && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleClear}
					className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
				>
					<X className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
