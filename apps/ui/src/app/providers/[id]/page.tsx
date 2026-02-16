import { notFound } from "next/navigation";

import Footer from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/providers/hero";
import { ProviderModelsGrid } from "@/components/providers/provider-models-grid";
import { fetchModels } from "@/lib/fetch-models";

import {
	providers as providerDefinitions,
	type ProviderId,
} from "@llmgateway/models";

import type { ApiModel } from "@/lib/fetch-models";
import type { Metadata } from "next";

interface ProviderPageProps {
	params: Promise<{ id: string }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
	const { id } = await params;

	// Fetch all models from API
	const apiModels = await fetchModels();

	// Filter models that have mappings for this provider
	const providerModels = apiModels
		.filter((model) => model.mappings.some((m) => m.providerId === id))
		.map((model): ApiModel & { providerDetails: typeof model.mappings } => ({
			...model,
			providerDetails: model.mappings.filter((m) => m.providerId === id),
		}));

	if (providerModels.length === 0) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<Navbar />
				<Hero providerId={id as ProviderId} />

				<section className="py-12 bg-background">
					<div className="container mx-auto px-4">
						<h2 className="text-3xl font-bold mb-8">Available Models</h2>
						<ProviderModelsGrid models={providerModels} />
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}

export async function generateStaticParams() {
	return providerDefinitions.map((provider) => ({
		id: provider.id,
	}));
}

export async function generateMetadata({
	params,
}: ProviderPageProps): Promise<Metadata> {
	const { id } = await params;

	const provider = providerDefinitions.find((p) => p.id === id);

	if (!provider) {
		return {};
	}

	return {
		title: `${provider.name} - LLM API`,
		description: `Learn about ${provider.name} integration with LLM API. Access ${provider.name} models through our unified API.`,
		openGraph: {
			title: `${provider.name} - LLM API`,
			description: `Learn about ${provider.name} integration with LLM API. Access ${provider.name} models through our unified API.`,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: `${provider.name} - LLM API`,
			description: `Learn about ${provider.name} integration with LLM API.`,
		},
	};
}
