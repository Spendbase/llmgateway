"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useResendEmail } from "@/hooks/useResendEmail";
import Logo from "@/lib/icons/Logo";

export default function VerifyEmailPage() {
	const searchParams = useSearchParams();

	const initialEmail = useMemo(
		() => searchParams.get("email") ?? "",
		[searchParams],
	);

	const [email] = useState(initialEmail);

	const { cooldown, canResend, handleResend } = useResendEmail({
		email: initialEmail,
	});

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
