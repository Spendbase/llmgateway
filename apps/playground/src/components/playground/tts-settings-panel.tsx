"use client";

import { Check, Info } from "lucide-react";

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
	{
		id: "mp3",
		label: "MP3",
		description: "Compatible",
		tooltip:
			"Works everywhere. Good quality, small file size. Best default choice.",
	},
	{
		id: "opus",
		label: "Opus",
		description: "Compact",
		tooltip:
			"Better quality than MP3 at the same bitrate. Supported in all modern browsers.",
	},
	// {
	// 	id: "wav",
	// 	label: "WAV",
	// 	description: "Lossless",
	// 	tooltip: "No audio compression — largest file size.",
	// },
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
	speed: number;
	onModelChange: (value: string) => void;
	onVoiceChange: (value: string) => void;
	onFormatChange: (value: string) => void;
	onSpeedChange: (value: number) => void;
	disabled?: boolean;
}

export function TtsSettingsPanel({
	audioModels,
	model,
	voice,
	format,
	speed,
	onModelChange,
	onVoiceChange,
	onFormatChange,
	onSpeedChange,
	disabled = false,
}: TtsSettingsPanelProps) {
	const selectedModel = audioModels.find((m) => m.id === model);
	const audioConfig = selectedModel?.mappings[0]?.audioConfig;
	const speedDisabled = disabled || model === "eleven_v3";

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
				<TooltipProvider delayDuration={200}>
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
									<div className="flex items-center gap-1 mb-0.5">
										<span className="text-sm font-semibold">{f.label}</span>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info
													className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground shrink-0"
													onClick={(e) => e.stopPropagation()}
												/>
											</TooltipTrigger>
											<TooltipContent side="top" className="max-w-48">
												{f.tooltip}
											</TooltipContent>
										</Tooltip>
									</div>
									<div className="text-xs text-muted-foreground leading-tight">
										{f.description}
									</div>
								</button>
							);
						})}
					</div>
				</TooltipProvider>
			</div>
			<Divider />

			{/* Speed */}
			<div className={cn("space-y-2.5", speedDisabled && "opacity-50")}>
				<div className="flex items-center justify-between">
					<SectionLabel>Speed</SectionLabel>
					{model === "eleven_v3" ? (
						<span className="text-[10px] text-muted-foreground">
							Not supported by v3
						</span>
					) : (
						<span className="text-xs tabular-nums font-medium text-foreground/70">
							{speed.toFixed(2)}×
						</span>
					)}
				</div>

				{/* Presets */}
				<div className="grid grid-cols-4 gap-1">
					{([0.75, 1.0, 1.1, 1.2] as const).map((preset) => {
						const isSelected = Math.abs(speed - preset) < 0.01;
						return (
							<button
								key={preset}
								type="button"
								disabled={speedDisabled}
								onClick={() => onSpeedChange(preset)}
								className={cn(
									"rounded-md border py-1 text-center text-[11px] tabular-nums font-medium transition-all cursor-pointer",
									"hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
									isSelected
										? "border-primary bg-primary/5 text-primary"
										: "border-border bg-background text-muted-foreground hover:bg-muted/30 hover:text-foreground",
								)}
							>
								{preset}×
							</button>
						);
					})}
				</div>

				{/* Slider */}
				<div className="relative flex items-center h-5 mb-4">
					{/* Track background */}
					<div className="absolute inset-x-0 h-1 rounded-full bg-muted pointer-events-none">
						<div
							className="h-full rounded-full bg-primary transition-all duration-75"
							style={{ width: `${((speed - 0.7) / (1.2 - 0.7)) * 100}%` }}
						/>
					</div>
					<input
						type="range"
						min={0.7}
						max={1.2}
						step={0.05}
						value={speed}
						disabled={speedDisabled}
						onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
						className={cn(
							"relative w-full appearance-none bg-transparent outline-none cursor-pointer",
							"disabled:cursor-not-allowed disabled:opacity-50",
							// thumb — webkit
							"[&::-webkit-slider-thumb]:appearance-none",
							"[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
							"[&::-webkit-slider-thumb]:rounded-full",
							"[&::-webkit-slider-thumb]:bg-primary",
							"[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background",
							"[&::-webkit-slider-thumb]:shadow-sm",
							"[&::-webkit-slider-thumb]:transition-[box-shadow,transform]",
							"[&::-webkit-slider-thumb]:duration-150",
							"[&::-webkit-slider-thumb]:cursor-pointer",
							"hover:[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]",
							"active:[&::-webkit-slider-thumb]:scale-110",
							"active:[&::-webkit-slider-thumb]:shadow-[0_0_0_6px_hsl(var(--primary)/0.15)]",
							// thumb — firefox
							"[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
							"[&::-moz-range-thumb]:rounded-full",
							"[&::-moz-range-thumb]:bg-primary",
							"[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background",
							"[&::-moz-range-thumb]:cursor-pointer",
							// track — transparent so our custom div shows through
							"[&::-webkit-slider-runnable-track]:bg-transparent",
							"[&::-moz-range-track]:bg-transparent",
						)}
					/>
				</div>
			</div>
		</div>
	);
}
