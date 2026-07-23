import { z } from "zod/v4";
import {
	CURRENCIES,
	LANGUAGES,
	LESSON_DURATIONS,
	SUBJECTS,
} from "@/lib/constants";

const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];
const subjectValues = SUBJECTS as readonly string[];
const languageValues = LANGUAGES as readonly string[];
const durationValues = LESSON_DURATIONS as readonly number[];

export const tutorProfileSchema = z.object({
	photoUrl: z
		.string()
		.trim()
		.min(1, "Add a profile photo before submitting for review")
		.max(1_500_000, "Profile photo is too large. Please choose a smaller image")
		.refine(
			(value) => value.startsWith("data:image/") || /^https?:\/\//.test(value),
			{ message: "Add a valid profile photo" },
		),
	headline: z
		.string()
		.trim()
		.min(10, "Headline must be at least 10 characters")
		.max(120, "Headline must be at most 120 characters"),
	bio: z
		.string()
		.trim()
		.min(50, "Bio must be at least 50 characters")
		.max(2000, "Bio must be at most 2000 characters"),
	subjects: z
		.array(z.string())
		.min(1, "Select at least one subject")
		.refine((arr) => arr.every((s) => subjectValues.includes(s)), {
			message: "Invalid subject selected",
		}),
	languages: z
		.array(z.string())
		.min(1, "Select at least one language")
		.refine((arr) => arr.every((l) => languageValues.includes(l)), {
			message: "Invalid language selected",
		}),
	hourlyRate: z
		.number()
		.min(1, "Hourly rate must be at least 1")
		.max(10000, "Hourly rate is too high"),
	currency: z.enum(currencyCodes),
	introVideoUrl: z
		.string()
		.trim()
		.url("Enter a valid URL")
		.refine((u) => /youtube\.com|youtu\.be|vimeo\.com/.test(u), {
			message: "Only YouTube or Vimeo links are supported",
		})
		.or(z.literal("")),
	country: z.string().trim().min(2, "Country is required"),
	timezone: z.string().trim().min(1, "Timezone is required"),
	lessonDurations: z
		.array(z.number())
		.min(1, "Select at least one lesson duration")
		.refine((arr) => arr.every((d) => durationValues.includes(d)), {
			message: "Invalid lesson duration selected",
		}),
});

export const availabilityRuleSchema = z
	.object({
		dayOfWeek: z.number().int().min(0).max(6),
		startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time"),
		endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time"),
	})
	.refine((r) => r.startTime < r.endTime, {
		message: "End time must be after start time",
	});

export const availabilitySchema = z.object({
	rules: z.array(availabilityRuleSchema),
});

export const rejectTutorSchema = z.object({
	profileId: z.string().min(1),
	reason: z.string().trim().min(5, "Please provide a rejection reason"),
});

export const lessonRequestSchema = z.object({
	tutorSlug: z.string().trim().min(1),
	subject: z
		.string()
		.trim()
		.refine((value) => subjectValues.includes(value), {
			message: "Choose a valid subject",
		}),
	duration: z
		.number()
		.refine((value) => durationValues.includes(value), {
			message: "Choose a valid lesson duration",
		}),
	preferredSchedule: z
		.string()
		.trim()
		.min(5, "Tell the tutor when you would like to learn")
		.max(280, "Preferred schedule is too long"),
	message: z
		.string()
		.trim()
		.min(10, "Share a little about what you would like help with")
		.max(1_000, "Message is too long"),
});

export const lessonRequestDecisionSchema = z.object({
	requestId: z.string().min(1),
	decision: z.enum(["accepted", "declined"]),
});

export type TutorProfileSchema = z.infer<typeof tutorProfileSchema>;
