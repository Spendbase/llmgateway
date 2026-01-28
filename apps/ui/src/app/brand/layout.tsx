import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Brand Assets | LLM API",
	description:
		"Download official LLM API logos and brand assets. Get our logo in PNG or SVG format, with or without the name, in black and white variants.",
	openGraph: {
		title: "Brand Assets | LLM API",
		description:
			"Download official LLM API logos and brand assets. Get our logo in PNG or SVG format, with or without the name, in black and white variants.",
	},
};

export default function BrandLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div>
			<Hero navbarOnly>{null}</Hero>
			{children}
			<Footer />
		</div>
	);
}
