"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomBadge } from "@/components/ui/custom-badge";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { getStatusVariant, getStatusIcon } from "./organizations-table";

const PLAN_OPTIONS = ["free", "pro"] as const;
const STATUS_OPTIONS = ["active", "inactive", "deleted"] as const;

const serializeMultiValue = (value: string[]) => value.join(",");

const toInputDate = (iso: string) => {
	if (!iso) {
		return "";
	}
	try {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) {
			return "";
		}
		return d.toISOString().split("T")[0];
	} catch {
		return "";
	}
};

interface OrganizationsFiltersProps {
	plans: string[];
	statuses: string[];
	retentionLevels: string[];
}

export const OrganizationsFilters = ({
	plans,
	statuses,
}: OrganizationsFiltersProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [from, setFrom] = useState(searchParams.get("from") || "");
	const [to, setTo] = useState(searchParams.get("to") || "");

	const hasDateFilter = !!from || !!to;
	const selectedCount =
		plans.length + statuses.length + (hasDateFilter ? 1 : 0);

	const pushParams = (params: URLSearchParams) => {
		router.push(`${pathname}?${params.toString()}`);
	};

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
		pushParams(params);
	};

	const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		const params = new URLSearchParams(searchParams);
		if (val) {
			const iso = new Date(val).toISOString();
			setFrom(iso);
			params.set("from", iso);
		} else {
			setFrom("");
			params.delete("from");
		}
		params.set("page", "1");
		pushParams(params);
	};

	const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		const params = new URLSearchParams(searchParams);
		if (val) {
			const date = new Date(val);
			date.setUTCHours(23, 59, 59, 999);
			const iso = date.toISOString();
			setTo(iso);
			params.set("to", iso);
		} else {
			setTo("");
			params.delete("to");
		}
		params.set("page", "1");
		pushParams(params);
	};

	const clearFilters = () => {
		setFrom("");
		setTo("");
		const params = new URLSearchParams(searchParams);
		params.delete("plans");
		params.delete("statuses");
		params.delete("from");
		params.delete("to");
		params.set("page", "1");
		pushParams(params);
	};

	return (
		<div className="flex items-center gap-2">
			{selectedCount > 0 ? (
				<Button variant="ghost" onClick={clearFilters} className="gap-1.5">
					<X className="h-4 w-4" />
					Clear filters
				</Button>
			) : null}
			<div className="flex items-center gap-2">
				<Input
					type="date"
					value={toInputDate(from)}
					onChange={handleFromChange}
					className="h-9 w-[140px] bg-background text-xs"
					placeholder="From"
				/>
				<span className="text-xs text-muted-foreground">–</span>
				<Input
					type="date"
					value={toInputDate(to)}
					onChange={handleToChange}
					className="h-9 w-[140px] bg-background text-xs"
					placeholder="To"
				/>
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						className="gap-2 flex justify-start min-w-30"
					>
						<SlidersHorizontal className="h-4 w-4" />
						Filters
						{selectedCount > 0 ? (
							<Badge variant="secondary">{selectedCount}</Badge>
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
							<CustomBadge variant={option === "pro" ? "blue" : "default"}>
								{option.toUpperCase()}
							</CustomBadge>
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
							<CustomBadge variant={getStatusVariant(option)}>
								<div className="flex items-center gap-1">
									{getStatusIcon(option)}
									{option || "-"}
								</div>
							</CustomBadge>
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
