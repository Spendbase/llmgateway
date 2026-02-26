import {
	AlertTriangle,
	ArrowLeft,
	Play,
	Zap,
	Eye,
	Wrench,
	MessageSquare,
	ImagePlus,
	Braces,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/landing/navbar";
import { CopyModelName } from "@/components/models/copy-model-name";
import { ModelProviderCard } from "@/components/models/model-provider-card";
import { ProviderTabs } from "@/components/models/provider-tabs";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { getConfig } from "@/lib/config-server";
import { fetchModels } from "@/lib/fetch-models";
import { isAudioModel } from "@/lib/model-utils";

import {
	models as modelDefinitions,
	type StabilityLevel,
} from "@llmgateway/models";

import type { Metadata } from "next";

interface PageProps {
	params: Promise<{ name: string; provider: string }>;
}

export default async function ModelProviderPage({ params }: PageProps) {
	const config = getConfig();
	const { name, provider } = await params;
	const decodedName = decodeURIComponent(name);
	const decodedProvider = decodeURIComponent(provider);

	// Fetch from API instead of static definitions
	const apiModels = await fetchModels();
	const apiModel = apiModels.find((m) => m.id === decodedName);

	if (!apiModel) {
		notFound();
	}

	const providerMapping = apiModel.mappings.find(
		(m) => m.providerId === decodedProvider,
	);

	if (!providerMapping) {
		notFound();
	}

	const getStabilityBadgeProps = (stability?: StabilityLevel) => {
		switch (stability) {
			case "beta":
				return {
					variant: "secondary" as const,
					color: "text-blue-600",
					label: "BETA",
				};
			case "unstable":
				return {
					variant: "destructive" as const,
					color: "text-red-600",
					label: "UNSTABLE",
				};
			case "experimental":
				return {
					variant: "destructive" as const,
					color: "text-orange-600",
					label: "EXPERIMENTAL",
				};
			default:
				return null;
		}
	};

	const shouldShowStabilityWarning = (stability?: StabilityLevel) => {
		return stability && ["unstable", "experimental"].includes(stability);
	};

	const allProviderIds = apiModel.mappings.map((p) => p.providerId);
	const modelStability = providerMapping.stability ?? apiModel.stability;

	return (
		<>
			<Navbar />
			<div className="min-h-screen bg-background pt-24 md:pt-32 pb-16">
				<div className="container mx-auto px-4 py-8">
					<div className="mb-6">
						<Link
							href={`/models/${encodeURIComponent(decodedName)}`}
							className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to {apiModel.name ?? decodedName}
						</Link>
					</div>
					<div className="mb-8">
						<div className="flex items-center gap-3 mb-2 flex-wrap">
							<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
								{apiModel.name ?? decodedName}
							</h1>
							{shouldShowStabilityWarning(modelStability) && (
								<AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
							)}
						</div>
						{apiModel.description && (
							<p className="text-muted-foreground mb-4">
								{apiModel.description}
							</p>
						)}
						<div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
							<CopyModelName modelName={decodedName} />
							{(() => {
								const stabilityProps = getStabilityBadgeProps(modelStability);
								return stabilityProps ? (
									<Badge
										variant={stabilityProps.variant}
										className="text-xs md:text-sm px-2 md:px-3 py-1"
									>
										{stabilityProps.label}
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-xs md:text-sm px-2 md:px-3 py-1"
									>
										STABLE
									</Badge>
								);
							})()}

							<a
								href={`${config.playgroundUrl}?model=${encodeURIComponent(`${decodedProvider}/${apiModel.id}`)}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button variant="outline" size="sm" className="gap-2">
									<Play className="h-3 w-3" />
									Try in Playground
								</Button>
							</a>
						</div>

						{/* Capabilities */}
						<div className="flex flex-wrap items-center gap-4 mb-6">
							{(() => {
								const items: Array<{
									key: string;
									icon: typeof Zap;
									label: string;
									color: string;
								}> = [];

								if (providerMapping.streaming) {
									items.push({
										key: "streaming",
										icon: Zap,
										label: "Streaming",
										color: "text-blue-500",
									});
								}
								if (providerMapping.vision) {
									items.push({
										key: "vision",
										icon: Eye,
										label: "Vision",
										color: "text-green-500",
									});
								}
								if (providerMapping.tools) {
									items.push({
										key: "tools",
										icon: Wrench,
										label: "Tools",
										color: "text-purple-500",
									});
								}
								if (providerMapping.reasoning) {
									items.push({
										key: "reasoning",
										icon: MessageSquare,
										label: "Reasoning",
										color: "text-orange-500",
									});
								}
								if (providerMapping.jsonOutput) {
									items.push({
										key: "jsonOutput",
										icon: Braces,
										label: "JSON Output",
										color: "text-cyan-500",
									});
								}
								const hasImageGen =
									apiModel.output && Array.isArray(apiModel.output)
										? apiModel.output.includes("image")
										: false;
								if (hasImageGen) {
									items.push({
										key: "image",
										icon: ImagePlus,
										label: "Image Generation",
										color: "text-pink-500",
									});
								}

								return items.map(({ key, icon: Icon, label, color }) => (
									<div
										key={key}
										className="inline-flex items-center gap-2 text-sm text-foreground"
									>
										<Icon className={`h-4 w-4 ${color}`} />
										<span className="text-muted-foreground">{label}</span>
									</div>
								));
							})()}
						</div>
					</div>

					<div className="mb-8">
						<h2 className="text-xl md:text-2xl font-semibold mb-4">
							Select Provider
						</h2>
						<ProviderTabs
							modelId={decodedName}
							providerIds={allProviderIds}
							activeProviderId={decodedProvider}
						/>
					</div>

					<div className="mb-8">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
							<div>
								<h2 className="text-xl md:text-2xl font-semibold mb-2">
									{providerMapping.providerInfo?.name ?? decodedProvider}{" "}
									Pricing for {apiModel.name ?? decodedName}
								</h2>
								<p className="text-muted-foreground">
									View detailed pricing and capabilities for this provider.
								</p>
							</div>
						</div>

						<div className="max-w-md">
							<ModelProviderCard
								provider={providerMapping}
								modelName={decodedName}
								modelStability={modelStability}
								isAudio={isAudioModel(apiModel)}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export async function generateStaticParams() {
	const params: { name: string; provider: string }[] = [];

	for (const model of modelDefinitions) {
		const uniqueProviders = Array.from(
			new Set(model.providers.map((p) => p.providerId)),
		);
		for (const providerId of uniqueProviders) {
			params.push({
				name: encodeURIComponent(model.id),
				provider: encodeURIComponent(providerId),
			});
		}
	}

	return params;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { name, provider } = await params;
	const decodedName = decodeURIComponent(name);
	const decodedProvider = decodeURIComponent(provider);

	const apiModels = await fetchModels();
	const model = apiModels.find((m) => m.id === decodedName);

	if (!model) {
		return {};
	}

	const providerMapping = model.mappings.find(
		(m) => m.providerId === decodedProvider,
	);

	if (!providerMapping?.providerInfo) {
		return {};
	}

	const providerName = providerMapping.providerInfo.name || decodedProvider;

	const title = `${model.name || model.id} on ${providerName} – LLM API`;
	const description = `Pricing and capabilities for ${model.name || model.id} via ${providerName} on LLM API.`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
	};
}
