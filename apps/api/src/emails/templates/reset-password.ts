import { getEmailLayout } from "@/emails/base-layout.js";

export interface ResetPasswordEmailProps {
	url: string;
}

export function getResetPasswordEmail({
	url,
}: ResetPasswordEmailProps): string {
	const content = `
		<h1 style="color: #2563eb; margin-top: 0;">Reset Password</h1>
		<p style="font-size: 16px; margin-bottom: 20px;">
			You requested to reset your password. Click the link below to proceed:
		</p>
		<div style="text-align: center; margin: 30px 0;">
			<a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>
		</div>
		<p style="font-size: 14px; color: #666; margin-top: 30px;">
			If you didn't request this, you can safely ignore this email. The link will expire in 24 hours.
		</p>
	`;

	return getEmailLayout({
		title: "Reset your password",
		content,
		preview: "Reset your LLMGateway password",
	});
}
