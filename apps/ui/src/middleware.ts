import { NextResponse } from "next/server";

const REFERRAL_COOKIE_NAME = "llmapi_referral";
const REFERRAL_COOKIE_DAYS = 30;

export function middleware(request: Request) {
	const url = new URL(request.url);
	const ref = url.searchParams.get("ref");

	if (!ref) {
		return NextResponse.next();
	}

	url.searchParams.delete("ref");
	const targetUrl =
		url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");

	const response = NextResponse.redirect(new URL(targetUrl, url.origin), 307);

	response.cookies.set(REFERRAL_COOKIE_NAME, ref, {
		path: "/",
		maxAge: 60 * 60 * 24 * REFERRAL_COOKIE_DAYS,
		sameSite: "lax",
	});

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
