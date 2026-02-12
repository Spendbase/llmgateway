"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

interface RateLimitError {
	retryAfter?: number;
}

const formSchema = z.object({
	email: z.string().email({
		message: "Please enter a valid email address",
	}),
});

export default function ForgotPassword() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const { forgetPassword } = useAuth();
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		try {
			const { error } = await forgetPassword(
				{
					email: values.email,
					redirectTo: "/reset-password",
				},
				{
					onRequest: () => {
						// empty
					},
					onSuccess: () => {
						setIsSuccess(true);
					},
					onError: (_ctx) => {
						// This callback might catch it, but we also check return value
						// checking error below is sufficient usually, but let's see.
					},
				},
			);

			if (error) {
				if (error.status === 429) {
					const rateLimitError = error as RateLimitError;
					const retryAfter = rateLimitError.retryAfter;
					const msg = retryAfter
						? `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
						: "Too many attempts. Please try again later.";

					toast({
						title: msg,
						variant: "destructive",
					});
					return;
				}

				toast({
					title: error.message || "An error occurred",
					variant: "destructive",
				});
				return;
			}

			// If no error, we assume success or handled in onSuccess
			// But verify if result is returned
		} catch {
			toast({
				title: "An unexpected error occurred",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}

	if (isSuccess) {
		return (
			<div className="flex h-screen w-screen flex-col items-center justify-center px-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Check your email</CardTitle>
						<CardDescription>
							If that email exists, we sent a reset link.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button asChild className="w-full" variant="outline">
							<Link href="/login">Back to login</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Reset Password</CardTitle>
					<CardDescription>
						Enter your email address and we will send you a link to reset your
						password.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="name@example.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending link...
									</>
								) : (
									"Send Reset Link"
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
		</div>
	);
}
