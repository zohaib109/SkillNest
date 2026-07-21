/**
 * Shared domain constants for SkillNest.
 * English-only launch scope; Pakistan-first tutor operations.
 */

export const SUBJECTS = [
	"Mathematics",
	"Physics",
	"Chemistry",
	"Biology",
	"English",
	"Computer Science",
	"Programming",
	"Economics",
	"Accounting",
	"Business Studies",
	"History",
	"Geography",
	"Urdu",
	"Arabic",
	"French",
	"Spanish",
	"Music",
	"Art",
	"Test Prep (SAT/IELTS)",
] as const;

export const LANGUAGES = [
	"English",
	"Urdu",
	"Punjabi",
	"Pashto",
	"Sindhi",
	"Arabic",
	"French",
	"Spanish",
	"German",
	"Hindi",
	"Mandarin",
] as const;

export const CURRENCIES = [
	{ code: "USD", label: "USD — US Dollar" },
	{ code: "PKR", label: "PKR — Pakistani Rupee" },
	{ code: "EUR", label: "EUR — Euro" },
	{ code: "GBP", label: "GBP — British Pound" },
	{ code: "INR", label: "INR — Indian Rupee" },
	{ code: "AED", label: "AED — UAE Dirham" },
	{ code: "SAR", label: "SAR — Saudi Riyal" },
	{ code: "CAD", label: "CAD — Canadian Dollar" },
	{ code: "AUD", label: "AUD — Australian Dollar" },
] as const;

/** Tutor-selectable fixed lesson durations (minutes). */
export const LESSON_DURATIONS = [30, 45, 60, 90] as const;

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay()). */
export const DAYS_OF_WEEK = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;
