/**
 * Framework-agnostic domain types and small runtime guards.
 * Keep this module free of server-only dependencies so client components can
 * safely import its role normalization helpers.
 */

export const ROLES = ["student", "tutor", "admin"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
	return typeof value === "string" && ROLES.includes(value as Role);
}

export function normalizeRole(value: unknown): Role {
	return isRole(value) ? value : "student";
}

export type TutorStatus = "draft" | "pending_review" | "approved" | "rejected";

export interface AvailabilityRule {
	/** 0 = Sunday ... 6 = Saturday */
	dayOfWeek: number;
	/** "HH:mm" 24-hour, interpreted in the tutor's timezone */
	startTime: string;
	/** "HH:mm" 24-hour, interpreted in the tutor's timezone */
	endTime: string;
}

export interface SchedulingSettings {
	minimumNoticeHours: number;
	bookingHorizonDays: number;
	bufferMinutes: number;
	/** Closed dates in the tutor's timezone. */
	timeOffDates: string[];
}

/** Plain, serializable tutor profile shape passed to Client Components. */
export interface TutorProfileDTO {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	publicListing: boolean;
	slug: string;
	headline: string;
	bio: string;
	subjects: string[];
	languages: string[];
	hourlyRate: number;
	currency: string;
	introVideoUrl: string;
	country: string;
	timezone: string;
	lessonDurations: number[];
	availabilityRules: AvailabilityRule[];
	scheduling: SchedulingSettings;
	status: TutorStatus;
	isApproved: boolean;
	rejectionReason: string;
	ratingAverage: number;
	reviewCount: number;
	createdAt: string;
	updatedAt: string;
}

/** Allowlisted fields shared by catalog and profile pages. */
export type PublicTutorProfileDTO = Pick<
	TutorProfileDTO,
	| "id"
	| "slug"
	| "userName"
	| "headline"
	| "bio"
	| "subjects"
	| "languages"
	| "hourlyRate"
	| "currency"
	| "introVideoUrl"
	| "country"
	| "lessonDurations"
	| "ratingAverage"
	| "reviewCount"
> & {
	duration: number | null;
	quote: { amountMinor: number; currency: string } | null;
	nextStart: string | null;
};

/** Input payload for saving a tutor profile (from the editor form). */
export interface TutorProfileInput {
	publicListing?: boolean;
	headline: string;
	bio: string;
	subjects: string[];
	languages: string[];
	hourlyRate: number;
	currency: string;
	introVideoUrl: string;
	country: string;
	timezone: string;
	lessonDurations: number[];
}
