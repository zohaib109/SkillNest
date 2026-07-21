/**
 * Slug helpers for tutor public profile URLs.
 */

/** Convert an arbitrary string into a URL-safe slug. */
export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Given a base string and an async uniqueness checker, produce a unique slug.
 * Appends -2, -3, ... until `isTaken` returns false.
 */
export async function generateUniqueSlug(
	base: string,
	isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
	const root = slugify(base) || "tutor";
	let candidate = root;
	let counter = 2;

	while (await isTaken(candidate)) {
		candidate = `${root}-${counter}`;
		counter += 1;
	}

	return candidate;
}
