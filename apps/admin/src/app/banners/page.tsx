"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

import { Banner } from "@/components/banners/banner";
import { Card, CardContent } from "@/components/ui/card";
import { useApi } from "@/lib/fetch-client";

export default function BannersPage() {
	const api = useApi();
	const queryClient = useQueryClient();

	const { data, isLoading } = api.useQuery("get", "/admin/banners", undefined, {
		staleTime: 5 * 60 * 1000,
	});

	const { mutate, isPending } = api.useMutation(
		"patch",
		"/admin/banners/{id}",
		{
			onSuccess: () => {
				const queryKey = api.queryOptions("get", "/admin/banners").queryKey;
				if (queryKey) {
					queryClient.invalidateQueries({ queryKey });
				}
				toast.success("Banner updated");
			},
			onError: () => toast.error("Failed to update banner"),
		},
	);

	const handleToggle = (id: string, enabled: boolean) => {
		mutate({ params: { path: { id } }, body: { enabled } });
	};

	const banners = data?.banners ?? [];

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
			<div>
				<div className="flex items-center gap-2">
					<Megaphone className="h-6 w-6" />
					<h1 className="text-3xl font-semibold tracking-tight">Banners</h1>
				</div>
				<p className="mt-1 text-sm text-muted-foreground">
					Manage banner visibility across the platform
				</p>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground">Loading...</p>
			) : banners.length === 0 ? (
				<Card>
					<CardContent className="pt-6">
						<p className="text-center text-sm text-muted-foreground">
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
							onToggle={handleToggle}
							isPending={isPending}
						/>
					))}
				</div>
			)}
		</div>
	);
}
