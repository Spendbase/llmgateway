import { isDisposableEmail } from "disposable-email-domains-js";

export interface EmailValidationResult {
	valid: boolean;
	reason?: "plus_sign" | "disposable_domain" | "blacklisted_domain";
	message?: string;
}

const BLACKLISTED_DOMAINS = [
	"duck.com",
	"duckduckgo.com",
	"keemail.me",
	"15p.me",
	"dollicons.com",
	"anondrop.net",
];

const PUBLIC_EMAIL_DOMAINS = [
	"gmail.com",
	"googlemail.com",
	"yahoo.com",
	"yahoo.co.uk",
	"yahoo.co.in",
	"yahoo.co.jp",
	"outlook.com",
	"hotmail.com",
	"hotmail.co.uk",
	"live.com",
	"live.co.uk",
	"msn.com",
	"aol.com",
	"icloud.com",
	"me.com",
	"mac.com",
	"mail.com",
	"protonmail.com",
	"proton.me",
	"zoho.com",
	"gmx.com",
	"gmx.net",
	"web.de",
	"fastmail.com",
	"tutanota.com",
	"tuta.io",
	"hey.com",
	"inbox.com",
	"rocketmail.com",
	"att.net",
	"sbcglobal.net",
	"comcast.net",
	"verizon.net",
	"cox.net",
	"charter.net",
	"earthlink.net",
	"optonline.net",
	"qq.com",
	"163.com",
	"126.com",
	"sina.com",
	"naver.com",
	"daum.net",
	"hanmail.net",
	"rediffmail.com",
];

export function validateEmail(email: string): EmailValidationResult {
	const emailLower = email.toLowerCase();

	// Check for + sign in local part (before @)
	const localPart = emailLower.split("@")[0];
	if (localPart && localPart.includes("+")) {
		return {
			valid: false,
			reason: "plus_sign",
			message: "Email addresses with '+' are not allowed",
		};
	}

	// Check against blacklisted domains
	const domain = emailLower.split("@")[1];
	if (domain && BLACKLISTED_DOMAINS.includes(domain)) {
		return {
			valid: false,
			reason: "blacklisted_domain",
			message: "This email domain is not allowed",
		};
	}

	// Check against disposable email domains
	if (isDisposableEmail(emailLower)) {
		return {
			valid: false,
			reason: "disposable_domain",
			message: "Disposable email addresses are not allowed",
		};
	}

	return { valid: true };
}

export function isCorporateEmail(email: string): boolean {
	const domain = email.toLowerCase().trim().split("@")[1];
	if (!domain) {
		return false;
	}
	return !PUBLIC_EMAIL_DOMAINS.includes(domain);
}
