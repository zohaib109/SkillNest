import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import type { Role } from "@/lib/types";

/**
 * Role & authorization helpers.
 *
 * Use the `require*` helpers inside Server Components / route segments — they
 * redirect on failure. For Server Actions prefer `getSession()` directly and
 * return a friendly `{ error }` instead of redirecting.
 */

export async function requireUser() {
	const session = await getSession();
	if (!session) {
		redirect("/sign-in");
	}
	return session;
}

/** Require the current user to have a specific role, else bounce to /dashboard. */
export async function requireRole(role: Role) {
	const session = await requireUser();
	if (session.user.role !== role) {
		redirect("/dashboard");
	}
	return session;
}

/** Non-redirecting role check for use inside Server Actions. */
export function hasRole(role: string | undefined | null, expected: Role) {
	return role === expected;
}
