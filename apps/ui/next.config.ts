import { join } from "path";

import { withContentCollections } from "@content-collections/next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	outputFileTracingRoot: join(__dirname, "../../"),
	distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
	output: "standalone",
	productionBrowserSourceMaps: true,
	typedRoutes: true,
	reactStrictMode: true,
	reactCompiler: true,
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.devtool = "source-map";
		}
		return config;
	},
	async redirects() {
		return [
			// Dashboard structure redirects (old /dashboard/* to new root paths)
			{
				source: "/dashboard",
				destination: "/",
				permanent: true,
			},
			{
				source: "/dashboard/:orgId",
				destination: "/:orgId",
				permanent: true,
			},
			{
				source: "/dashboard/:orgId/:path*",
				destination: "/:orgId/:path*",
				permanent: true,
			},
			// Model redirects
			{
				source: "/models/sherlock-dash-alpha",
				destination: "/models/grok-4-1-fast-non-reasoning",
				permanent: true,
			},
			{
				source: "/models/sherlock-think-alpha",
				destination: "/models/grok-4-1-fast-reasoning",
				permanent: true,
			},
			// External redirects
			{
				source: "/docs",
				destination: "https://docs.llmapi.ai",
				permanent: true,
			},
			{
				source: "/discord",
				destination: "https://discord.gg/3u7jpXf36B",
				permanent: true,
			},
			{
				source: "/github",
				destination: "https://github.com/Spendbase/llmgateway",
				permanent: true,
			},
			{
				source: "/twitter",
				destination: "https://twitter.com/llmgateway",
				permanent: true,
			},
			{
				source: "/x",
				destination: "https://x.com/llmgateway",
				permanent: true,
			},
		];
	},
	typescript: {
		ignoreBuildErrors: true,
	},
};

// withContentCollections must be the outermost plugin
export default withContentCollections(nextConfig);
