import {
	Gift,
	Users,
	TrendingUp,
	Check,
	Share2,
	Link2,
	DollarSign,
} from "lucide-react";

import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { AuthLink } from "@/components/shared/auth-link";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { Card, CardContent } from "@/lib/components/card";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Referral Program | LLM API",
	description:
		"Earn $20 credits for each friend who signs up and deposits $50. Share your referral link—credits are added directly to your account.",
	openGraph: {
		title: "Referral Program | LLM API",
		description:
			"Earn $20 credits for each referred user who deposits $50. No limit on referrals.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Referral Program | LLM API",
		description:
			"Earn $20 credits for each referred user who deposits $50. No limit on referrals.",
	},
};

export default function ReferralsPublicPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Hero navbarOnly>{null}</Hero>
			<section className="relative overflow-hidden border-b bg-linear-to-b from-primary/5 via-background to-background">
				<div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-800" />
				<div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-32">
					<div className="mx-auto max-w-3xl space-y-8 text-center">
						<Badge
							variant="secondary"
							className="inline-flex items-center gap-2 px-4 py-1.5"
						>
							<Gift className="h-3.5 w-3.5 text-primary" />
							<span className="text-sm font-medium">Referral Program</span>
						</Badge>

						<h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
							Turn connections into{" "}
							<span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
								credits
							</span>
						</h1>

						<p className="text-pretty text-base text-muted-foreground sm:text-lg md:text-xl">
							Share your link with users and teams. When they deposit{" "}
							<span className="font-semibold text-foreground">$50</span> in
							credits, you earn{" "}
							<span className="font-semibold text-foreground">$20</span> credits
							— added directly to your account. No limit on how many you refer.
						</p>

						<div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
							<Button
								size="lg"
								className="group h-12 px-8 text-base font-medium"
								asChild
							>
								<AuthLink href="/signup">Get started</AuthLink>
							</Button>
						</div>

						<div className="grid gap-4 pt-8 sm:grid-cols-3">
							<Card className="border-primary/20 bg-card/50 backdrop-blur">
								<CardContent className="p-6 text-center">
									<div className="text-3xl font-bold text-primary">$20</div>
									<div className="mt-1 text-sm text-muted-foreground">
										Per referral
									</div>
								</CardContent>
							</Card>
							<Card className="border-primary/20 bg-card/50 backdrop-blur">
								<CardContent className="p-6 text-center">
									<div className="text-3xl font-bold text-primary">$50</div>
									<div className="mt-1 text-sm text-muted-foreground">
										Their first deposit
									</div>
								</CardContent>
							</Card>
							<Card className="border-primary/20 bg-card/50 backdrop-blur">
								<CardContent className="p-6 text-center">
									<div className="text-3xl font-bold text-primary">∞</div>
									<div className="mt-1 text-sm text-muted-foreground">
										Referral limit
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			<section className="container mx-auto px-4 py-16 md:py-24">
				<div className="mx-auto max-w-5xl space-y-12">
					<div className="space-y-4 text-center">
						<Badge variant="outline" className="text-xs">
							Simple & Transparent
						</Badge>
						<h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
							How referrals work
						</h2>
						<p className="mx-auto max-w-2xl text-pretty text-muted-foreground md:text-lg">
							Start earning in three simple steps. No complicated setup, just
							straightforward rewards for helping teams discover LLM API.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						<Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
							<div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/10 transition-transform group-hover:scale-150" />
							<CardContent className="relative p-8 space-y-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Link2 className="h-6 w-6" />
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Badge
											variant="secondary"
											className="h-6 w-6 justify-center rounded-full p-0 text-xs font-bold"
										>
											1
										</Badge>
										<h3 className="font-semibold text-lg">Get your link</h3>
									</div>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Sign up and copy your personalized referral link from the
										dashboard. No minimum deposit required.
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
							<div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/10 transition-transform group-hover:scale-150" />
							<CardContent className="relative p-8 space-y-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Share2 className="h-6 w-6" />
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Badge
											variant="secondary"
											className="h-6 w-6 justify-center rounded-full p-0 text-xs font-bold"
										>
											2
										</Badge>
										<h3 className="font-semibold text-lg">Share your link</h3>
									</div>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Copy your personalized referral link from the dashboard and
										share it with teams who could benefit from LLM API.
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
							<div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/10 transition-transform group-hover:scale-150" />
							<CardContent className="relative p-8 space-y-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<DollarSign className="h-6 w-6" />
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Badge
											variant="secondary"
											className="h-6 w-6 justify-center rounded-full p-0 text-xs font-bold"
										>
											3
										</Badge>
										<h3 className="font-semibold text-lg">Earn $20 credits</h3>
									</div>
									<p className="text-sm text-muted-foreground leading-relaxed">
										When they deposit their first $50 in credits, you
										automatically receive $20 credits. Track earnings in your
										dashboard.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<section className="border-t bg-muted/30">
				<div className="container mx-auto px-4 py-16 md:py-24">
					<div className="mx-auto max-w-5xl">
						<Card className="border-2">
							<CardContent className="p-8 md:p-12">
								<div className="space-y-8">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
											<TrendingUp className="h-5 w-5 text-primary" />
										</div>
										<h3 className="text-2xl font-bold">Program details</h3>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="flex gap-3">
											<div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
												<Check className="h-3 w-3 text-primary" />
											</div>
											<div className="space-y-1">
												<p className="font-medium">Direct credit deposits</p>
												<p className="text-sm text-muted-foreground leading-relaxed">
													Credits are automatically added to your account
													balance—no manual claims needed.
												</p>
											</div>
										</div>

										<div className="flex gap-3">
											<div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
												<Check className="h-3 w-3 text-primary" />
											</div>
											<div className="space-y-1">
												<p className="font-medium">Use for LLM services</p>
												<p className="text-sm text-muted-foreground leading-relaxed">
													Referral credits can be used for any LLM usage but
													cannot be withdrawn or paid out.
												</p>
											</div>
										</div>

										<div className="flex gap-3">
											<div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
												<Check className="h-3 w-3 text-primary" />
											</div>
											<div className="space-y-1">
												<p className="font-medium">Unlimited referrals</p>
												<p className="text-sm text-muted-foreground leading-relaxed">
													There is no limit to how many users you can refer or
													how much you can earn.
												</p>
											</div>
										</div>
									</div>

									<div className="rounded-lg border bg-muted/50 p-6">
										<div className="flex items-start gap-3">
											<Users className="mt-0.5 h-5 w-5 text-primary" />
											<div className="space-y-1">
												<p className="font-medium">Eligibility</p>
												<p className="text-sm text-muted-foreground leading-relaxed">
													Available to all users. Sign up, get your referral
													link from the dashboard, and start sharing—no minimum
													deposit required.
												</p>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<section className="border-t">
				<div className="container mx-auto px-4 py-16 md:py-24">
					<div className="mx-auto max-w-3xl space-y-8 text-center">
						<div className="space-y-4">
							<h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
								Ready to start earning?
							</h2>
							<p className="mx-auto max-w-2xl text-pretty text-muted-foreground md:text-lg">
								Join the referral program today and turn your network into a
								source of passive income.
							</p>
						</div>
						<Button
							asChild
							size="lg"
							className="h-12 px-8 text-base font-medium group"
						>
							<AuthLink href="/signup">Sign up to get started</AuthLink>
						</Button>
					</div>
				</div>
			</section>
			<Footer />
		</div>
	);
}
