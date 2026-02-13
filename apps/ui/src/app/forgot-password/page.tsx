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
			let retryAfterSeconds: number | undefined;

			const { error } = await forgetPassword(
				{
					email: values.email,
					redirectTo: "/reset-password",
				},
				{
					onError: (ctx) => {
						if (ctx.response.status === 429) {
							const retryHeader = ctx.response.headers.get("Retry-After");
							if (retryHeader) {
								retryAfterSeconds = parseInt(retryHeader, 10);
							}
						}
					},
				},
			);

			if (error) {
				if (error.status === 429) {
					let msg = "Too many attempts. Please try again later.";

					if (retryAfterSeconds) {
						const minutes = Math.ceil(retryAfterSeconds / 60);
						msg = `Too many attempts. Please try again in ${minutes} minutes.`;
					}

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

			setIsSuccess(true);
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
