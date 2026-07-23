import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import type { Role } from "@/lib/types";

export const ADMIN_EMAILS = ["zohaibammar33@gmail.com"] as const;

export function isAdminEmail(email: string | null | undefined) {
	const normalizedEmail = email?.trim().toLowerCase();
	return ADMIN_EMAILS.some((adminEmail) => adminEmail === normalizedEmail);
}

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

/** The private moderation area is intentionally email allowlist based, not role based. */
export async function requireAdmin() {
	const session = await requireUser();
	if (!isAdminEmail(session.user.email)) {
		redirect("/dashboard");
	}
	return session;
}

/** Non-redirecting role check for use inside Server Actions. */
export function hasRole(role: string | undefined | null, expected: Role) {
	return role === expected;
}

/** Check if a tutor profile is approved and live. */
export function isTutorApproved(
	profile: { status?: string; isApproved?: boolean } | null | undefined,
): boolean {
	return profile?.status === "approved" && Boolean(profile?.isApproved);
}

/** Check if a tutor profile is pending admin review. */
export function isTutorPendingReview(
	profile: { status?: string } | null | undefined,
): boolean {
	return profile?.status === "pending_review";
}

/** Check if a tutor profile was rejected with requested changes. */
export function isTutorRejected(
	profile: { status?: string } | null | undefined,
): boolean {
	return profile?.status === "rejected";
}

/** Require the current user to be an approved tutor, else bounce to /dashboard. */
export async function requireApprovedTutor() {
	const session = await requireRole("tutor");
	const { getTutorProfileByUserId } = await import("@/lib/tutors");
	const profile = await getTutorProfileByUserId(session.user.id);
	if (!isTutorApproved(profile)) {
		redirect("/dashboard");
	}
	return { session, profile };
}
