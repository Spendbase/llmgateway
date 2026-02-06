import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";

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
		"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface",
	icons: {
		icon: "/favicon/favicon.svg?v=2",
	},
	alternates: {
		canonical: "./",
	},
	openGraph: {
		title: "Dashboard | LLM API",
		description:
			"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface",
		images: ["/opengraph.png?v=1"],
		type: "website",
		url: "https://app.llmapi.ai",
	},
	twitter: {
		card: "summary_large_image",
		title: "Dashboard | LLM API",
		description:
			"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface",
		images: ["/opengraph.png?v=1"],
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const config = getConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<Script id="gtm-script" strategy="afterInteractive">
				{`
					(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
					new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
					j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
					'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
					})(window,document,'script','dataLayer', '${config.gtmId}');
				`}
			</Script>
			<body
				className={`${inter.variable} ${geistMono.variable} min-h-screen antialiased`}
			>
				<noscript>
					<iframe
						sandbox=""
						src={`https://www.googletagmanager.com/ns.html?id=${config.gtmId!}`}
						height="0"
						width="0"
						style={{ display: "none", visibility: "hidden" }}
					/>
				</noscript>
				<Providers config={config}>{children}</Providers>
				<Script
					id="hs-script-loader"
					strategy="afterInteractive"
					src={`//js.hs-scripts.com/${config.hubspotPortalId}.js`}
				/>
			</body>
		</html>
	);
}
