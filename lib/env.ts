import { z } from "zod/v4";

const envSchema = z.object({
	MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
	BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
	BETTER_AUTH_URL: z
		.string()
		.url("BETTER_AUTH_URL must be a valid URL")
		.default("http://localhost:3000"),
	GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
	GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

function validateEnv() {
	const parsed = envSchema.safeParse(process.env);

	if (!parsed.success) {
		console.error(
			"❌ Invalid environment variables:",
			parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
		);
		throw new Error("Invalid environment variables");
	}

	return parsed.data;
}

export const env = validateEnv();
