import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const handlers = toNextJsHandler(auth);

/** Per-endpoint-category rules for state-changing auth requests. */
const RULES: {
	match: (path: string) => boolean;
	limit: number;
	windowMs: number;
}[] = [
	{
		match: (p) => p.endsWith("/sign-in/email"),
		limit: 5,
		windowMs: 15 * 60 * 1000,
	},
	{
		match: (p) => p.endsWith("/sign-up/email"),
		limit: 3,
		windowMs: 60 * 60 * 1000,
	},
	{
		match: (p) => p.includes("forget-password") || p.includes("reset-password"),
		limit: 3,
		windowMs: 60 * 60 * 1000,
	},
];

const DEFAULT_LIMIT = 30;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function clientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
	const path = new URL(request.url).pathname;
	const rule = RULES.find((r) => r.match(path));
	const limit = rule?.limit ?? DEFAULT_LIMIT;
	const windowMs = rule?.windowMs ?? DEFAULT_WINDOW_MS;

	const result = checkRateLimit(
		`${clientIp(request)}:${path}`,
		limit,
		windowMs,
	);
	if (!result.ok) {
		return NextResponse.json(
			{
				error:
					"Too many attempts. Please wait a few minutes before trying again.",
			},
			{
				status: 429,
				headers: { "Retry-After": String(result.retryAfter ?? 60) },
			},
		);
	}

	return handlers.POST(request);
}

export const GET = handlers.GET;
