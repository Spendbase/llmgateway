"use client";

import { AlertCircle, Building2, Loader2, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { FaGoogle } from "react-icons/fa";

import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import { toast } from "@/lib/components/use-toast";

const ERROR_MESSAGES: Record<string, string> = {
	corporate_only:
		"Only corporate email addresses are allowed. Personal email providers like Gmail, Yahoo, and Outlook are not permitted. Please sign in with your work email.",
};
const corporateAuthFlowCookieName = "llmapi_corporate_auth_flow";

function CorporateLoginContent() {
	const searchParams = useSearchParams();
	const posthog = usePostHog();
	const [isLoading, setIsLoading] = useState(false);
	const { signIn } = useAuth();

	const errorParam = searchParams.get("error");
	const errorMessage = useMemo(
		() => (errorParam ? ERROR_MESSAGES[errorParam] : null),
		[errorParam],
	);

	useUser({
		redirectTo: "/",
		redirectWhen: "authenticated",
		checkOnboarding: true,
	});

	useEffect(() => {
		posthog.capture("page_viewed_corporate_login");
	}, [posthog]);

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			const secureAttr = location.protocol === "https:" ? "; Secure" : "";
			document.cookie = `${corporateAuthFlowCookieName}=corporate; Path=/; Max-Age=600; SameSite=Lax${secureAttr}`;

			const res = await signIn.social({
				provider: "google",
				callbackURL: location.protocol + "//" + location.host + "/",
			});
			if (res?.error) {
				toast({
					title: res.error.message || "Failed to sign in with Google",
					variant: "destructive",
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="mx-auto flex w-full max-w-[400px] flex-col items-center space-y-8">
				<div className="flex flex-col items-center space-y-2 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<Building2 className="h-6 w-6 text-primary" />
					</div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Welcome to LLM Gateway
					</h1>
					<p className="text-sm text-muted-foreground">
						Sign in with your corporate Google account to continue
					</p>
				</div>

				{errorMessage && (
					<div className="flex w-full items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
						<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
						<p className="text-sm text-destructive">{errorMessage}</p>
					</div>
				)}

				<div className="w-full space-y-4">
					<Button
						onClick={handleGoogleSignIn}
						size="lg"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<FaGoogle className="mr-2 h-4 w-4" />
						)}
						Sign in with Google
					</Button>
				</div>

				<div className="flex w-full items-start gap-3 rounded-lg border bg-muted/50 p-4">
					<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground">
							Corporate accounts only
						</p>
						<p className="text-xs text-muted-foreground/80">
							Access is restricted to corporate Google Workspace accounts.
							Personal email addresses (Gmail, Yahoo, Outlook, etc.) are not
							permitted.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function CorporateLogin() {
	return (
		<Suspense>
			<CorporateLoginContent />
		</Suspense>
	);
}
