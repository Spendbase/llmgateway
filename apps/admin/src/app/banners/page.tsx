"use client";

import { Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/lib/fetch-client";

export default function BannersPage() {
	const api = useApi();
	const [savingId, setSavingId] = useState<string | null>(null);

	const {
		data: bannersData,
		isLoading,
		refetch,
	} = api.useQuery("get", "/admin/banners", undefined, {
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const { mutate: updateBanner } = api.useMutation(
		"patch",
		"/admin/banners/{id}",
	);

	const handleToggle = (bannerId: string, enabled: boolean) => {
		setSavingId(bannerId);
		updateBanner(
			{
				params: {
					path: { id: bannerId },
				},
				body: {
					enabled,
				},
			},
			{
				onSuccess: async () => {
					await refetch();
					toast.success("Banner Updated", {
						description: "Banner settings have been updated successfully.",
					});
					setSavingId(null);
				},
				onError: () => {
					toast.error("Error", {
						description: "Failed to update banner settings.",
					});
					setSavingId(null);
				},
			},
		);
	};

	if (isLoading) {
		return (
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
				<div className="flex items-center gap-2">
					<Megaphone className="h-6 w-6" />
					<h1 className="text-3xl font-semibold tracking-tight">Banners</h1>
				</div>
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const banners = bannersData?.banners || [];

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
			<div className="flex items-center gap-2">
				<Megaphone className="h-6 w-6" />
				<h1 className="text-3xl font-semibold tracking-tight">Banners</h1>
			</div>
			<p className="text-sm text-muted-foreground">
				Manage banner visibility across the platform
			</p>

			{banners.length === 0 ? (
				<Card>
					<CardContent className="pt-6">
						<p className="text-sm text-muted-foreground text-center">
							No banners found. Banners will be created automatically when
							needed.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{banners.map((banner) => (
						<Card key={banner.id}>
							<CardHeader>
								<CardTitle>{banner.name}</CardTitle>
								{banner.description && (
									<CardDescription>{banner.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label
											htmlFor={`banner-${banner.id}`}
											className="text-base"
										>
											Show Banner
										</Label>
										<p className="text-sm text-muted-foreground">
											Enable or disable this banner across the platform
										</p>
									</div>
									<Switch
										id={`banner-${banner.id}`}
										checked={banner.enabled}
										onCheckedChange={(checked) =>
											handleToggle(banner.id, checked)
										}
										disabled={savingId === banner.id}
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
					))}
				</div>
			)}
		</div>
	);
}
