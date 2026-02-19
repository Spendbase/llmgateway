"use client";

import { Megaphone } from "lucide-react";
import { toast } from "sonner";

import Banner from "@/components/banners/banner";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/lib/fetch-client";

export default function BannersPage() {
	const api = useApi();

	const { data: bannersData, isLoading } = api.useQuery(
		"get",
		"/admin/banners",
		undefined,
		{
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false,
		},
	);

	const { mutate: updateBanner } = api.useMutation(
		"patch",
		"/admin/banners/{id}",
	);

	const handleToggle = (bannerId: string, enabled: boolean) => {
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
				onSuccess: () => {
					toast.success("Banner Updated", {
						description: "Banner settings have been updated successfully.",
					});
				},
				onError: () => {
					toast.error("Error", {
						description: "Failed to update banner settings.",
					});
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
						<Banner
							key={banner.id}
							banner={banner}
							handleToggle={handleToggle}
						/>
					))}
				</div>
			)}
		</div>
	);
}
