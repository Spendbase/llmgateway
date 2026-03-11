import { getEmailLayout } from "@/emails/base-layout.js";

export interface VerifyEmailProps {
	code: string;
}

const uiUrl = process.env.UI_URL || "http://localhost:3002";

export function getVerifyEmail({ code }: VerifyEmailProps): string {
	const content = `
					<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 40px 20px;">
						<tr>
							<td align="center">
								<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff;">
									<tr>
										<td style="padding-bottom: 32px;" align="left">
											<table role="presentation" border="0" cellpadding="0" cellspacing="0">
												<tr>
													<td style="vertical-align: middle;">
														<img src="${uiUrl}/llmapi-logo.png" alt="Logo" width="27" height="27" style="display: block; border: 0;" />
													</td>
													<td style="vertical-align: middle; padding-left: 6px;">
														<span style="font-weight: 700; font-size: 20px; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 27px;">
															LLM API
														</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr>
										<td align="left">
											<p style="margin: 0 0 16px 0; font-size: 14px; color: #333333;">
												Thanks for signing up! Please verify your email address to complete your registration and start using your account.
											</p>
											<p style="margin: 0 0 24px 0; font-size: 14px; color: #333333;">
												Enter this verification code on the website:
											</p>

											<div style="text-align:center; margin: 32px 0;">
												<span style="display: inline-block; padding: 16px 32px; border-radius: 8px; background-color: #f0f0f0; font-size: 24px; font-weight: 700; letter-spacing: 0.2em; font-family: monospace;">
													${code}
												</span>
											</div>

											<p style="margin: 0 0 40px 0; font-size: 13px; color: #666666;">
												The code expires in 15 minutes. If you didn&apos;t request this, you can ignore this email.
											</p>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
		`.trim();

	return getEmailLayout({
		title: "Verify your email address",
		content,
		preview: "Verify your email address for LLM API",
	});
}
