import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useUsersQueryParams } from "@/hooks/use-users-query-params";

import { ColumnFilterPopover } from "./column-filter-popover";
import { DateRangeFilter } from "./date-range-filter";

import type { SortBy } from "@/hooks/use-users-query-params";

type FilterType = "text" | "select" | "date" | "none";

interface FilterOption {
	label: string;
	value: string;
}

interface UsersColumnHeaderProps {
	title: string;
	sortKey?: SortBy;
	filterKey?: keyof ReturnType<typeof useUsersQueryParams>["query"];
	filterType?: FilterType;
	filterOptions?: FilterOption[];
}

export function UsersColumnHeader({
	title,
	sortKey,
	filterKey,
	filterType = "none",
	filterOptions = [],
}: UsersColumnHeaderProps) {
	const { query, setQuery } = useUsersQueryParams();
	const [localTextValue, setLocalTextValue] = React.useState("");
	const [localSelectValue, setLocalSelectValue] = React.useState("");
	const [localDateFrom, setLocalDateFrom] = React.useState("");
	const [localDateTo, setLocalDateTo] = React.useState("");
	const [hasDateError, setHasDateError] = React.useState(false);

	const isSortedAsc = query.sortBy === sortKey && query.order === "asc";
	const isSortedDesc = query.sortBy === sortKey && query.order === "desc";

	const headerValue = filterKey ? query[filterKey] : undefined;
	const isFilterActive = React.useMemo(() => {
		if (filterType === "date") {
			return !!(query.registeredAtFrom || query.registeredAtTo);
		}
		return !!headerValue;
	}, [filterType, headerValue, query.registeredAtFrom, query.registeredAtTo]);

	// Sync local state when popover opens/URL changes
	React.useEffect(() => {
		if (filterType === "text" && filterKey) {
			setLocalTextValue((query[filterKey] as string) || "");
		} else if (filterType === "select" && filterKey) {
			setLocalSelectValue((query[filterKey] as string) || "");
		} else if (filterType === "date") {
			setLocalDateFrom(query.registeredAtFrom || "");
			setLocalDateTo(query.registeredAtTo || "");
		}
	}, [query, filterType, filterKey]);

	const toggleSort = () => {
		if (!sortKey) {
			return;
		}

		if (isSortedAsc) {
			setQuery(
				{ sortBy: sortKey, order: "desc" },
				{ replace: true, resetPage: true },
			);
		} else if (isSortedDesc) {
			// Reset to default
			setQuery(
				{ sortBy: undefined, order: undefined },
				{ replace: true, resetPage: true },
			);
		} else {
			setQuery(
				{ sortBy: sortKey, order: "asc" },
				{ replace: true, resetPage: true },
			);
		}
	};

	const handleApplyFilter = () => {
		if (!filterKey && filterType !== "date") {
			return;
		}

		if (filterType === "text" && filterKey) {
			setQuery({ [filterKey]: localTextValue }, { resetPage: true });
		} else if (filterType === "select" && filterKey) {
			setQuery(
				{
					[filterKey]:
						localSelectValue === "all" ? undefined : localSelectValue,
				},
				{ resetPage: true },
			);
		} else if (filterType === "date" && !hasDateError) {
			setQuery(
				{
					registeredAtFrom: localDateFrom || undefined,
					registeredAtTo: localDateTo || undefined,
				},
				{ resetPage: true },
			);
		}
	};

	const handleClearFilter = () => {
		if (!filterKey && filterType !== "date") {
			return;
		}

		if (filterType === "date") {
			setLocalDateFrom("");
			setLocalDateTo("");
			setHasDateError(false);
			setQuery(
				{
					registeredAtFrom: undefined,
					registeredAtTo: undefined,
				},
				{ resetPage: true },
			);
		} else if (filterKey) {
			if (filterType === "text") {
				setLocalTextValue("");
			}
			if (filterType === "select") {
				setLocalSelectValue("");
			}
			setQuery({ [filterKey]: undefined }, { resetPage: true });
		}
	};

	const renderFilterInput = () => {
		if (filterType === "text") {
			return (
				<Input
					placeholder={`Filter by ${title.toLowerCase()}...`}
					value={localTextValue}
					onChange={(e) => setLocalTextValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleApplyFilter();
						}
					}}
				/>
			);
		}

		if (filterType === "select") {
			return (
				<Select
					value={localSelectValue}
					onValueChange={(val) => setLocalSelectValue(val)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select an option" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						{filterOptions.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);
		}

		if (filterType === "date") {
			return (
				<DateRangeFilter
					fromValue={localDateFrom}
					toValue={localDateTo}
					onChange={(from, to) => {
						setLocalDateFrom(from);
						setLocalDateTo(to);
					}}
					onError={setHasDateError}
				/>
			);
		}

		return null;
	};

	return (
		<div className="flex items-center gap-1 p-2">
			{sortKey ? (
				<Button
					variant="ghost"
					size="sm"
					onClick={toggleSort}
					className="h-8 -ml-3"
				>
					<span>{title}</span>
					{isSortedDesc ? (
						<ArrowDown className="ml-2 h-4 w-4" />
					) : isSortedAsc ? (
						<ArrowUp className="ml-2 h-4 w-4" />
					) : (
						<ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />
					)}
				</Button>
			) : (
				<span className="text-sm font-medium">{title}</span>
			)}

			{filterType !== "none" && (
				<ColumnFilterPopover
					isActive={isFilterActive}
					onApply={handleApplyFilter}
					onClear={handleClearFilter}
				>
					{renderFilterInput()}
				</ColumnFilterPopover>
			)}
		</div>
	);
}
