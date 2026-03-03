import { join, resolve } from "path";

import type { NextConfig } from "next";

try {
	process.loadEnvFile(resolve(__dirname, "../../.env"));
} catch {
	// no root .env
}

const nextConfig: NextConfig = {
	outputFileTracingRoot: join(__dirname, "../../"),
	distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
	output: "standalone",
	reactStrictMode: true,
	productionBrowserSourceMaps: true,
	reactCompiler: true,
	experimental: {
		// turbopackFileSystemCacheForDev: true,
		// turbopackFileSystemCacheForBuild: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	env: {
		NEXT_PUBLIC_STRIPE_PUB_KEY: process.env.STRIPE_PUB_KEY,
	},
};

export default nextConfig;
