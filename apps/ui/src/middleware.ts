import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const REFERRAL_COOKIE_NAME = "llmapi_referral";
const REFERRAL_COOKIE_DAYS = 30;
const CORPORATE_AUTH_FLOW_COOKIE_NAME = "llmapi_corporate_auth_flow";

export function middleware(request: NextRequest) {
	const { nextUrl } = request;
	const ref = nextUrl.searchParams.get("ref");

	let response: NextResponse;

	if (ref) {
		const targetUrl = nextUrl.clone();
		targetUrl.searchParams.delete("ref");

		response = NextResponse.redirect(targetUrl, 307);

		response.cookies.set(REFERRAL_COOKIE_NAME, ref, {
			path: "/",
			maxAge: 60 * 60 * 24 * REFERRAL_COOKIE_DAYS,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});
	} else {
		response = NextResponse.next();
	}

	const isCorpLogin = nextUrl.pathname.includes("/corporate-login");
	if (!isCorpLogin) {
		response.cookies.delete(CORPORATE_AUTH_FLOW_COOKIE_NAME);
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
