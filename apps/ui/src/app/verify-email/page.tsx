"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useResendEmail } from "@/hooks/useResendEmail";
import { useToast } from "@/lib/components/use-toast";
import { useAppConfig } from "@/lib/config";
import { useApi } from "@/lib/fetch-client";
import Logo from "@/lib/icons/Logo";

const CODE_LENGTH = 6;
const CODE_REGEX = /^\d{6}$/;

export default function VerifyEmailPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { toast } = useToast();
	const { apiUrl } = useAppConfig();
	const api = useApi();
	const queryClient = useQueryClient();

	const emailFromQuery = searchParams.get("email") ?? "";
	const [email, setEmail] = useState(emailFromQuery);
	const [code, setCode] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { cooldown, canResend, handleResend, user } = useResendEmail({
		email: email || null,
	});

	if (user?.emailVerified) {
		router.replace(user?.onboardingCompleted ? "/dashboard" : "/onboarding");
		return null;
	}

	const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
		setCode(value);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const trimmedEmail = email.trim().toLowerCase();
		const trimmedCode = code.trim();

		if (!trimmedEmail) {
			toast({
				title: "Email required",
				description: "Enter the email address you used to sign up.",
				variant: "destructive",
			});
			return;
		}

		if (!trimmedCode) {
			toast({
				title: "Code required",
				description: "Enter the 6-digit code from your email.",
				variant: "destructive",
			});
			return;
		}

		if (!CODE_REGEX.test(trimmedCode)) {
			toast({
				title: "Invalid code",
				description: "The code must be 6 digits.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`${apiUrl}/auth/verify-email-with-code`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email: trimmedEmail, code: trimmedCode }),
			});

			const data = await res.json();

			if (data.success) {
				const queryKey = api.queryOptions("get", "/user/me", {}).queryKey;
				await queryClient.invalidateQueries({ queryKey });
				toast({
					title: "Email verified",
					description: "Redirecting...",
				});
				router.refresh();
				router.replace("/onboarding");
				return;
			}

			if (res.status === 429) {
				toast({
					title: "Too many attempts",
					description: data.message,
					variant: "destructive",
				});
				return;
			}

			toast({
				title: "Verification failed",
				description:
					data.message ?? "Invalid or expired code. Request a new one.",
				variant: "destructive",
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				toast({
					title: "Error",
					description:
						error.message ?? "Something went wrong. Please try again.",
					variant: "destructive",
				});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="flex w-full max-w-md flex-col items-center text-center">
				<div className="mb-8 flex flex-col items-center gap-4">
					<Logo className="h-10 w-10" />
					<h1 className="text-2xl font-semibold tracking-tight">
						Verify your email
					</h1>
				</div>

				<p className="mb-6 text-sm text-muted-foreground">
					We&apos;ve sent a 6-digit code
					{email && (
						<>
							{" "}
							to <span className="font-medium text-foreground">{email}</span>
						</>
					)}
					. Enter it below.
				</p>

				<form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
					{!emailFromQuery && (
						<div className="flex flex-col gap-2 text-left">
							<label
								htmlFor="verify-email"
								className="text-sm font-medium text-foreground"
							>
								Email
							</label>
							<input
								id="verify-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								autoComplete="email"
							/>
						</div>
					)}

					<div className="flex flex-col gap-2 text-left">
						<label
							htmlFor="verify-code"
							className="text-sm font-medium text-foreground"
						>
							Verification code
						</label>
						<input
							id="verify-code"
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							value={code}
							onChange={handleCodeChange}
							placeholder="000000"
							maxLength={CODE_LENGTH}
							className="rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-[0.3em] font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						/>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{isSubmitting ? "Verifying..." : "Verify"}
					</button>
				</form>

				<div className="mt-6 space-y-2 text-sm">
					<button
						type="button"
						onClick={handleResend}
						disabled={!canResend}
						className="text-sm font-medium text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground"
					>
						{canResend
							? "Not seeing the code? Resend email"
							: `Resend available in ${cooldown} seconds`}
					</button>
					{!email && (
						<p className="text-xs text-muted-foreground">
							Use the same email address you used during registration.
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
