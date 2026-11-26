import { z } from "zod/v4";

export const lessonGoal = z.string().trim().max(300);
export const practiceResponses = ["independent", "needs_help"] as const;
export const practiceResponse = z.enum(practiceResponses);

export const recapInput = z.object({
	practised: z.string().trim().min(3).max(400),
	exercise: z.string().trim().min(3).max(300),
	resource: z.union([
		z.literal(""),
		z
			.url({ protocol: /^https$/ })
			.max(500)
			.refine((value) => {
				if (!URL.canParse(value)) return false;
				const url = new URL(value);
				return !url.username && !url.password;
			}, "Use a public HTTPS resource link."),
	]),
});
