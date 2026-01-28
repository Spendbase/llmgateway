import { Logo } from "@/components/logo";

import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		url: "/",
		title: (
			<>
				<Logo className="h-6 w-6" />
				LLM API
			</>
		),
	},
	links: [
		{
			text: "Dashboard",
			url: "https://llmapi.ai/dashboard",
			active: "none",
		},
	],
};
