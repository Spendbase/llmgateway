"use client";

import { Copy, Gift, Check, DollarSign, Link2, Users } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { useDashboardContext } from "@/lib/dashboard-context";

interface ReferralsClientProps {
	referredCount: number;
}

export function ReferralsClient({ referredCount }: ReferralsClientProps) {
	const { selectedOrganization } = useDashboardContext();
	const [copied, setCopied] = useState(false);
	const [origin, setOrigin] = useState("https://llmapi.ai");

	useEffect(() => {
		setOrigin(window.location.origin);
	}, []);

	const referralLink = selectedOrganization?.id
		? `${origin}/?ref=${selectedOrganization.id}`
		: "";

	const referralEarnings = selectedOrganization
		? Number(selectedOrganization.referralEarnings).toFixed(2)
		: "0.00";

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(referralLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Referrals</h2>
				</div>
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Gift className="h-5 w-5 text-primary" />
								Your Referral Link
							</CardTitle>
							<CardDescription>
								Share this link with others to earn referral credits
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono break-all">
									{referralLink || "—"}
								</div>
								<Button
									variant="outline"
									size="icon"
									onClick={copyToClipboard}
									className="shrink-0"
									disabled={!referralLink}
								>
									{copied ? (
										<Check className="h-4 w-4 text-green-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Your Stats</CardTitle>
							<CardDescription>
								Referral performance and earnings
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="rounded-lg border p-4">
									<div className="text-sm text-muted-foreground">
										Users Referred
									</div>
									<div className="text-2xl font-bold">{referredCount}</div>
								</div>
								<div className="rounded-lg border p-4">
									<div className="text-sm text-muted-foreground">
										Total Earnings
									</div>
									<div className="text-2xl font-bold">${referralEarnings}</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>How It Works</CardTitle>
							<CardDescription>
								Earn $20 credits for each referred user who deposits $50
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<ul className="space-y-3 text-sm">
									<li className="flex items-start gap-2">
										<Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
										<span>
											Copy your personalized referral link from the dashboard
											and share it with users who could benefit from LLM API.
										</span>
									</li>
									<li className="flex items-start gap-2">
										<DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
										<span>
											Automatically earn <strong>$20</strong> credits after they
											deposit <strong>$50</strong> credits. Track earnings in
											real-time from your dashboard.
										</span>
									</li>
									<li className="flex items-start gap-2">
										<Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
										<span>Credits apply to your personal scope.</span>
									</li>
								</ul>
								<div className="rounded-lg bg-muted p-4">
									<h4 className="font-semibold">Notes</h4>
									<ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
										<li>
											You can invite unlimited friends; $20 per friend who
											deposits $50.
										</li>
										<li>Credits are added to your account automatically.</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
