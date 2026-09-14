import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	// Check if user has better-auth session token cookie
	const sessionToken =
		request.cookies.get("better-auth.session_token")?.value ||
		request.cookies.get("__Secure-better-auth.session_token")?.value;

	// Redirect unauthenticated users to sign-in
	if (!sessionToken) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set(
			"callbackUrl",
			`${request.nextUrl.pathname}${request.nextUrl.search}`,
		);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/complete-profile/:path*", "/tutors/:path*"],
};
