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
	metadataBase: new URL("https://chat.llmapi.ai"),
	title: "LLM API Chat",
	description: "Chat with your favorite LLM models through LLM API.",
	icons: {
		icon: "/favicon/favicon.svg?v=2",
	},
	openGraph: {
		title: "LLM API Chat",
		description: "Chat with your favorite LLM models through LLM API.",
		images: ["/opengraph.png?v=1"],
		type: "website",
		url: "https://chat.llmapi.ai",
	},
	twitter: {
		card: "summary_large_image",
		title: "LLM API Chat",
		description: "Chat with your favorite LLM models through LLM API.",
		images: ["/opengraph.png?v=1"],
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const config = getConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${geistMono.variable} antialiased`}>
				<Providers config={config}>{children}</Providers>
			</body>
		</html>
	);
}
