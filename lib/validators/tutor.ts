import { z } from "zod/v4";
import { hasOverlappingAvailabilityRules } from "@/lib/availability";
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

function hasUniqueValues<T>(values: T[]): boolean {
	return new Set(values).size === values.length;
}

function isSupportedVideoUrl(value: string): boolean {
	if (value === "") return true;

	try {
		const url = new URL(value);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;

		const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
		return (
			hostname === "youtu.be" ||
			hostname === "youtube.com" ||
			hostname.endsWith(".youtube.com") ||
			hostname === "vimeo.com" ||
			hostname.endsWith(".vimeo.com")
		);
	} catch {
		return false;
	}
}

function isSupportedTimeZone(value: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
		return true;
	} catch {
		return false;
	}
}

export const tutorProfileSchema = z.object({
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
		.max(SUBJECTS.length, "Too many subjects selected")
		.refine((arr) => arr.every((s) => subjectValues.includes(s)), {
			message: "Invalid subject selected",
		})
		.refine(hasUniqueValues, {
			message: "Subjects cannot contain duplicates",
		}),
	languages: z
		.array(z.string())
		.min(1, "Select at least one language")
		.max(LANGUAGES.length, "Too many languages selected")
		.refine((arr) => arr.every((l) => languageValues.includes(l)), {
			message: "Invalid language selected",
		})
		.refine(hasUniqueValues, {
			message: "Languages cannot contain duplicates",
		}),
	hourlyRate: z
		.number()
		.min(1, "Hourly rate must be at least 1")
		.max(10000, "Hourly rate is too high"),
	currency: z.enum(currencyCodes),
	introVideoUrl: z
		.string()
		.trim()
		.max(2048, "Intro video URL is too long")
		.refine(isSupportedVideoUrl, {
			message: "Enter a valid YouTube or Vimeo URL",
		}),
	country: z
		.string()
		.trim()
		.min(2, "Country is required")
		.max(100, "Country must be at most 100 characters"),
	timezone: z
		.string()
		.trim()
		.min(1, "Timezone is required")
		.max(100, "Timezone is too long")
		.refine(isSupportedTimeZone, "Select a valid timezone"),
	lessonDurations: z
		.array(z.number())
		.min(1, "Select at least one lesson duration")
		.max(LESSON_DURATIONS.length, "Too many lesson durations selected")
		.refine((arr) => arr.every((d) => durationValues.includes(d)), {
			message: "Invalid lesson duration selected",
		})
		.refine(hasUniqueValues, {
			message: "Lesson durations cannot contain duplicates",
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

export const availabilitySchema = z
	.object({
		rules: z
			.array(availabilityRuleSchema)
			.max(21, "Too many availability slots"),
	})
	.superRefine(({ rules }, context) => {
		if (hasOverlappingAvailabilityRules(rules)) {
			context.addIssue({
				code: "custom",
				path: ["rules"],
				message: "Availability slots cannot overlap",
			});
		}
	});

const tutorProfileIdSchema = z
	.string()
	.regex(/^[a-f\d]{24}$/i, "Invalid tutor profile id");

export const approveTutorSchema = z.object({
	profileId: tutorProfileIdSchema,
});

export const rejectTutorSchema = z.object({
	profileId: tutorProfileIdSchema,
	reason: z
		.string()
		.trim()
		.min(5, "Please provide a rejection reason")
		.max(1000, "Rejection reason must be at most 1000 characters"),
});

export type TutorProfileSchema = z.infer<typeof tutorProfileSchema>;
