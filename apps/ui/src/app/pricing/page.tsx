import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { PricingTable } from "@/components/pricing/pricing-table";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pricing - LLM API",
	description:
		"Simple, transparent pricing for LLM Gateway. Start free, scale with low fees.",
};

export default function PricingPage() {
	return (
		<>
			<Hero navbarOnly>{null}</Hero>
			<PricingHero />
			<PricingTable />
			<Footer />
		</>
	);
}
