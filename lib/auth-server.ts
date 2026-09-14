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
 * Require an authenticated session and throw if not logged in.
 * Prefer the redirecting helpers in `lib/permissions.ts` for Server Components.
 */
export async function requireSession() {
	const session = await getSession();
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}
