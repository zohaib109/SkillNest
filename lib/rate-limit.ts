/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Suited to the v1 single-node deployment (Hostinger + PM2). If the app is
 * ever scaled to multiple instances, replace with a shared store (e.g. Redis).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
	if (buckets.size < MAX_BUCKETS) return;
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
	if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

export interface RateLimitResult {
	ok: boolean;
	/** Seconds until the window resets (only when blocked). */
	retryAfter?: number;
}

export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number,
): RateLimitResult {
	const now = Date.now();
	prune(now);

	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true };
	}
	bucket.count += 1;
	if (bucket.count > limit) {
		return {
			ok: false,
			retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
		};
	}
	return { ok: true };
}
