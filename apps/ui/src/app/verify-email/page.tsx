"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuthClient } from "@/lib/auth-client";
import { toast } from "@/lib/components/use-toast";
import Logo from "@/lib/icons/Logo";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
	const searchParams = useSearchParams();
	const authClient = useAuthClient();

	const initialEmail = useMemo(
		() => searchParams.get("email") ?? "",
		[searchParams],
	);

	const [email] = useState(initialEmail);
	const [cooldown, setCooldown] = useState(0);
	const canResend = !!email && cooldown === 0;

	useEffect(() => {
		if (!cooldown) {
			return;
		}

		const interval = setInterval(() => {
			setCooldown((prev) => {
				if (prev <= 1) {
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [cooldown]);

	async function handleResend() {
		if (!email || !canResend) {
			return;
		}

		try {
			await authClient.sendVerificationEmail({
				email,
				callbackURL:
					typeof window !== "undefined"
						? `${window.location.origin}/?emailVerified=true`
						: undefined,
			});

			toast({
				title: "Verification email sent",
				description: "Please check your inbox and spam folder.",
			});

			setCooldown(RESEND_COOLDOWN_SECONDS);
		} catch (error) {
			toast({
				title: "Failed to resend verification email",
				description: (error as Error)?.message ?? undefined,
				variant: "destructive",
			});
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="flex w-full max-w-md flex-col items-center text-center">
				<div className="mb-8 flex flex-col items-center gap-4">
					<Logo className="h-10 w-10" />
					<h1 className="text-2xl font-semibold tracking-tight">
						Verify your email
					</h1>
				</div>

				<div className="space-y-2 text-sm text-muted-foreground">
					<p>
						We&apos;ve sent a verification link
						{email && (
							<>
								{" "}
								to <span className="font-medium text-foreground">{email}</span>
							</>
						)}
						.
					</p>
					<p>If you don&apos;t see it, please check your spam folder.</p>
				</div>

				<div className="mt-6 space-y-2 text-sm">
					<button
						type="button"
						onClick={handleResend}
						disabled={!canResend}
						className="text-sm font-medium text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground"
					>
						{canResend
							? "Not seeing the email? Resend"
							: `Resend available in ${cooldown} seconds`}
					</button>
					{!email && (
						<p className="text-xs text-muted-foreground">
							If you just signed up, please use the same email address you used
							during registration.
						</p>
					)}
				</div>

				<div className="mt-8">
					<Link
						href="/signup"
						className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
					>
						Back to sign up
					</Link>
				</div>
			</div>
		</div>
	);
}
