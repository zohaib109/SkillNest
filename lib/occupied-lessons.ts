import "server-only";
import type { QueryFilter } from "mongoose";
import type { LessonSlot } from "@/lib/scheduling";
import { Booking, type BookingDoc } from "@/models/Booking";

export function activeBookings(now: Date): QueryFilter<BookingDoc> {
	return {
		$or: [
			{ status: { $in: ["confirmed", "completed"] } },
			{ status: "held", holdExpiresAt: { $gt: now } },
		],
	};
}

/** Read conflicts for a bounded time window in one query for the entire results page. */
export async function occupiedLessons(
	tutorIds: string[],
	studentId: string | null,
	from: Date,
	until: Date,
	now: Date,
) {
	return Booking.find({
		$and: [
			activeBookings(now),
			{
				startsAt: { $lt: until },
				$or: [
					{ tutorId: { $in: tutorIds }, blockedUntil: { $gt: from } },
					...(studentId ? [{ studentId, endsAt: { $gt: from } }] : []),
				],
			},
		],
	})
		.select("tutorId studentId startsAt endsAt blockedUntil -_id")
		.lean();
}

export function isSlotOpen(
	slot: LessonSlot,
	tutorId: string,
	studentId: string | null,
	occupied: Awaited<ReturnType<typeof occupiedLessons>>,
) {
	return !occupied.some(
		(other) =>
			(other.tutorId === tutorId &&
				other.startsAt < slot.blockedUntil &&
				other.blockedUntil > slot.start) ||
			(studentId !== null &&
				other.studentId === studentId &&
				other.startsAt < slot.end &&
				other.endsAt > slot.start),
	);
}
