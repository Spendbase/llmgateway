"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface ModelsFiltersProps {
	families: string[];
}

export function ModelsFilters({ families }: ModelsFiltersProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleStatusChange = (value: string) => {
		const params = new URLSearchParams(searchParams);

		if (value === "all") {
			params.delete("status");
		} else {
			params.set("status", value);
		}

		router.push(`/models?${params.toString()}`);
	};

	const handleFamilyChange = (value: string) => {
		const params = new URLSearchParams(searchParams);

		if (value === "all") {
			params.delete("family");
		} else {
			params.set("family", value);
		}

		router.push(`/models?${params.toString()}`);
	};

	const currentStatus = searchParams.get("status") || "all";
	const currentFamily = searchParams.get("family") || "all";

	return (
		<div className="flex gap-4">
			<div className="flex flex-col gap-2">
				<Label className="text-xs text-muted-foreground">Status</Label>
				<Select value={currentStatus} onValueChange={handleStatusChange}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
						<SelectItem value="deactivated">Deactivated</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2">
				<Label className="text-xs text-muted-foreground">Family</Label>
				<Select value={currentFamily} onValueChange={handleFamilyChange}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="All families" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Families</SelectItem>
						{families.map((family) => (
							<SelectItem key={family} value={family}>
								{family}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
