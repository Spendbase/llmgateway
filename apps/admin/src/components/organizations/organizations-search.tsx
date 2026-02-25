"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchQueryParam } from "@/hooks/use-search-query-param";

interface OrganizationsSearchProps {
	suggestions: string[];
}

export const OrganizationsSearch = ({
	suggestions,
}: OrganizationsSearchProps) => {
	const { searchValue, setSearchValue, clearSearch } = useSearchQueryParam({
		paramKey: "search",
	});
	const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

	const filteredSuggestions = useMemo(() => {
		const query = searchValue.trim().toLowerCase();

		if (!query) {
			return suggestions.slice(0, 6);
		}

		return suggestions
			.filter((item) => item.toLowerCase().includes(query))
			.slice(0, 6);
	}, [searchValue, suggestions]);

	return (
		<div className="relative w-full max-w-md">
			<Search className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search by name, email or company..."
				value={searchValue}
				onChange={(event) => {
					setSearchValue(event.target.value);
					setIsSuggestionsOpen(true);
				}}
				onFocus={() => setIsSuggestionsOpen(true)}
				onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 120)}
				className="pr-9 pl-9"
			/>
			{searchValue && (
				<Button
					variant="ghost"
					size="sm"
					onClick={clearSearch}
					className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
				>
					<X className="h-4 w-4" />
				</Button>
			)}

			{isSuggestionsOpen && filteredSuggestions.length > 0 ? (
				<div className="absolute top-[calc(100%+0.5rem)] z-20 w-full rounded-md border bg-popover p-1 shadow-md">
					{filteredSuggestions.map((suggestion) => (
						<button
							key={suggestion}
							type="button"
							onMouseDown={(event) => {
								event.preventDefault();
								setSearchValue(suggestion);
								setIsSuggestionsOpen(false);
							}}
							className="w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							{suggestion}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
};
