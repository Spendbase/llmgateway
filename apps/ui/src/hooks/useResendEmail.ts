import { useState, useEffect, useCallback } from "react";

import { useAuthClient } from "@/lib/auth-client";
import { toast } from "@/lib/components/use-toast";

const STORAGE_KEY = "resend_email_cooldown_end";
const RESEND_COOLDOWN_SECONDS = 60;

export const useResendEmail = ({ email }: { email: string | null }) => {
	const authClient = useAuthClient();
	const [cooldown, setCooldown] = useState(0);

	const canResend = !!email && cooldown === 0;

	const getRemainingTime = useCallback(() => {
		const expiry = localStorage.getItem(STORAGE_KEY);
		if (!expiry) {
			return 0;
		}

		const remaining = Math.ceil((Number(expiry) - Date.now()) / 1000);
		return remaining > 0 ? remaining : 0;
	}, []);

	useEffect(() => {
		const remaining = getRemainingTime();
		if (remaining > 0) {
			setCooldown(remaining);
		}
	}, [getRemainingTime]);

	useEffect(() => {
		if (cooldown <= 0) {
			return;
		}

		const interval = setInterval(() => {
			const remaining = getRemainingTime();
			setCooldown(remaining);

			if (remaining <= 0) {
				localStorage.removeItem(STORAGE_KEY);
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [cooldown, getRemainingTime]);

	const handleResend = async () => {
		if (!email || cooldown > 0) {
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

			const expiry = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
			localStorage.setItem(STORAGE_KEY, expiry.toString());
			setCooldown(RESEND_COOLDOWN_SECONDS);

			toast({ title: "Verification email sent" });
		} catch (error) {
			toast({
				title: "Failed",
				description: (error as Error)?.message,
				variant: "destructive",
			});
		}
	};

	return {
		cooldown,
		setCooldown,
		canResend,
		handleResend,
	};
};
