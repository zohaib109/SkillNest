import { z } from "zod/v4";
import { LESSON_DURATIONS } from "@/lib/constants";
import { isSupportedTimeZone } from "@/lib/scheduling";
import { tutorProfileIdSchema } from "@/lib/validators/tutor";

export const bookingIdSchema = tutorProfileIdSchema;

export const bookingHoldSchema = z.object({
	profileId: tutorProfileIdSchema,
	startsAt: z.iso
		.datetime()
		.max(32)
		.transform((value) => new Date(value)),
	duration: z.literal(LESSON_DURATIONS),
	studentTimezone: z.string().min(1).max(100).refine(isSupportedTimeZone),
	amountMinor: z.number().int().positive().max(1_500_000),
	currency: z.string().length(3),
});
