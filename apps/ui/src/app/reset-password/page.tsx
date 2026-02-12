"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/lib/components/form";
import { Input } from "@/lib/components/input";
import { useToast } from "@/lib/components/use-toast";

const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[0-9]/, "Password must contain at least one number")
	.regex(
		/[!@#$%^&*(),.?":{}|<>]/,
		"Password must contain at least one special character",
	);

const formSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

function ResetPasswordForm() {
	const { resetPassword } = useAuth();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const router = useRouter();
	const { toast } = useToast();

	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	if (!token) {
		return (
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-destructive">Invalid Link</CardTitle>
					<CardDescription>Invalid or missing reset link.</CardDescription>
				</CardHeader>
				<CardFooter>
					<Button asChild className="w-full" variant="outline">
						<Link href="/login">Back to login</Link>
					</Button>
				</CardFooter>
			</Card>
		);
	}

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		try {
			const { error } = await resetPassword({
				newPassword: values.password,
				token: token!,
			});

			if (!error) {
				toast({
					title: "Password successfully reset",
				});
				router.push("/login"); // User said redirect to /login
			} else {
				// User requirement: "Show error 'This reset link is invalid or has expired.'"
				if (error.status === 400 || error.status === 401) {
					toast({
						title: "This reset link is invalid or has expired.",
						variant: "destructive",
						description: (
							<Link href="/forgot-password" className="underline">
								Request a new one
							</Link>
						),
					});
				} else {
					toast({
						title: "An error occurred",
						description: error.message || error.statusText,
						variant: "destructive",
					});
				}
			}
		} catch {
			toast({
				title: "An unexpected error occurred",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Set new password</CardTitle>
				<CardDescription>Please enter your new password below.</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type={showPassword ? "text" : "password"}
												placeholder="••••••••"
												{...field}
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4 text-muted-foreground" />
												) : (
													<Eye className="h-4 w-4 text-muted-foreground" />
												)}
											</Button>
										</div>
									</FormControl>
									<ul className="text-xs text-muted-foreground list-disc pl-4 mt-2 space-y-1">
										<li
											className={
												field.value.length >= 8 ? "text-green-500" : ""
											}
										>
											At least 8 characters
										</li>
										<li
											className={
												/[A-Z]/.test(field.value) ? "text-green-500" : ""
											}
										>
											At least 1 uppercase letter
										</li>
										<li
											className={
												/[0-9]/.test(field.value) ? "text-green-500" : ""
											}
										>
											At least 1 number
										</li>
										<li
											className={
												/[!@#$%^&*(),.?":{}|<>]/.test(field.value)
													? "text-green-500"
													: ""
											}
										>
											At least 1 special character
										</li>
									</ul>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type={showConfirmPassword ? "text" : "password"}
												placeholder="••••••••"
												{...field}
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												{showConfirmPassword ? (
													<EyeOff className="h-4 w-4 text-muted-foreground" />
												) : (
													<Eye className="h-4 w-4 text-muted-foreground" />
												)}
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Resetting password...
								</>
							) : (
								"Reset Password"
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
			<CardFooter className="flex justify-center">
				<Link
					href="/login"
					className="flex items-center text-sm text-muted-foreground hover:text-primary"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to login
				</Link>
			</CardFooter>
		</Card>
	);
}

export default function ResetPasswordPage() {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center px-4">
			<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
				<ResetPasswordForm />
			</Suspense>
		</div>
	);
}
