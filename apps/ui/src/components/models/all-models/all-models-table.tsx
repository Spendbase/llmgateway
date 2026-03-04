"use client";

import { Volume2 } from "lucide-react";

import { isAudioModel } from "@/lib/model-utils";

import { ModelsAudioTable } from "./all-models-table-audio";
import { ModelsTextTable } from "./all-models-table-text";

import type { SortField, ModelWithProviders } from "./all-models-types";

interface ModelsTableViewProps {
	models: ModelWithProviders[];
	handleSort: (field: SortField) => void;
	getSortIcon: (field: SortField) => React.ReactElement;
	copiedModel: string | null;
	copyToClipboard: (text: string) => Promise<void>;
	playgroundUrl: string;
	onNavigate: (modelId: string) => void;
}

export function ModelsTableView({
	models,
	handleSort,
	getSortIcon,
	copiedModel,
	copyToClipboard,
	playgroundUrl,
	onNavigate,
}: ModelsTableViewProps) {
	const textModels = models.filter((m) => !isAudioModel(m));
	const audioModels = models.filter(isAudioModel);

	const sharedProps = {
		handleSort,
		getSortIcon,
		copiedModel,
		copyToClipboard,
		onNavigate,
	};

	return (
		<div className="space-y-6">
			{textModels.length > 0 && (
				<ModelsTextTable
					models={textModels}
					playgroundUrl={playgroundUrl}
					{...sharedProps}
				/>
			)}

			{audioModels.length > 0 && (
				<div className="space-y-2">
					{textModels.length > 0 && (
						<div className="flex items-center gap-2 px-1">
							<Volume2 className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium text-muted-foreground">
								Audio Models
							</span>
						</div>
					)}
					<ModelsAudioTable models={audioModels} {...sharedProps} />
				</div>
			)}
		</div>
	);
}
