import { z } from "zod/v4";

export const createBookingSchema = z.object({
	tutorSlug: z.string().trim().min(1),
	subject: z.string().trim().min(1, "Choose a subject"),
	durationMinutes: z
		.number()
		.int()
		.min(15, "Lesson duration is too short")
		.max(480, "Lesson duration is too long"),
	/** ISO UTC instant of the slot start (from the slot picker). */
	startUtc: z
		.string()
		.min(1)
		.refine((value) => !Number.isNaN(Date.parse(value)), {
			message: "Invalid start time",
		})
		.refine((value) => Date.parse(value) > Date.now(), {
			message: "This time slot has already passed",
		}),
});

export const cancelBookingSchema = z.object({
	bookingId: z.string().min(1),
	reason: z.string().trim().max(500).optional(),
});
