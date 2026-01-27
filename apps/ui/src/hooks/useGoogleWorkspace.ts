import { useState } from "react";
import { toast } from "sonner";

import { useApi } from "@/lib/fetch-client";

interface GoogleWorkspaceParams {
	organizationId: string;
}

export function useGoogleWorkspace({ organizationId }: GoogleWorkspaceParams) {
	const api = useApi();
	const [isLoading, setIsLoading] = useState(false);

	const initiateMutation = api.useMutation(
		"post",
		"/orgs/{organizationId}/google-workspace/initiate",
	);

	const fetchUsersMutation = api.useMutation(
		"post",
		"/orgs/{organizationId}/google-workspace/fetch-users",
	);

	const connect = async () => {
		setIsLoading(true);
		try {
			const initData = await initiateMutation.mutateAsync({
				params: { path: { organizationId } },
			});

			console.log(initData);

			if (!initData.url) {
				throw new Error("No URL returned");
			}

			const token = await openPopupAndWaitForToken(initData.url);

			const users = await fetchUsersMutation.mutateAsync({
				params: { path: { organizationId } },
				body: { accessToken: token },
			});

			toast.success("Users fetched successfully!");
			return users;
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	return {
		connect,
		isLoading,
		error: initiateMutation.error || fetchUsersMutation.error,
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
