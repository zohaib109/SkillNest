import "server-only";

import { z } from "zod/v4";

const envSchema = z.object({
	MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
	BETTER_AUTH_URL: z.url({
		protocol: /^https?$/,
		message: "BETTER_AUTH_URL must be an HTTP(S) URL",
	}),
	GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
	GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
});

function validateEnv() {
	const parsed = envSchema.safeParse(process.env);

	if (!parsed.success) {
		const details = parsed.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join("; ");
		throw new Error(`Invalid environment configuration: ${details}`);
	}

	return parsed.data;
}

export const env = validateEnv();
