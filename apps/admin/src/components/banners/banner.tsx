"use client";

import { Label } from "@radix-ui/react-label";

import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export interface BannerData {
	id: string;
	name: string;
	description: string | null;
	enabled: boolean;
	type: string;
	priority: number;
}

interface BannerProps {
	banner: BannerData;
	onToggle: (bannerId: string, enabled: boolean) => void;
	isPending: boolean;
}

export const Banner = ({ banner, onToggle, isPending }: BannerProps) => (
	<Card>
		<CardHeader>
			<CardTitle>{banner.name}</CardTitle>
			{banner.description && (
				<CardDescription>{banner.description}</CardDescription>
			)}
		</CardHeader>
		<CardContent className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor={`banner-${banner.id}`} className="text-base">
						Show Banner
					</Label>
					<p className="text-sm text-muted-foreground">
						Enable or disable this banner across the platform
					</p>
				</div>
				<Switch
					id={`banner-${banner.id}`}
					checked={banner.enabled}
					disabled={isPending}
					onCheckedChange={(checked) => onToggle(banner.id, checked)}
				/>
			</div>

			<div className="rounded-lg border bg-muted/50 p-4">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Type:</span>{" "}
						<span className="font-medium">{banner.type}</span>
					</div>
					<div>
						<span className="text-muted-foreground">Priority:</span>{" "}
						<span className="font-medium">{banner.priority}</span>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
);
