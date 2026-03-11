"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building2, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { useForm } from "react-hook-form";
import { FaGoogle } from "react-icons/fa";
import { z } from "zod";

import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/lib/components/form";
import { Input } from "@/lib/components/input";
import { toast } from "@/lib/components/use-toast";

const formSchema = z.object({
	email: z.string().email({
		message: "Please enter a valid email address",
	}),
	password: z.string().min(8, {
		message: "Password must be at least 8 characters",
	}),
});

const ERROR_MESSAGES: Record<string, string> = {
	corporate_only:
		"Only corporate email addresses are allowed. Personal email providers like Gmail, Yahoo, and Outlook are not permitted. Please sign in with your work email.",
};

const CORPORATE_LOGIN_COOKIE_NAME = "llmapi_corporate_auth_flow";

function CorporateLoginContent() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const searchParams = useSearchParams();
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

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		try {
			const secureAttr = location.protocol === "https:" ? "; Secure" : "";
			const domainAttr = "; Domain=.llmapi.ai";
			document.cookie = `${CORPORATE_LOGIN_COOKIE_NAME}=corporate; Path=/; Max-Age=600; SameSite=None${secureAttr}${domainAttr}`;

			await signIn.email(
				{
					email: values.email,
					password: values.password,
				},
				{
					onSuccess: () => {
						queryClient.clear();
						toast({ title: "Login successful" });
						router.push("/");
					},
					onError: (ctx) => {
						toast({
							title: "Failed to sign in",
							variant: "destructive",
							description: ctx?.error?.message || "An unknown error occurred",
						});
					},
				},
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			const secureAttr = location.protocol === "https:" ? "; Secure" : "";
			const domainAttr = "; Domain=.llmapi.ai";
			document.cookie = `${CORPORATE_LOGIN_COOKIE_NAME}=corporate; Path=/; Max-Age=600; SameSite=None${secureAttr}${domainAttr}`;

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
		} catch {
			toast({
				title: "Failed to sign in with Google",
				variant: "destructive",
			});
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
						Welcome to LLM API
					</h1>
					<p className="text-sm text-muted-foreground">
						Sign in with your corporate account to continue
					</p>
				</div>

				{errorMessage && (
					<div className="flex w-full items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
						<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
						<p className="text-sm text-destructive">{errorMessage}</p>
					</div>
				)}

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex w-full flex-col space-y-4"
					>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="name@company.com"
											type="email"
											autoComplete="username"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											placeholder="••••••••"
											type="password"
											autoComplete="current-password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</>
							) : (
								"Sign in"
							)}
						</Button>
					</form>
				</Form>

				<div className="relative w-full">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">Or</span>
					</div>
				</div>

				<div className="w-full space-y-4">
					<Button
						onClick={handleGoogleSignIn}
						size="lg"
						variant="outline"
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
							Access is restricted to corporate Google Workspace accounts and
							work email. Personal addresses (Gmail, Yahoo, Outlook, etc.) are
							not permitted.
						</p>
					</div>
				</div>

				<p className="text-center text-sm text-muted-foreground">
					<Link
						href="/login"
						className="hover:text-primary underline underline-offset-4"
					>
						Back to Login
					</Link>
				</p>
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
