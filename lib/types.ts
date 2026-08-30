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
	photoUrl: string;
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
	photoUrl: string;
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

export type LessonRequestStatus = "pending" | "accepted" | "declined";

export interface LessonRequestDTO {
	id: string;
	tutorId: string;
	tutorProfileId: string;
	tutorName: string;
	tutorSlug: string;
	studentId: string;
	studentName: string;
	studentEmail: string;
	subject: string;
	duration: number;
	preferredSchedule: string;
	message: string;
	status: LessonRequestStatus;
	respondedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface LessonRequestInput {
	tutorSlug: string;
	subject: string;
	duration: number;
	preferredSchedule: string;
	message: string;
}

export type BookingStatus =
	| "pending_payment"
	| "confirmed"
	| "completed"
	| "expired"
	| "cancelled_by_student"
	| "cancelled_by_tutor";

export type BookingPaymentStatus = "unpaid" | "paid" | "refunded";

/** Plain, serializable booking shape passed to Client Components. */
export interface BookingDTO {
	id: string;
	tutorId: string;
	tutorProfileId: string;
	tutorName: string;
	tutorSlug: string;
	studentId: string;
	studentName: string;
	studentEmail: string;
	subject: string;
	durationMinutes: number;
	/** Canonical UTC instants (ISO strings); UI renders in local timezone. */
	startTime: string;
	endTime: string;
	status: BookingStatus;
	paymentStatus: BookingPaymentStatus;
	priceAmount: number;
	priceCurrency: string;
	cancelledAt: string;
	cancellationReason: string;
	createdAt: string;
}

/**
 * Slot availability payload handed to the client slot picker.
 * Keys are lesson durations in minutes; values are ISO UTC start instants
 * of bookable slots (already filtered for lead time and existing bookings).
 */
export interface TutorSlotAvailability {
	durations: number[];
	slotsByDuration: Record<number, string[]>;
}

export type RefundStatus = "pending" | "approved" | "rejected";

/** Plain, serializable refund request shape for Client Components. */
export interface RefundRequestDTO {
	id: string;
	bookingId: string;
	studentId: string;
	tutorName: string;
	subject: string;
	/** Canonical UTC instant (ISO string) of the lesson start. */
	lessonStart: string;
	amount: number;
	currency: string;
	reason: string;
	status: RefundStatus;
	adminNote: string;
	processedBy: string;
	processedAt: string;
	createdAt: string;
}
