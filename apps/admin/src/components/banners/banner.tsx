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

import { DeleteBannerButton } from "./delete-banner-dialog";

export interface BannerData {
	id: string;
	name: string;
	description: string | null;
	enabled: boolean;
}

interface BannerProps {
	banner: BannerData;
	onToggle: (bannerId: string, enabled: boolean) => void;
	isPending: boolean;
}

export const Banner = ({ banner, onToggle, isPending }: BannerProps) => {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>{banner.name}</CardTitle>
						{banner.description && (
							<CardDescription>{banner.description}</CardDescription>
						)}
					</div>

					<DeleteBannerButton bannerId={banner.id} />
				</div>
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
			</CardContent>
		</Card>
	);
};
