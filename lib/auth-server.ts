import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Get the current session from a Server Component or Route Handler.
 * Returns null if the user is not authenticated.
 */
export async function getSession() {
	const headersList = await headers();
	const session = await auth.api.getSession({
		headers: headersList,
	});
	return session;
}

/**
 * Require an authenticated session. Redirects to sign-in if not logged in.
 * Use in Server Components that require authentication.
 */
export async function requireSession() {
	const session = await getSession();
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}
