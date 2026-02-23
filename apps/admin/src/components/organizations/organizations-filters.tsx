"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PLAN_OPTIONS = ["free", "pro"] as const;
const STATUS_OPTIONS = ["active", "inactive", "deleted"] as const;
const RETENTION_OPTIONS = ["retain", "none"] as const;

const serializeMultiValue = (value: string[]) => value.join(",");

interface OrganizationsFiltersProps {
	plans: string[];
	statuses: string[];
	retentionLevels: string[];
}

export const OrganizationsFilters = ({
	plans,
	statuses,
	retentionLevels,
}: OrganizationsFiltersProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const selectedCount = plans.length + statuses.length + retentionLevels.length;

	const toggleValue = (
		key: string,
		currentValues: string[],
		nextValue: string,
	) => {
		const params = new URLSearchParams(searchParams);
		const nextValues = currentValues.includes(nextValue)
			? currentValues.filter((value) => value !== nextValue)
			: [...currentValues, nextValue];

		if (nextValues.length) {
			params.set(key, serializeMultiValue(nextValues));
		} else {
			params.delete(key);
		}

		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};

	const clearFilters = () => {
		const params = new URLSearchParams(searchParams);
		params.delete("plans");
		params.delete("statuses");
		params.delete("retentionLevels");
		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="gap-2">
						<SlidersHorizontal className="h-4 w-4" />
						Filters
						{selectedCount > 0 ? (
							<Badge variant="secondary" className="ml-1">
								{selectedCount}
							</Badge>
						) : null}
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="w-64">
					<DropdownMenuLabel>Plan</DropdownMenuLabel>
					{PLAN_OPTIONS.map((option) => (
						<DropdownMenuCheckboxItem
							key={option}
							checked={plans.includes(option)}
							onCheckedChange={() => toggleValue("plans", plans, option)}
						>
							{option.toUpperCase()}
						</DropdownMenuCheckboxItem>
					))}

					<DropdownMenuSeparator />
					<DropdownMenuLabel>Status</DropdownMenuLabel>
					{STATUS_OPTIONS.map((option) => (
						<DropdownMenuCheckboxItem
							key={option}
							checked={statuses.includes(option)}
							onCheckedChange={() => toggleValue("statuses", statuses, option)}
						>
							{option}
						</DropdownMenuCheckboxItem>
					))}

					<DropdownMenuSeparator />
					<DropdownMenuLabel>Retention level</DropdownMenuLabel>
					{RETENTION_OPTIONS.map((option) => (
						<DropdownMenuCheckboxItem
							key={option}
							checked={retentionLevels.includes(option)}
							onCheckedChange={() =>
								toggleValue("retentionLevels", retentionLevels, option)
							}
						>
							{option}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{selectedCount > 0 ? (
				<Button variant="ghost" onClick={clearFilters} className="gap-1.5">
					<X className="h-4 w-4" />
					Clear filters
				</Button>
			) : null}
		</div>
	);
};
