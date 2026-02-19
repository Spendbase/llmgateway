"use client";

import { Gift, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/lib/components/button";
import { cn } from "@/lib/utils";

interface FreeCreditsBannerProps {
	creditAmount: string;
	onClose?: () => void;
}

export function FreeCreditsBanner({
	creditAmount,
	onClose,
}: FreeCreditsBannerProps) {
	const [isVisible, setIsVisible] = useState(true);

	const handleClose = () => {
		setIsVisible(false);
		onClose?.();
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div className="absolute md:top-0 top-[53px] left-0 w-full h-[68px] border border-y-emerald-400">
			<Image
				src="/api-keys/free-credits-banner.svg"
				alt=""
				role="presentation"
				fill
				className="object-cover"
				priority
			/>
			<div className="absolute inset-0 flex items-center justify-between px-6">
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
						)}
					>
						<Gift className="h-4 w-4" />
					</div>
					<span className="text-emerald-500 font-semibold">
						You have ${creditAmount} Free credits
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={handleClose}
					className={cn(
						"h-2 w-2 mb-5 text-black hover:bg-emerald-500/10 hover:text-emerald-500",
						"transition-colors rounded-full",
					)}
					aria-label="Close banner"
				>
					<X className="h-2 w-2" />
				</Button>
			</div>
		</div>
	);
}
