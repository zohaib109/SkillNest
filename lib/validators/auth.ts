import { z } from "zod/v4";

/**
 * Full name validation rules:
 * - Minimum 2 characters
 * - Allows letters, spaces, apostrophes, and periods
 * - Rejects numbers or invalid special characters
 */
export const nameSchema = z
	.string()
	.trim()
	.min(2, "Full name must be at least 2 characters")
	.max(70, "Full name must not exceed 70 characters")
	.refine((val) => /^[a-zA-Z\s'.-]+$/.test(val), {
		message:
			"Full name can only contain letters, spaces, apostrophes, and periods",
	});

/**
 * Email validation rules:
 * - Trims whitespace
 * - Normalizes to lowercase
 * - Enforces valid email structure
 */
export const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.min(1, "Email address is required")
	.email("Please enter a valid email address");

/**
 * Password validation rules:
 * - Minimum 10 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
	.string()
	.min(10, "Password must be at least 10 characters long")
	.max(100, "Password must not exceed 100 characters")
	.refine((val) => /[A-Z]/.test(val), {
		message: "Password must contain at least one uppercase letter",
	})
	.refine((val) => /[a-z]/.test(val), {
		message: "Password must contain at least one lowercase letter",
	})
	.refine((val) => /[0-9]/.test(val), {
		message: "Password must contain at least one number",
	})
	.refine((val) => /[^a-zA-Z0-9]/.test(val), {
		message:
			"Password must contain at least one special character (e.g. !@#$%^&*)",
	});

export const signUpCredentialsSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	password: passwordSchema,
});

export const signUpSchema = signUpCredentialsSchema.extend({
	role: z.enum(["student", "tutor"]),
});

export const signInSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
