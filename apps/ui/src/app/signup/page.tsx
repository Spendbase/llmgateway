"use client";

import { Loader2, Github } from "lucide-react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { useState, useEffect } from "react";
import { FaGoogle } from "react-icons/fa";

import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import { toast } from "@/lib/components/use-toast";

export default function Signup() {
	const posthog = usePostHog();
	const [isLoading, setIsLoading] = useState(false);
	const { signIn } = useAuth();

	// Redirect to root if already authenticated
	useUser({
		redirectTo: "/",
		redirectWhen: "authenticated",
		checkOnboarding: true,
	});

	useEffect(() => {
		posthog.capture("page_viewed_signup");
	}, [posthog]);

	return (
		<div className="px-4 sm:px-0 max-w-[64rem] mx-auto flex h-screen w-screen flex-col items-center justify-center">
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
				<div className="flex flex-col space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Create an account
					</h1>
					<p className="text-sm text-muted-foreground">
						Use Google or GitHub to create your account
					</p>
				</div>
				<div className="grid grid-cols-1 gap-3">
					<Button
						onClick={async () => {
							setIsLoading(true);
							try {
								const res = await signIn.social({
									provider: "google",
									callbackURL: location.protocol + "//" + location.host + "/",
								});
								if (res?.error) {
									toast({
										title: res.error.message || "Failed to sign up with Google",
										variant: "destructive",
									});
								}
							} finally {
								setIsLoading(false);
							}
						}}
						variant="outline"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<FaGoogle className="mr-2 h-4 w-4" />
						)}
						Sign up with Google
					</Button>
					<Button
						onClick={async () => {
							setIsLoading(true);
							try {
								const res = await signIn.social({
									provider: "github",
									callbackURL: location.protocol + "//" + location.host + "/",
								});
								if (res?.error) {
									toast({
										title: res.error.message || "Failed to sign up with GitHub",
										variant: "destructive",
									});
								}
							} finally {
								setIsLoading(false);
							}
						}}
						variant="outline"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Github className="mr-2 h-4 w-4" />
						)}
						Sign up with GitHub
					</Button>
				</div>
				<p className="px-8 text-center text-sm text-muted-foreground">
					<Link
						href="/login"
						className="hover:text-brand underline underline-offset-4"
					>
						Already have an account? Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
