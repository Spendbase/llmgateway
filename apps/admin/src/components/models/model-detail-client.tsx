"use client";

import { AlertCircle, CheckCircle2, Volume2 } from "lucide-react";

import { CustomBadge as Badge } from "@/components/ui/custom-badge";

import { isAudioModel } from "@llmgateway/models";

import { AudioModelDetail } from "./model-detail-audio";
import { TextModelDetail } from "./model-detail-text";

import type { Model } from "@/lib/models";

interface ModelDetailClientProps {
	model: Model;
}

export function ModelDetailClient({ model }: ModelDetailClientProps) {
	const audio = isAudioModel(model);
	const modelName = model.name || model.id;

	return (
		<>
			<header className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-semibold tracking-tight">{modelName}</h1>
					<p className="text-sm text-muted-foreground">{model.id}</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Badge variant="blue">{model.family}</Badge>
					{model.free && <Badge variant="success">Free</Badge>}
					{model.output?.includes("image") && (
						<Badge variant="purple">Image Output</Badge>
					)}
					{audio && (
						<Badge variant="purple">
							<Volume2 className="h-3 w-3" />
							Audio Output
						</Badge>
					)}
					<Badge variant={model.status === "active" ? "success" : "warning"}>
						{model.status === "active" ? (
							<CheckCircle2 className="h-3 w-3" />
						) : (
							<AlertCircle className="h-3 w-3" />
						)}
						{model.status}
					</Badge>
				</div>
			</header>

			{audio ? (
				<AudioModelDetail model={model} />
			) : (
				<TextModelDetail model={model} />
			)}
		</>
	);
}
