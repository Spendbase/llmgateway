import { Inter, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { getConfig } from "@/lib/config-server";

import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	metadataBase: new URL("https://app.llmapi.ai"),
	title: "Dashboard | LLM API",
	description:
		"Manage your LLM API projects, monitor usage, and configure API keys.",
	icons: {
		icon: "/favicon/favicon.svg?v=2",
	},
	alternates: {
		canonical: "./",
	},
	openGraph: {
		title: "Dashboard | LLM API",
		description:
			"Manage your LLM API projects, monitor usage, and configure API keys.",
		images: ["/opengraph.png?v=1"],
		type: "website",
		url: "https://app.llmapi.ai",
	},
	twitter: {
		card: "summary_large_image",
		title: "Dashboard | LLM API",
		description:
			"Manage your LLM API projects, monitor usage, and configure API keys.",
		images: ["/opengraph.png?v=1"],
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const config = getConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${geistMono.variable} min-h-screen antialiased`}
			>
				<Providers config={config}>{children}</Providers>
			</body>
		</html>
	);
}
