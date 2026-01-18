import { IntegrationCards } from "@/components/integrations/integration-cards";
import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";

export const metadata = {
	title: "Guides | LLM API",
	description:
		"Step-by-step guides for integrating LLM API with Claude Code, Cursor, Cline, n8n, and more.",
	openGraph: {
		title: "Guides | LLM API",
		description:
			"Step-by-step guides for integrating LLM API with Claude Code, Cursor, Cline, n8n, and more.",
	},
};

export default function GuidesPage() {
	return (
		<div>
			<Hero navbarOnly>{null}</Hero>
			<section className="py-20 sm:py-28">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center mb-16">
						<h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
							Guides
						</h1>
						<p className="text-lg text-muted-foreground leading-relaxed">
							Step-by-step tutorials to help you integrate LLM API with your
							favorite development tools and workflows.
						</p>
					</div>
					<IntegrationCards />
				</div>
			</section>
			<Footer />
		</div>
	);
}
