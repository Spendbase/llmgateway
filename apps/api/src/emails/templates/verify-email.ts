import { getEmailLayout } from "@/emails/base-layout.js";

export interface VerifyEmailProps {
	url: string;
}

const uiUrl = process.env.UI_URL || "http://localhost:3002";

export function getVerifyEmail({ url }: VerifyEmailProps): string {
	const content = `
		<!DOCTYPE html>
			<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Verify your email</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #444444; background-color: #ffffff; margin: 0; padding: 0;">
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
												Click the button below to confirm your email:
											</p>
											
											<div style="text-align:center; margin: 32px 0;">
												<a href="${url}" 
												style="display: inline-block; padding: 12px 36px; border-radius: 6px; background-color: #3F35FF; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
													Verify email
												</a>
											</div>
				
											<p style="margin: 32px 0 8px 0; font-size: 13px; color: #666666;">
												If that button doesn't work, copy and paste this link into your browser:
											</p>
											<p style="margin: 0 0 40px 0; font-size: 13px;line-height: 1.4; color: #666666;">
												<a
													href="${url}"
													style="color: #3F35FF; text-decoration: none; word-break: break-all; display: inline-block;"
												>
													${url}
												</a>
											</p>
				
											<p style="margin: 0; font-size: 14px; color: #333333;">
												<strong>
													Thanks,<br>
													The LLM API team
												</strong>
											</p>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
				</body>
			</html>
		`.trim();

	return getEmailLayout({
		title: "Verify your email address",
		content,
		preview: "Verify your email address for LLM API",
	});
}
