import {
	Braces,
	Eye,
	FileJson2,
	Globe,
	ImagePlus,
	MessageSquare,
	Volume2,
	Wrench,
	Zap,
} from "lucide-react";

import type { ApiModel, ApiModelProviderMapping } from "@/lib/fetch-models";
import type { StabilityLevel } from "@llmgateway/models";
import type { LucideProps } from "lucide-react";
import type {
	ForwardRefExoticComponent,
	ReactElement,
	RefAttributes,
} from "react";

export function getStabilityBadgeProps(stability?: StabilityLevel | null) {
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
}

export function shouldShowStabilityWarning(
	stability?: StabilityLevel | null,
): boolean {
	return (
		stability !== null &&
		stability !== undefined &&
		["unstable", "experimental"].includes(stability)
	);
}

export function hasProviderStabilityWarning(
	provider: ApiModelProviderMapping,
): boolean {
	const s = provider.stability;
	return (
		s !== null && s !== undefined && ["unstable", "experimental"].includes(s)
	);
}

export function formatPrice(
	price?: number,
	discount?: number,
): string | ReactElement {
	if (price === undefined) {
		return "—";
	}
	const originalPrice = (price * 1e6).toFixed(2);
	const discountNum = discount ?? 0;
	if (discountNum > 0) {
		const discountedPrice = (price * 1e6 * (1 - discountNum)).toFixed(2);
		return (
			<div className="flex flex-col justify-items-center">
				<div className="flex items-center gap-1">
					<span className="line-through text-muted-foreground text-xs">
						${originalPrice}
					</span>
					<span className="text-green-600 font-semibold">
						${discountedPrice}
					</span>
				</div>
			</div>
		);
	}
	return `$${originalPrice}`;
}

type LucideIcon = ForwardRefExoticComponent<
	Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

export function getCapabilityIcons(
	provider: ApiModelProviderMapping,
	model?: ApiModel,
): { icon: LucideIcon; label: string; color: string }[] {
	const capabilities: { icon: LucideIcon; label: string; color: string }[] = [];

	if (provider.streaming) {
		capabilities.push({
			icon: Zap,
			label: "Streaming",
			color: "text-blue-500",
		});
	}
	if (provider.vision) {
		capabilities.push({ icon: Eye, label: "Vision", color: "text-green-500" });
	}
	if (provider.tools) {
		capabilities.push({
			icon: Wrench,
			label: "Tools",
			color: "text-purple-500",
		});
	}
	if (provider.reasoning) {
		capabilities.push({
			icon: MessageSquare,
			label: "Reasoning",
			color: "text-orange-500",
		});
	}
	if (provider.jsonOutput) {
		capabilities.push({
			icon: Braces,
			label: "JSON Output",
			color: "text-cyan-500",
		});
	}
	if (provider.jsonOutputSchema) {
		capabilities.push({
			icon: FileJson2,
			label: "Structured JSON Output",
			color: "text-teal-500",
		});
	}
	if (model?.output?.includes("image")) {
		capabilities.push({
			icon: ImagePlus,
			label: "Image Generation",
			color: "text-pink-500",
		});
	}
	if (provider.webSearch) {
		capabilities.push({
			icon: Globe,
			label: "Native Web Search",
			color: "text-sky-500",
		});
	}
	if (model?.output?.includes("audio")) {
		capabilities.push({
			icon: Volume2,
			label: "Text-to-Speech",
			color: "text-violet-500",
		});
	}

	return capabilities;
}
