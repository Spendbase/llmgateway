"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
	returnUrl?: string;
	className?: string;
	text?: string;
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	showIcon?: boolean;
}

export function GoogleSignInButton({
	returnUrl,
	className,
	text = "Sign in with Google",
	variant = "outline",
	showIcon = false,
}: GoogleSignInButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { signIn } = useAuth();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	// Determine effective return URL:
	// 1. Explicit prop
	// 2. 'returnUrl' search param
	// 3. Current pathname + search params (if not on login page)
	// 4. Default to "/"
	const effectiveReturnUrl =
		returnUrl ||
		searchParams.get("returnUrl") ||
		(pathname === "/login" || pathname === "/signup"
			? "/"
			: pathname + "?" + searchParams.toString());

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			const res = await signIn.social({
				provider: "google",
				callbackURL: window.location.origin + effectiveReturnUrl,
			});
			if (res?.error) {
				toast.error(res.error.message || "Failed to sign in with Google", {
					style: {
						backgroundColor: "var(--destructive)",
						color: "var(--destructive-foreground)",
					},
				});
			}
		} catch (err) {
			console.error("Google sign in error", err);
			toast.error("An unexpected error occurred", {
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handleGoogleSignIn}
			variant={variant}
			className={cn("w-full", className)}
			disabled={isLoading}
		>
			{isLoading ? (
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			) : (
				showIcon && <FaGoogle className="mr-2 h-4 w-4" />
			)}
			{text}
		</Button>
	);
}
