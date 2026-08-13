import type { Role } from "@/lib/types";

export type SelfServiceRole = Exclude<Role, "admin">;

/**
 * Only student and tutor accounts can be created through public registration.
 * Admin access must be provisioned through a controlled operational process.
 */
export function resolveSelfServiceRole(
	requestedRole: unknown,
	selectedRoleCookie?: string | null,
): SelfServiceRole {
	if (selectedRoleCookie === "tutor" || requestedRole === "tutor") {
		return "tutor";
	}

	return "student";
}

export function readSelectedRoleCookie(
	cookieHeader: string | null | undefined,
): SelfServiceRole | null {
	if (!cookieHeader) return null;

	for (const pair of cookieHeader.split(";")) {
		const [rawName, ...rawValue] = pair.trim().split("=");
		if (rawName !== "selected_role") continue;

		try {
			const value = decodeURIComponent(rawValue.join("="));
			return value === "student" || value === "tutor" ? value : null;
		} catch {
			return null;
		}
	}

	return null;
}
