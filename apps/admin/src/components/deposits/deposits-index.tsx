"use client";
import { X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { DepositsPagination } from "@/components/deposits/deposits-pagination";
import { DepositsTable } from "@/components/deposits/deposits-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { paths } from "@/lib/api/v1";

type DepositsResponse =
	paths["/admin/deposits"]["get"]["responses"]["200"]["content"]["application/json"];

export default function DepositsIndex({
	depositsData,
}: {
	depositsData: DepositsResponse;
}) {
	const { deposits, pagination } = depositsData;
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// State for filters
	const [q, setQ] = useState(searchParams.get("q") || "");
	const [status, setStatus] = useState(searchParams.get("status") || "all");
	const [from, setFrom] = useState(searchParams.get("from") || "");
	const [to, setTo] = useState(searchParams.get("to") || "");

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			updateFilters({ q });
		}, 500);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [q]);

	const updateFilters = (updates: {
		q?: string;
		status?: string;
		from?: string;
		to?: string;
	}) => {
		const params = new URLSearchParams(searchParams.toString());

		// Handle Q
		if (updates.q !== undefined) {
			if (updates.q) {
				params.set("q", updates.q);
			} else {
				params.delete("q");
			}
		}

		// Handle Status
		if (updates.status !== undefined) {
			if (updates.status && updates.status !== "all") {
				params.set("status", updates.status);
			} else {
				params.delete("status");
			}
		}

		// Handle From
		if (updates.from !== undefined) {
			if (updates.from) {
				params.set("from", updates.from);
			} else {
				params.delete("from");
			}
		}

		// Handle To
		if (updates.to !== undefined) {
			if (updates.to) {
				params.set("to", updates.to);
			} else {
				params.delete("to");
			}
		}

		// Always reset page to 1 when filtering
		if (
			updates.q !== undefined ||
			updates.status !== undefined ||
			updates.from !== undefined ||
			updates.to !== undefined
		) {
			params.set("page", "1");
		}

		router.push(`${pathname}?${params.toString()}`);
	};

	const handleStatusChange = (value: string) => {
		setStatus(value);
		updateFilters({ status: value });
	};

	const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (val) {
			const iso = new Date(val).toISOString();
			setFrom(iso);
			updateFilters({ from: iso });
		} else {
			setFrom("");
			updateFilters({ from: "" });
		}
	};

	const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (val) {
			const date = new Date(val);
			date.setUTCHours(23, 59, 59, 999);
			const iso = date.toISOString();
			setTo(iso);
			updateFilters({ to: iso });
		} else {
			setTo("");
			updateFilters({ to: "" });
		}
	};

	const clearFilters = () => {
		setQ("");
		setStatus("all");
		setFrom("");
		setTo("");
		router.push(pathname);
	};

	// Convert ISO strings back to YYYY-MM-DD for input display
	const getInputValue = (isoString: string) => {
		if (!isoString) {
			return "";
		}
		try {
			// Handle invalid dates gracefully
			const date = new Date(isoString);
			if (isNaN(date.getTime())) {
				return "";
			}
			return date.toISOString().split("T")[0];
		} catch {
			return "";
		}
	};

	return (
		<div className="flex flex-1 flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Deposits</h1>
					<p className="text-sm text-gray-500">
						View and manage all organization deposits
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-end gap-4 rounded-md border p-4 bg-muted/20">
				<div className="flex w-full max-w-sm flex-col gap-1.5">
					<label className="text-xs font-medium text-muted-foreground">
						Search
					</label>
					<Input
						placeholder="Search transaction ID, org, invoice..."
						value={q}
						onChange={(e) => setQ(e.target.value)}
						className="bg-background"
					/>
				</div>

				<div className="flex w-[180px] flex-col gap-1.5">
					<label className="text-xs font-medium text-muted-foreground">
						Status
					</label>
					<Select value={status} onValueChange={handleStatusChange}>
						<SelectTrigger className="bg-background">
							<SelectValue placeholder="All Statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex w-[150px] flex-col gap-1.5">
					<label className="text-xs font-medium text-muted-foreground">
						From Date
					</label>
					<Input
						type="date"
						value={getInputValue(from)}
						onChange={handleFromChange}
						className="bg-background"
					/>
				</div>

				<div className="flex w-[150px] flex-col gap-1.5">
					<label className="text-xs font-medium text-muted-foreground">
						To Date
					</label>
					<Input
						type="date"
						value={getInputValue(to)}
						onChange={handleToChange}
						className="bg-background"
					/>
				</div>

				<div className="flex flex-col gap-1.5 pb-0.5">
					{(q || status !== "all" || from || to) && (
						<Button
							variant="ghost"
							size="icon"
							onClick={clearFilters}
							title="Clear filters"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			{deposits.length === 0 ? (
				<div className="rounded-md border p-8 text-center text-gray-500">
					No deposits found
				</div>
			) : (
				<>
					<DepositsTable deposits={deposits} />
					<DepositsPagination
						currentPage={pagination.page}
						totalPages={pagination.totalPages}
						pageSize={pagination.pageSize}
						totalDeposits={pagination.totalDeposits}
					/>
				</>
			)}
		</div>
	);
}
