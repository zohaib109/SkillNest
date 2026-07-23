/**
 * Pure, framework-agnostic domain types.
 * IMPORTANT: keep this module free of runtime imports (no mongoose, no server code)
 * so it is safe to import into client components with `import type`.
 */

export type Role = "student" | "tutor" | "admin";

export type TutorStatus = "draft" | "pending_review" | "approved" | "rejected";

export interface AvailabilityRule {
	/** 0 = Sunday ... 6 = Saturday */
	dayOfWeek: number;
	/** "HH:mm" 24-hour, interpreted in the tutor's timezone */
	startTime: string;
	/** "HH:mm" 24-hour, interpreted in the tutor's timezone */
	endTime: string;
}

/** Plain, serializable tutor profile shape passed to Client Components. */
export interface TutorProfileDTO {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
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
	status: TutorStatus;
	rejectionReason: string;
	ratingAverage: number;
	reviewCount: number;
	createdAt: string;
	updatedAt: string;
}

/** Input payload for saving a tutor profile (from the editor form). */
export interface TutorProfileInput {
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
