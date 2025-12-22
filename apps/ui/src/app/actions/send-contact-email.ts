"use server";

import { z } from "zod";

const contactFormSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	country: z.string().min(1, "Please select a country"),
	size: z.string().min(1, "Please select company size"),
	message: z.string().min(10, "Message must be at least 10 characters"),
	// Anti-spam fields
	honeypot: z.string().optional(), // Should be empty
	timestamp: z.number().optional(), // Form load timestamp
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

const disposableEmailDomains = [
	"tempmail.com",
	"10minutemail.com",
	"guerrillamail.com",
	"mailinator.com",
	"throwaway.email",
	"temp-mail.org",
	"getairmail.com",
	"trashmail.com",
	"yopmail.com",
];

const spamKeywords = [
	"casino",
	"viagra",
	"cialis",
	"lottery",
	"bitcoin",
	"cryptocurrency",
	"investment opportunity",
	"click here",
	"buy now",
	"limited time",
];

function checkForSpam(text: string): boolean {
	const lowerText = text.toLowerCase();
	return spamKeywords.some((keyword) => lowerText.includes(keyword));
}

function isDisposableEmail(email: string): boolean {
	const domain = email.split("@")[1]?.toLowerCase();
	return disposableEmailDomains.some((disposable) => domain === disposable);
}

export async function sendContactEmail(data: ContactFormData) {
	try {
		// Validate the data
		const validatedData = contactFormSchema.parse(data);

		// Anti-spam check 1: Honeypot field (should be empty)
		if (validatedData.honeypot && validatedData.honeypot.trim() !== "") {
			console.warn("Spam detected: Honeypot field filled");
			return {
				success: false,
				message: "Invalid submission",
			};
		}

		// Anti-spam check 2: Time-based validation (form should take at least 3 seconds)
		if (validatedData.timestamp) {
			const submissionTime = Date.now();
			const timeTaken = submissionTime - validatedData.timestamp;
			const minTime = 3000; // 3 seconds

			if (timeTaken < minTime) {
				console.warn("Spam detected: Form submitted too quickly");
				return {
					success: false,
					message: "Please take your time filling out the form",
				};
			}
		}

		// Anti-spam check 3: Disposable email check
		if (isDisposableEmail(validatedData.email)) {
			console.warn(`Disposable email detected: ${validatedData.email}`);
			return {
				success: false,
				message: "Please use a valid company email address",
			};
		}

		// Anti-spam check 4: Content spam detection
		const contentToCheck = `${validatedData.name} ${validatedData.message}`;
		if (checkForSpam(contentToCheck)) {
			console.warn("Spam keywords detected in submission");
			return {
				success: false,
				message: "Your message contains prohibited content",
			};
		}

		const brevoApiKey = process.env.BREVO_API_KEY;
		if (!brevoApiKey) {
			throw new Error("Brevo API key not configured");
		}

		// Prepare email content
		const htmlContent = `
			<html>
				<head>
					<style>
						body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
						.container { max-width: 600px; margin: 0 auto; padding: 20px; }
						.header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
						.field { margin-bottom: 15px; }
						.label { font-weight: bold; color: #555; }
						.value { color: #333; margin-top: 5px; }
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h2 style="margin: 0; color: #2563eb;">New Enterprise Contact Request</h2>
						</div>
						
						<div class="field">
							<div class="label">Name:</div>
							<div class="value">${validatedData.name}</div>
						</div>
						
						<div class="field">
							<div class="label">Email:</div>
							<div class="value">${validatedData.email}</div>
						</div>
						
						<div class="field">
							<div class="label">Country:</div>
							<div class="value">${validatedData.country}</div>
						</div>
						
						<div class="field">
							<div class="label">Company Size:</div>
							<div class="value">${validatedData.size}</div>
						</div>
						
						<div class="field">
							<div class="label">Message:</div>
							<div class="value" style="white-space: pre-wrap;">${validatedData.message}</div>
						</div>
					</div>
				</body>
			</html>
		`;

		// Send email via Brevo
		const response = await fetch("https://api.brevo.com/v3/smtp/email", {
			method: "POST",
			headers: {
				accept: "application/json",
				"api-key": brevoApiKey,
				"content-type": "application/json",
			},
			body: JSON.stringify({
				sender: {
					name: "LLMGateway Contact Form",
					email: "contact@llmgateway.io",
				},
				to: [
					{
						email: "contact@llmgateway.io",
						name: "LLMGateway Enterprise",
					},
				],
				replyTo: {
					email: validatedData.email,
					name: validatedData.name,
				},
				subject: `Enterprise Contact Request from ${validatedData.name}`,
				htmlContent,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(
				`Brevo API error: ${response.status} ${response.statusText}`,
				errorBody,
			);
			return {
				success: false,
				message: "Failed to send email. Please try again later.",
			};
		}

		return { success: true, message: "Email sent successfully" };
	} catch (error) {
		console.error("Contact form error:", error);

		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: "Invalid form data",
				errors: error.flatten().fieldErrors,
			};
		}

		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to send email. Please try again later.",
		};
	}
}
