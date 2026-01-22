"use client";

import { Code, CreditCard, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/lib/auth-client";

export default function DashboardClient() {
	const router = useRouter();
	const { signOut } = useAuth();

	const { user, isLoading: userLoading } = useUser({
		redirectTo: "/login?returnUrl=/dashboard",
		redirectWhen: "unauthenticated",
	});

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	if (userLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<Code className="h-6 w-6" />
						<span className="font-semibold text-lg">LLM API Code</span>
					</Link>
					<div className="flex items-center gap-4">
						<span className="text-sm text-muted-foreground">{user?.email}</span>
						<Button variant="ghost" size="sm" onClick={handleSignOut}>
							<LogOut className="h-4 w-4 mr-2" />
							Sign out
						</Button>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<h1 className="text-2xl font-bold mb-8">Dashboard</h1>

				<div className="space-y-8">
					<div className="rounded-lg border p-6 text-center">
						<CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<h2 className="font-semibold text-lg mb-2">No Active Plan</h2>
						<p className="text-muted-foreground mb-4">
							Subscribe to a Dev Plan for AI-powered coding.
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
