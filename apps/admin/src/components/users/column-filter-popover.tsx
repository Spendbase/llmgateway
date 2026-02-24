import { Filter } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface ColumnFilterPopoverProps {
	isActive: boolean;
	onApply: () => void;
	onClear: () => void;
	children: React.ReactNode;
}

export function ColumnFilterPopover({
	isActive,
	onApply,
	onClear,
	children,
}: ColumnFilterPopoverProps) {
	const [open, setOpen] = React.useState(false);

	const handleApply = () => {
		onApply();
		setOpen(false);
	};

	const handleClear = () => {
		onClear();
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={`h-8 w-8 p-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
				>
					<Filter
						className={`h-4 w-4 ${isActive ? "fill-primary text-primary" : ""}`}
					/>
					<span className="sr-only">Open filter menu</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-4" align="start">
				<div className="space-y-4">
					<div className="space-y-2">{children}</div>
					<div className="flex items-center justify-between space-x-2 pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleClear}
							className="w-full"
						>
							Clear
						</Button>
						<Button size="sm" onClick={handleApply} className="w-full">
							Apply
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
