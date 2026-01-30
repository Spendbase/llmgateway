import { Inter, Geist_Mono } from "next/font/google";

import { AdminShell } from "@/components/admin-shell";
import { UserProvider } from "@/components/auth/user-provider";
import { getConfig } from "@/lib/config-server";
import { Providers } from "@/lib/providers";
import { fetchServerData } from "@/lib/server-api";

import "./globals.css";

import type { User } from "@/lib/types";
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
	metadataBase: new URL("https://admin.llmapi.ai"),
	title: "LLM API Admin",
	description: "Admin dashboard for LLM API.",
	icons: {
		icon: "/favicon/favicon.svg?v=2",
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const config = getConfig();

	const initialUserData = await fetchServerData<
		{ user: User } | undefined | null
	>("GET", "/user/me");

	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${geistMono.variable} antialiased`}>
				<Providers config={config}>
					<UserProvider initialUserData={initialUserData}>
						<AdminShell>{children}</AdminShell>
					</UserProvider>
				</Providers>
			</body>
		</html>
	);
}
