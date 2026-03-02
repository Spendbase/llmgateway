"use client";

import { Check, Copy, DollarSign, Gift, Link2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";

import type { Organization } from "@/lib/types";
import type { ReactNode } from "react";

interface ReferralDialogProps {
	children: ReactNode;
	selectedOrganization: Organization | null;
}

export function ReferralDialog({
	children,
	selectedOrganization,
}: ReferralDialogProps) {
	const router = useRouter();
	const { buildOrgUrl } = useDashboardNavigation();
	const [open, setOpen] = useState(false);
	const [origin, setOrigin] = useState<string>("https://llmapi.ai");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setOrigin(window.location.origin);
		}
	}, []);

	const referralLink = selectedOrganization?.id
		? `${origin}/?ref=${selectedOrganization.id}`
		: "";

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(referralLink);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// ignore
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[460px]">
				<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
					<DialogHeader className="shrink-0 items-center space-y-2 pt-1">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Gift className="h-6 w-6 text-primary" />
						</div>
						<DialogTitle className="text-center text-xl font-bold">
							Invite &amp; earn $20
						</DialogTitle>
					</DialogHeader>

					<div className="mt-2 shrink-0 space-y-3">
						<div className="space-y-1.5 rounded-lg border bg-muted/40 p-2.5">
							<div className="text-xs font-medium text-muted-foreground">
								Share your link
							</div>
							<div className="flex gap-2">
								<div className="min-w-0 flex-1 truncate rounded-md bg-background/80 px-2.5 py-1.5 text-xs font-mono">
									{referralLink}
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleCopy}
									className="shrink-0 gap-1.5"
								>
									{copied ? (
										<>
											<Check className="h-3.5 w-3.5 text-green-500" />
											Copied
										</>
									) : (
										<>
											<Copy className="h-3.5 w-3.5" />
											Copy
										</>
									)}
								</Button>
							</div>
						</div>

						<div className="space-y-1.5 rounded-lg border bg-muted/40 p-2.5 text-xs">
							<div className="font-medium">How it works</div>
							<ul className="space-y-2">
								<li className="flex items-start gap-2">
									<Link2 className="mt-[2px] h-3.5 w-3.5 shrink-0 text-primary" />
									<span>
										Copy your personalized referral link from the dashboard and
										share it with users who could benefit from LLM API.
									</span>
								</li>
								<li className="flex items-start gap-2">
									<DollarSign className="mt-[2px] h-3.5 w-3.5 shrink-0 text-primary" />
									<span>
										Automatically earn <strong>$20</strong> credits after they
										deposit <strong>$50</strong> credits. Track earnings in
										real-time from your dashboard.
									</span>
								</li>
								<li className="flex items-start gap-2">
									<Users className="mt-[2px] h-3.5 w-3.5 shrink-0 text-primary" />
									<span>Credits apply to your personal scope.</span>
								</li>
							</ul>
						</div>

						{selectedOrganization && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="w-full text-xs text-muted-foreground"
								onClick={() => {
									router.push(buildOrgUrl("/org/referrals"));
									setOpen(false);
								}}
							>
								Manage referral settings
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
