import { join } from "path";

import { config as dotenvConfig } from "dotenv";

import type { NextConfig } from "next";

dotenvConfig({ path: join(__dirname, "../../.env"), override: false });

const nextConfig: NextConfig = {
	outputFileTracingRoot: join(__dirname, "../../"),
	distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
	output: "standalone",
	reactStrictMode: true,
	productionBrowserSourceMaps: true,
	reactCompiler: true,
	transpilePackages: ["shiki"],
	// bundle-barrel-imports: Optimize package imports to avoid loading entire libraries
	// This transforms barrel imports to direct imports at build time (15-70% faster dev boot)
	experimental: {
		optimizePackageImports: [
			"lucide-react",
			"@radix-ui/react-icons",
			"date-fns",
		],
	},
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.devtool = "source-map";
		}
		return config;
	},
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
