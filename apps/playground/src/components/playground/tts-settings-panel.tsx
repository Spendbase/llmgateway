"use client";

import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { elevenlabsVoiceMapping } from "@llmgateway/models";

import type { ApiModel } from "@/lib/fetch-models";

const FORMATS = [
	{ id: "mp3", label: "MP3", ext: ".mp3", description: "Universal" },
	{ id: "opus", label: "Opus", ext: ".opus", description: "Streaming" },
	{ id: "wav", label: "WAV", ext: ".wav", description: "Lossless" },
	{ id: "flac", label: "FLAC", ext: ".flac", description: "Compressed" },
] as const;

const VOICE_DESCRIPTORS: Record<string, { style: string; gender: "M" | "F" }> =
	{
		alloy: { style: "Confident", gender: "F" },
		echo: { style: "Warm", gender: "M" },
		fable: { style: "Energetic", gender: "M" },
		onyx: { style: "Dominant", gender: "M" },
		nova: { style: "Quirky", gender: "F" },
		shimmer: { style: "Professional", gender: "F" },
	};

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
			{children}
		</Label>
	);
}

function Divider() {
	return <div className="h-px bg-border/60" />;
}

interface TtsSettingsPanelProps {
	audioModels: ApiModel[];
	model: string;
	voice: string;
	format: string;
	onModelChange: (value: string) => void;
	onVoiceChange: (value: string) => void;
	onFormatChange: (value: string) => void;
	disabled?: boolean;
}

export function TtsSettingsPanel({
	audioModels,
	model,
	voice,
	format,
	onModelChange,
	onVoiceChange,
	onFormatChange,
	disabled = false,
}: TtsSettingsPanelProps) {
	const selectedModel = audioModels.find((m) => m.id === model);
	const audioConfig = selectedModel?.mappings[0]?.audioConfig;

	return (
		<div className="space-y-4">
			{/* Model */}
			<div className="space-y-2.5">
				<SectionLabel>Model</SectionLabel>
				<Select value={model} onValueChange={onModelChange} disabled={disabled}>
					<SelectTrigger className="w-full h-auto! py-2 cursor-pointer hover:bg-accent **:data-[slot=select-value]:flex-col **:data-[slot=select-value]:items-start **:data-[slot=select-value]:gap-0 **:data-[slot=select-value]:w-full **:data-[slot=select-value]:text-left">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{audioModels.map((m) => {
							const config = m.mappings[0]?.audioConfig;
							return (
								<SelectItem key={m.id} value={m.id}>
									<div className="flex flex-col gap-0.5 py-0.5">
										<span className="font-medium text-sm">
											{m.name ?? m.id}
										</span>
										{config && (
											<span className="text-xs text-muted-foreground">
												{config.latencyMs !== null &&
												config.latencyMs !== undefined
													? `${config.latencyMs}ms · `
													: ""}
												${(config.characterPrice * 1000).toFixed(2)}/1K
											</span>
										)}
									</div>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>

				{/* Stat strip */}
				{audioConfig && (
					<TooltipProvider delayDuration={200}>
						<div className="flex items-center gap-0 rounded-lg border divide-x overflow-hidden text-xs">
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex-1 px-2.5 py-2 text-center cursor-default">
										<div className="text-[10px] text-muted-foreground leading-none mb-1">
											Chars
										</div>
										<div className="font-semibold tabular-nums">
											{(audioConfig.maxCharacters / 1000).toFixed(0)}K
										</div>
									</div>
								</TooltipTrigger>
								<TooltipContent>Maximum characters per request</TooltipContent>
							</Tooltip>

							{audioConfig.latencyMs !== null &&
								audioConfig.latencyMs !== undefined && (
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex-1 px-2.5 py-2 text-center cursor-default">
												<div className="text-[10px] text-muted-foreground leading-none mb-1">
													Latency
												</div>
												<div className="font-semibold tabular-nums">
													{audioConfig.latencyMs}ms
												</div>
											</div>
										</TooltipTrigger>
										<TooltipContent>
											Approximate time to first audio byte
										</TooltipContent>
									</Tooltip>
								)}

							{audioConfig.languages !== null &&
								audioConfig.languages !== undefined && (
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex-1 px-2.5 py-2 text-center cursor-default">
												<div className="text-[10px] text-muted-foreground leading-none mb-1">
													Langs
												</div>
												<div className="font-semibold tabular-nums">
													{audioConfig.languages}+
												</div>
											</div>
										</TooltipTrigger>
										<TooltipContent>Supported languages</TooltipContent>
									</Tooltip>
								)}

							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex-1 px-2.5 py-2 text-center cursor-default">
										<div className="text-[10px] text-muted-foreground leading-none mb-1">
											Price
										</div>
										<div className="font-semibold tabular-nums">
											${(audioConfig.characterPrice * 1000).toFixed(2)}
										</div>
									</div>
								</TooltipTrigger>
								<TooltipContent>Cost per 1,000 characters</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
				)}
			</div>

			<Divider />

			{/* Voice */}
			<div className="space-y-2.5">
				<SectionLabel>Voice</SectionLabel>
				<div className="grid grid-cols-2 gap-1.5">
					{elevenlabsVoiceMapping.map((v) => {
						const descriptor = VOICE_DESCRIPTORS[v.openaiName];
						const isSelected = voice === v.openaiName;
						return (
							<button
								key={v.openaiName}
								type="button"
								disabled={disabled}
								onClick={() => onVoiceChange(v.openaiName)}
								className={cn(
									"relative rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer",
									"hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
									isSelected
										? "border-primary bg-primary/5"
										: "border-border bg-background hover:bg-muted/30",
								)}
							>
								{/* Checkmark */}
								{isSelected && (
									<span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
										<Check className="h-2.5 w-2.5 text-primary-foreground" />
									</span>
								)}
								<div className="flex items-center gap-2 mb-0.5">
									{/* Gender dot */}
									<span
										className={cn(
											"h-1.5 w-1.5 rounded-full shrink-0",
											descriptor?.gender === "F"
												? "bg-violet-400"
												: "bg-sky-400",
										)}
									/>
									<span className="text-sm font-semibold leading-tight">
										{v.displayName}
									</span>
								</div>
								<div className="text-xs text-muted-foreground pl-3.5">
									{descriptor?.style ?? v.openaiName}
								</div>
							</button>
						);
					})}
				</div>
			</div>

			<Divider />

			{/* Format */}
			<div className="space-y-2.5">
				<SectionLabel>Output Format</SectionLabel>
				<div className="grid grid-cols-2 gap-1.5">
					{FORMATS.map((f) => {
						const isSelected = format === f.id;
						return (
							<button
								key={f.id}
								type="button"
								disabled={disabled}
								onClick={() => onFormatChange(f.id)}
								className={cn(
									"relative rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer",
									"hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
									isSelected
										? "border-primary bg-primary/5"
										: "border-border bg-background hover:bg-muted/30",
								)}
							>
								{isSelected && (
									<span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
										<Check className="h-2.5 w-2.5 text-primary-foreground" />
									</span>
								)}
								<div className="text-sm font-semibold">{f.label}</div>
								<div className="text-xs text-muted-foreground leading-tight">
									{f.description}
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
