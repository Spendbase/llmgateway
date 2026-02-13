import { getEmailLayout } from "@/emails/base-layout.js";

export interface VerifyEmailProps {
	url: string;
}

export function getVerifyEmail({ url }: VerifyEmailProps): string {
	const content = `
		<h1 style="color: #2563eb; margin-top: 0;">Welcome to LLMGateway!</h1>
		<p style="font-size: 16px; margin-bottom: 20px;">
			Please click the link below to verify your email address:
		</p>
		<div style="text-align: center; margin: 30px 0;">
			<a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">Verify Email</a>
		</div>
		<p style="font-size: 14px; color: #666; margin-top: 30px;">
			If you didn't create an account, you can safely ignore this email.
		</p>
		<p style="font-size: 14px; color: #666;">
			Have feedback? Let us know by replying to this email – we might also have some free credits for you!
		</p>
	`;

	return getEmailLayout({
		title: "Verify your email address",
		content,
		preview: "Verify your email address for LLMGateway",
	});
}
