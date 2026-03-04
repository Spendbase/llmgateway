"use client";

import { useEffect, useRef } from "react";

import type { Organization, Project } from "@/lib/types";

interface Params {
	isAuthenticated: boolean;
	selectedOrganization: Organization | null;
	selectedProject: Project | null;
}

export function useEnsurePlaygroundKey({
	isAuthenticated,
	selectedOrganization,
	selectedProject,
}: Params): void {
	const ensuredProjectRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isAuthenticated || !selectedProject || !selectedOrganization) {
			ensuredProjectRef.current = null;
			return;
		}
		if (ensuredProjectRef.current === selectedProject.id) {
			return;
		}

		const controller = new AbortController();
		const projectId = selectedProject.id;

		fetch("/api/ensure-playground-key", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ projectId }),
			signal: controller.signal,
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error(`ensure-playground-key failed: ${res.status}`);
				}
				if (ensuredProjectRef.current !== projectId) {
					ensuredProjectRef.current = projectId;
				}
			})
			.catch((err) => {
				if (err instanceof Error && err.name !== "AbortError") {
					console.error("[useEnsurePlaygroundKey]", err);
				}
			});

		return () => {
			controller.abort();
		};
	}, [isAuthenticated, selectedOrganization, selectedProject]);
}
