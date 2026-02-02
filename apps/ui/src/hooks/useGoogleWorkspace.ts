import { useState } from "react";

import { useApi } from "@/lib/fetch-client";

import type { GoogleUser, GoogleUserRole } from "@/types/google-workspace";

interface GoogleWorkspaceParams {
	organizationId: string;
}

export function useGoogleWorkspace({ organizationId }: GoogleWorkspaceParams) {
	const api = useApi();
	const [isLoading, setIsLoading] = useState(false);

	const initiateMutation = api.useMutation(
		"post",
		"/orgs/{id}/google-workspace/initiate",
	);

	const fetchUsersMutation = api.useMutation(
		"post",
		"/orgs/{id}/google-workspace/fetch-users",
	);

	const importUsersMutation = api.useMutation(
		"post",
		"/orgs/{id}/google-workspace/import",
	);

	const initiateGoogleWorkspace = async () => {
		setIsLoading(true);
		try {
			const initData = await initiateMutation.mutateAsync({
				params: { path: { id: organizationId } },
			});

			return await openPopupAndWaitForToken(initData.url);
		} catch (error: any) {
			return error;
		} finally {
			setIsLoading(false);
		}
	};

	const fetchGoogleWorkspaceUsers = async (token: string) => {
		return await fetchUsersMutation.mutateAsync({
			params: { path: { id: organizationId } },
			body: { accessToken: token },
		});
	};

	const importGoogleWorkspaceUsers = async (
		users: GoogleUser[],
		role: GoogleUserRole,
	) => {
		return await importUsersMutation.mutateAsync({
			params: { path: { id: organizationId } },
			body: { users, role },
		});
	};

	return {
		initiateGoogleWorkspace,
		fetchGoogleWorkspaceUsers,
		importGoogleWorkspaceUsers,
		isLoading,
	};
}

function openPopupAndWaitForToken(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const width = 500;
		const height = 600;
		const left = window.screen.width / 2 - width / 2;
		const top = window.screen.height / 2 - height / 2;

		const popup = window.open(
			url,
			"GoogleWorkspace",
			`width=${width},height=${height},top=${top},left=${left}`,
		);

		if (!popup) {
			reject(new Error("Popup blocked by browser"));
			return;
		}

		let isResolved = false;

		const handler = (event: MessageEvent) => {
			if (event.data?.type === "GOOGLE_WORKSPACE_SUCCESS") {
				cleanup();
				resolve(event.data.token);
			} else if (event.data?.type === "GOOGLE_WORKSPACE_ERROR") {
				cleanup();
				reject(new Error(event.data.error));
			}
		};

		const timer = setInterval(() => {
			if (popup.closed) {
				cleanup();
				if (!isResolved) {
					reject(new Error("Connection cancelled by user"));
				}
			}
		}, 1000);

		const cleanup = () => {
			isResolved = true;
			window.removeEventListener("message", handler);
			clearInterval(timer);
			if (!popup.closed) {
				popup.close();
			}
		};

		window.addEventListener("message", handler);
	});
}
