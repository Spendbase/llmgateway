"use client";

import { Gift, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/lib/components/button";
import { cn } from "@/lib/utils";

export function FreeCreditsBanner({
	handleClose,
}: {
	handleClose: () => void;
}) {
	const creditAmount = process.env.NEXT_PUBLIC_AUTO_DEPOSIT_CREDITS || "50";

	return (
		<div className="relative w-full h-[68px] border border-y-emerald-400 mt-[53px] md:mt-0">
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
						"h-8 w-8 mb-5 text-black hover:bg-emerald-500/10 hover:text-emerald-500",
						"transition-colors rounded-full",
					)}
					aria-label="Close banner"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
