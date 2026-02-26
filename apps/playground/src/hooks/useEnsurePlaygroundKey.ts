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

		fetch("/api/ensure-playground-key", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ projectId: selectedProject.id }),
		})
			.then(() => {
				ensuredProjectRef.current = selectedProject.id;
			})
			.catch(() => {});
	}, [isAuthenticated, selectedOrganization, selectedProject]);
}
