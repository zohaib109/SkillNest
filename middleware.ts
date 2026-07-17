import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/complete-profile"];
const authRoutes = ["/sign-in", "/sign-up"];

export default function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const sessionToken = request.cookies.get("better-auth.session-token");

	const isProtected = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

	// Redirect unauthenticated users to sign-in
	if (isProtected && !sessionToken) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(signInUrl);
	}

	// Redirect authenticated users away from auth pages to their dashboard
	if (isAuthRoute && sessionToken) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		// Skip static files, API routes, and Next.js internals
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
	],
};
