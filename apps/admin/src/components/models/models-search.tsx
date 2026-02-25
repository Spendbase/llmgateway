"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchQueryParam } from "@/hooks/use-search-query-param";

export function ModelsSearch() {
	const { searchValue, setSearchValue, clearSearch } = useSearchQueryParam({
		paramKey: "search",
	});

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
					onClick={clearSearch}
					className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
				>
					<X className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
