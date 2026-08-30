import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
	"/admin",
	"/dashboard",
	"/complete-profile",
	"/tutors",
];

export default function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if user has better-auth session token cookie
	const sessionToken =
		request.cookies.get("better-auth.session_token")?.value ||
		request.cookies.get("__Secure-better-auth.session_token")?.value;

	const isProtected = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	// Redirect unauthenticated users to sign-in
	if (isProtected && !sessionToken) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		// Skip static files, API routes, and Next.js internals
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
	],
};
