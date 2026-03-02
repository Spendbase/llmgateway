"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useAppConfig } from "@/lib/config";

export interface TtsGeneration {
	id: string;
	model: string;
	voice: string;
	format: string;
	text: string;
	chars: number | null;
	cost: number | null;
	createdAt: string;
	updatedAt: string;
}

interface TtsGenerationsPage {
	generations: TtsGeneration[];
	hasMore: boolean;
	nextCursor: string | null;
}

export const QUERY_KEY = ["tts-generations"] as const;
const PAGE_SIZE = 10;

export function useTtsGenerations() {
	const config = useAppConfig();

	return useInfiniteQuery({
		queryKey: QUERY_KEY,
		initialPageParam: null as string | null,
		queryFn: async ({ pageParam }): Promise<TtsGenerationsPage> => {
			const url = new URL(`${config.apiUrl}/tts-generations`);
			url.searchParams.set("limit", String(PAGE_SIZE));
			if (pageParam) {
				url.searchParams.set("cursor", pageParam);
			}
			const res = await fetch(url.toString(), { credentials: "include" });
			if (!res.ok) {
				throw new Error("Failed to fetch TTS generations");
			}
			return await (res.json() as Promise<TtsGenerationsPage>);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}

export function useDeleteTtsGeneration() {
	const queryClient = useQueryClient();
	const config = useAppConfig();

	return useMutation({
		mutationFn: async (id: string): Promise<void> => {
			const res = await fetch(`${config.apiUrl}/tts-generations/${id}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) {
				throw new Error("Failed to delete generation");
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
		onError: () => {
			toast.error("Failed to delete generation");
		},
	});
}
