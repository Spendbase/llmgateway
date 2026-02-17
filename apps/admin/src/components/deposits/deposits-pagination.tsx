"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface DepositsPaginationProps {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	totalDeposits: number;
}

export function DepositsPagination({
	currentPage,
	totalPages,
	pageSize,
	totalDeposits,
}: DepositsPaginationProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", page.toString());
		router.push(`${pathname}?${params.toString()}`);
	};

	const handlePageSizeChange = (newPageSize: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("pageSize", newPageSize);
		params.set("page", "1");
		router.push(`${pathname}?${params.toString()}`);
	};

	const startItem = (currentPage - 1) * pageSize + 1;
	const endItem = Math.min(currentPage * pageSize, totalDeposits);

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisible = 7;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			pages.push(1);

			if (currentPage > 3) {
				pages.push("...");
			}

			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (currentPage < totalPages - 2) {
				pages.push("...");
			}

			pages.push(totalPages);
		}

		return pages;
	};

	return (
		<div className="flex items-center justify-between border-t pt-4">
			<div className="flex items-center gap-4">
				<div className="text-sm text-gray-600">
					Showing {startItem}-{endItem} of {totalDeposits} deposits
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-600">Show:</span>
					<Select
						value={pageSize.toString()}
						onValueChange={handlePageSizeChange}
					>
						<SelectTrigger className="w-20">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10</SelectItem>
							<SelectItem value="20">20</SelectItem>
							<SelectItem value="50">50</SelectItem>
							<SelectItem value="100">100</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(currentPage - 1)}
					disabled={currentPage === 1}
				>
					Previous
				</Button>

				{getPageNumbers().map((page, index) =>
					typeof page === "number" ? (
						<Button
							key={index}
							variant={currentPage === page ? "default" : "outline"}
							size="sm"
							onClick={() => handlePageChange(page)}
							className="min-w-[2.5rem]"
						>
							{page}
						</Button>
					) : (
						<span key={index} className="px-2 text-gray-400">
							{page}
						</span>
					),
				)}

				<Button
					variant="outline"
					size="sm"
					onClick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
