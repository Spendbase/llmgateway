"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCsv, exportToXlsx } from "@/lib/export-utils";

interface OrgExportButtonProps {
	activeTab: string;
	filename: string;
	getData: () => Record<string, unknown>[];
}

export function OrgExportButton({
	activeTab: _activeTab,
	filename,
	getData,
}: OrgExportButtonProps) {
	const [loading, setLoading] = useState(false);

	const handleExport = async (format: "csv" | "xlsx") => {
		setLoading(true);
		try {
			const rows = getData();
			if (format === "csv") {
				exportToCsv(filename, rows as Parameters<typeof exportToCsv>[1]);
			} else {
				exportToXlsx(filename, rows as Parameters<typeof exportToXlsx>[1]);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" disabled={loading}>
					<Download className="h-4 w-4 mr-2" />
					Export
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => handleExport("csv")}>
					Export as CSV
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleExport("xlsx")}>
					Export as Excel
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
