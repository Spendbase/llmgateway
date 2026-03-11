import { getEmailLayout } from "@/emails/base-layout.js";

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
	const htmlEscapeMap: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#x27;",
		"/": "&#x2F;",
	};
	return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

export interface LowBalanceAlertEmailProps {
	orgName: string;
	currentBalance: number;
	threshold: number;
}

export function getLowBalanceAlertEmail({
	orgName,
	currentBalance,
	threshold,
}: LowBalanceAlertEmailProps): string {
	const escapedOrgName = escapeHtml(orgName);
	const formattedBalance = `$${currentBalance.toFixed(2)}`;
	const formattedThreshold = `$${threshold.toFixed(2)}`;

	const content = `
		<h1 style="color: #dc2626; margin-top: 0;">Low Balance Warning</h1>
		<p style="font-size: 16px; margin-bottom: 20px; color: #333333;">
			Hi there,
		</p>
		<p style="font-size: 16px; margin-bottom: 20px; color: #333333;">
			The balance for <strong>${escapedOrgName}</strong> has dropped below your configured alert threshold.
		</p>

		<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
			<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #991b1b;">
				Balance Details:
			</p>
			<p style="margin: 0 0 6px 0; font-size: 14px; color: #7f1d1d;">
				<strong>Current Balance:</strong> ${formattedBalance}
			</p>
			<p style="margin: 0; font-size: 14px; color: #7f1d1d;">
				<strong>Alert Threshold:</strong> ${formattedThreshold}
			</p>
		</div>

		<p style="font-size: 16px; margin-bottom: 30px; color: #333333;">
			To avoid service interruptions, please add credits to your account as soon as possible.
		</p>

		<div style="text-align: center; margin: 30px 0;">
			<a href="https://llmapi.ai/dashboard/settings/org/billing" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">Add Credits</a>
		</div>

		<p style="font-size: 14px; color: #666666; margin-top: 30px;">
			If you believe this is an error or need assistance, please reply to this email and we'll be happy to help.
		</p>
	`;

	return getEmailLayout({
		title: "Low balance warning",
		content,
		preview: "Your balance has dropped below your configured alert threshold.",
	});
}
