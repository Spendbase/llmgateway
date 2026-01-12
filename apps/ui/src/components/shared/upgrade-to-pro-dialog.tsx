import { useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";

interface UpgradeToProDialogProps {
	children: React.ReactNode;
	initialBillingCycle?: "monthly" | "yearly";
}

export function UpgradeToProDialog({ children }: UpgradeToProDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Pro Features Available</DialogTitle>
					<DialogDescription>
						All Pro features are now available to everyone! You can access
						provider keys, team management, and all other Pro features without
						any subscription.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4 space-y-4">
					<div className="border rounded-lg p-4 space-y-3">
						<h4 className="font-medium">Available Features:</h4>
						<ul className="space-y-2 text-sm">
							<li className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								Use your own OpenAI, Anthropic, and other provider API keys
							</li>
							<li className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								Hybrid mode: fallback to credits when needed
							</li>
							<li className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								Team management: invite and manage team members
							</li>
							<li className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								Credits system with analytics
							</li>
						</ul>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
