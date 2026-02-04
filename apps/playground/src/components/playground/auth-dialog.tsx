"use client";

import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";

interface AuthDialogProps {
	open: boolean;
	returnUrl?: string;
}

export function AuthDialog({ open, returnUrl }: AuthDialogProps) {
	if (!open) {
		return null;
	}

	const loginUrl = returnUrl
		? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
		: "/login";
	const signupUrl = returnUrl
		? `/signup?returnUrl=${encodeURIComponent(returnUrl)}`
		: "/signup";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-[500px] rounded-md border bg-background p-6 shadow-md">
				<div className="text-sm font-medium mb-2">Sign in required</div>
				<p className="text-sm text-muted-foreground mb-3">
					Please sign in to use the playground and manage your API keys.
				</p>
				<div className="flex flex-col gap-2">
					<GoogleSignInButton returnUrl={returnUrl} showIcon={false} />
					<Button size="sm" variant="outline" className="w-full" asChild>
						<Link href={loginUrl}>Sign in with Email</Link>
					</Button>
					<Button size="sm" variant="outline" className="w-full" asChild>
						<Link href={signupUrl}>Create account</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
