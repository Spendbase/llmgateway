import { ImageResponse } from "next/og";

import Logo from "@/lib/icons/Logo";
import { formatContextSize } from "@/lib/utils";

import {
	models as modelDefinitions,
	providers as providerDefinitions,
	type ModelDefinition,
	type ProviderModelMapping,
} from "@llmgateway/models";
import { getProviderIcon } from "@llmgateway/shared/components";

const size = {
	width: 1200,
	height: 630,
};

function getEffectivePricePerMillion(
	mapping: ProviderModelMapping | undefined,
) {
	if (
		!mapping?.inputPrice &&
		!mapping?.outputPrice &&
		!mapping?.cachedInputPrice
	) {
		return null;
	}

	const applyDiscount = (price?: number | null) => {
		if (price === undefined || price === null) {
			return undefined;
		}
		const base = price * 1e6;
		if (!mapping?.discount) {
			return { original: base, discounted: base };
		}
		return {
			original: base,
			discounted: base * (1 - mapping.discount),
		};
	};

	return {
		input: applyDiscount(mapping.inputPrice),
		output: applyDiscount(mapping.outputPrice),
		cachedInput: applyDiscount(mapping.cachedInputPrice),
	};
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ name: string; provider: string }> },
) {
	try {
		const { name, provider } = await params;
		const decodedName = decodeURIComponent(name);
		const decodedProvider = decodeURIComponent(provider);

		const model = modelDefinitions.find((m) => m.id === decodedName) as
			| ModelDefinition
			| undefined;

		if (!model) {
			return new ImageResponse(
				(
					<div
						style={{
							width: "100%",
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: "#020817",
							color: "white",
							fontSize: 48,
							fontWeight: 700,
							fontFamily:
								"system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
						}}
					>
						Model not found
					</div>
				),
				size,
			);
		}

		const selectedMapping =
			model.providers.find((p) => p.providerId === decodedProvider) ||
			model.providers[0];
		const providerInfo = providerDefinitions.find(
			(p) => p.id === selectedMapping?.providerId,
		);
		const ProviderIcon = selectedMapping
			? getProviderIcon(selectedMapping.providerId)
			: null;
		const pricing = getEffectivePricePerMillion(selectedMapping);

		const contextSize = selectedMapping?.contextSize || 0;

		const uniqueProviderIds = Array.from(
			new Set(model.providers.map((p) => p.providerId)),
		);
		const supportingProviders = uniqueProviderIds
			.map((providerId) => {
				const icon = getProviderIcon(providerId);
				const info = providerDefinitions.find((p) => p.id === providerId);
				return {
					id: providerId,
					name: info?.name || providerId,
					Icon: icon,
				};
			})
			.filter((p) => !!p.Icon) as {
			id: string;
			name: string;
			Icon: React.FC<React.SVGProps<SVGSVGElement>>;
		}[];

		const formatDollars = (
			value?: {
				original: number;
				discounted: number;
			},
			discountMultiplier?: number,
		) => {
			if (!value) {
				return "—";
			}
			const original = `$${value.original.toFixed(2)}`;
			const discounted = `$${value.discounted.toFixed(2)}`;
			const hasDiscount =
				discountMultiplier !== undefined &&
				discountMultiplier > 0 &&
				discountMultiplier < 1 &&
				value.original !== value.discounted;

			if (hasDiscount) {
				const percentOff = Math.round(discountMultiplier * 100);
				return (
					<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
						<div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
							<span
								style={{
									textDecoration: "line-through",
									color: "#6B7280",
									fontSize: 28,
								}}
							>
								{original}
							</span>
							<span style={{ fontWeight: 700, fontSize: 42 }}>
								{discounted}
							</span>
						</div>
						<span
							style={{
								color: "#10B981",
								fontSize: 18,
								fontWeight: 600,
							}}
						>
							{percentOff}% off
						</span>
					</div>
				);
			}
			return <span style={{ fontWeight: 700, fontSize: 42 }}>{original}</span>;
		};

		return new ImageResponse(
			(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						background: "#000000",
						color: "white",
						fontFamily:
							"system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
						padding: 56,
						boxSizing: "border-box",
					}}
				>
					{/* Header */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "flex-start",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								gap: 20,
							}}
						>
							<div
								style={{
									width: 64,
									height: 64,
									borderRadius: 16,
									backgroundColor: "#111827",
									border: "2px solid rgba(148,163,184,0.3)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									overflow: "hidden",
								}}
							>
								{ProviderIcon ? (
									<ProviderIcon width={40} height={40} />
								) : (
									<span
										style={{
											fontSize: 28,
											fontWeight: 700,
										}}
									>
										{(
											providerInfo?.name ||
											selectedMapping?.providerId ||
											"LLM"
										)
											.charAt(0)
											.toUpperCase()}
									</span>
								)}
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 4,
								}}
							>
								<span
									style={{
										fontSize: 36,
										fontWeight: 700,
										letterSpacing: "-0.02em",
									}}
								>
									{model.name || model.id}
								</span>
								<div
									style={{
										display: "flex",
										flexDirection: "row",
										alignItems: "center",
										gap: 8,
										fontSize: 18,
										color: "#9CA3AF",
									}}
								>
									<span>
										{providerInfo?.name || selectedMapping?.providerId}
									</span>
									<span style={{ opacity: 0.5 }}>•</span>
									<span>{model.family} family</span>
								</div>
							</div>
						</div>

						{supportingProviders.length > 1 && (
							<div
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									gap: 8,
								}}
							>
								{supportingProviders.map(({ id, Icon }) => (
									<div
										key={id}
										style={{
											width: 36,
											height: 36,
											borderRadius: 10,
											backgroundColor: "#111827",
											border: "1px solid rgba(148,163,184,0.3)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											overflow: "hidden",
										}}
									>
										<Icon width={22} height={22} />
									</div>
								))}
							</div>
						)}
					</div>

					{/* Pricing Grid - Main Focus */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 24,
						}}
					>
						<span
							style={{
								color: "#6B7280",
								fontSize: 20,
								fontWeight: 500,
								textTransform: "uppercase",
								letterSpacing: "0.1em",
							}}
						>
							Pricing per 1M tokens
						</span>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								gap: 48,
							}}
						>
							{/* Context */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 8,
									padding: "24px 32px",
									backgroundColor: "#0A0A0A",
									borderRadius: 16,
									border: "1px solid #1F2937",
								}}
							>
								<span
									style={{
										color: "#9CA3AF",
										fontSize: 16,
										fontWeight: 500,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									Context
								</span>
								<span style={{ fontSize: 42, fontWeight: 700 }}>
									{contextSize ? formatContextSize(contextSize) : "—"}
								</span>
							</div>

							{/* Input */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 8,
									padding: "24px 32px",
									backgroundColor: "#0A0A0A",
									borderRadius: 16,
									border: "1px solid #1F2937",
								}}
							>
								<span
									style={{
										color: "#9CA3AF",
										fontSize: 16,
										fontWeight: 500,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									Input
								</span>
								{formatDollars(
									pricing?.input || undefined,
									selectedMapping?.discount,
								)}
							</div>

							{/* Output */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 8,
									padding: "24px 32px",
									backgroundColor: "#0A0A0A",
									borderRadius: 16,
									border: "1px solid #1F2937",
								}}
							>
								<span
									style={{
										color: "#9CA3AF",
										fontSize: 16,
										fontWeight: 500,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									Output
								</span>
								{formatDollars(
									pricing?.output || undefined,
									selectedMapping?.discount,
								)}
							</div>

							{/* Cached */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 8,
									padding: "24px 32px",
									backgroundColor: "#0A0A0A",
									borderRadius: 16,
									border: "1px solid #1F2937",
								}}
							>
								<span
									style={{
										color: "#9CA3AF",
										fontSize: 16,
										fontWeight: 500,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									Cache
								</span>
								{formatDollars(
									pricing?.cachedInput || undefined,
									selectedMapping?.discount,
								)}
							</div>
						</div>
					</div>

					{/* Footer */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								gap: 12,
							}}
						>
							<div
								style={{
									width: 32,
									height: 32,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "#ffffff",
								}}
							>
								<Logo style={{ width: 28, height: 28 }} />
							</div>
							<span
								style={{
									fontSize: 20,
									fontWeight: 600,
									color: "#E5E7EB",
								}}
							>
								LLM Gateway
							</span>
						</div>
						<span
							style={{
								fontSize: 18,
								color: "#6B7280",
							}}
						>
							llmgateway.io
						</span>
					</div>
				</div>
			),
			size,
		);
	} catch (error) {
		console.error("Error generating OpenGraph image:", error);
		return new ImageResponse(
			(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "#020817",
						color: "white",
						fontSize: 40,
						fontWeight: 700,
						fontFamily:
							"system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
					}}
				>
					LLM Gateway Model
				</div>
			),
			size,
		);
	}
}
