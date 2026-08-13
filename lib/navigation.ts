const INTERNAL_ORIGIN = "https://skillnest.local";

/** Prevent authentication callbacks from redirecting users off SkillNest. */
export function sanitizeInternalPath(
	value: string | null | undefined,
	fallback = "/dashboard",
): string {
	if (!value?.startsWith("/") || value.startsWith("//")) {
		return fallback;
	}

	try {
		const url = new URL(value, INTERNAL_ORIGIN);
		if (url.origin !== INTERNAL_ORIGIN) return fallback;

		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return fallback;
	}
}
