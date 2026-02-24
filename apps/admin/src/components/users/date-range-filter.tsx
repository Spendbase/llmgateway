import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
	fromValue: string;
	toValue: string;
	onChange: (from: string, to: string) => void;
	onError: (hasError: boolean) => void;
}

export function DateRangeFilter({
	fromValue,
	toValue,
	onChange,
	onError,
}: DateRangeFilterProps) {
	const [localFrom, setLocalFrom] = React.useState(fromValue);
	const [localTo, setLocalTo] = React.useState(toValue);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		setLocalFrom(fromValue);
		setLocalTo(toValue);
	}, [fromValue, toValue]);

	const validate = (from: string, to: string) => {
		if (from && to) {
			const fromDate = new Date(from);
			const toDate = new Date(to);
			if (fromDate > toDate) {
				setError("'From' date must be before or equal to 'To' date");
				onError(true);
				return false;
			}
		}
		setError(null);
		onError(false);
		return true;
	};

	const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setLocalFrom(val);
		if (validate(val, localTo)) {
			onChange(val, localTo);
		}
	};

	const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setLocalTo(val);
		if (validate(localFrom, val)) {
			onChange(localFrom, val);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-2">
				<Label htmlFor="date-from">From</Label>
				<Input
					id="date-from"
					type="date"
					value={localFrom}
					onChange={handleFromChange}
					max={localTo || undefined}
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="date-to">To</Label>
				<Input
					id="date-to"
					type="date"
					value={localTo}
					onChange={handleToChange}
					min={localFrom || undefined}
				/>
			</div>
			{error ? (
				<p className="text-[0.8rem] font-medium text-destructive">{error}</p>
			) : null}
		</div>
	);
}
