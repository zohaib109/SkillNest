import { connectDB } from "@/lib/db";
import type { BookingDTO, BookingStatus } from "@/lib/types";
import { Booking, type BookingDoc } from "@/models/Booking";

/**
 * Server-only data access + serialization for bookings.
 * Converts Mongoose lean documents into plain, client-safe DTOs.
 * All datetimes are canonical UTC ISO strings; the UI localizes them.
 */

type LeanBooking = BookingDoc & {
	_id: unknown;
	createdAt?: Date;
	cancelledAt?: Date | null;
};

/** Statuses that reserve a tutor's calendar (pending payment holds the slot). */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
	"pending_payment",
	"confirmed",
];

/**
 * How long an unpaid booking keeps its slot before it expires.
 * Expiry is enforced lazily on read — no cron needed at this scale.
 */
export const PAYMENT_HOLD_MS = 30 * 60_000;

/** Cancel stale unpaid bookings so their slots are released. Idempotent. */
export async function expireStalePendingBookings(now = new Date()) {
	await connectDB();
	const cutoff = new Date(now.getTime() - PAYMENT_HOLD_MS);
	const result = await Booking.updateMany(
		{ status: "pending_payment", createdAt: { $lt: cutoff } },
		{
			$set: {
				status: "expired",
				cancelledAt: now,
				cancellationReason: "Payment window expired",
			},
		},
	);
	return result.modifiedCount;
}

function serialize(doc: LeanBooking): BookingDTO {
	return {
		id: String(doc._id),
		tutorId: doc.tutorId,
		tutorProfileId: doc.tutorProfileId,
		tutorName: doc.tutorName ?? "",
		tutorSlug: doc.tutorSlug,
		studentId: doc.studentId,
		studentName: doc.studentName ?? "",
		studentEmail: doc.studentEmail ?? "",
		subject: doc.subject,
		durationMinutes: doc.durationMinutes,
		startTime: new Date(doc.startTime).toISOString(),
		endTime: new Date(doc.endTime).toISOString(),
		status: doc.status as BookingStatus,
		paymentStatus: (doc.paymentStatus ??
			"unpaid") as BookingDTO["paymentStatus"],
		priceAmount: doc.priceAmount,
		priceCurrency: doc.priceCurrency ?? "USD",
		cancelledAt: doc.cancelledAt ? new Date(doc.cancelledAt).toISOString() : "",
		cancellationReason: doc.cancellationReason ?? "",
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
	};
}

export async function getBookingsForStudent(
	userId: string,
): Promise<BookingDTO[]> {
	await connectDB();
	const docs = await Booking.find({ studentId: userId })
		.sort({ startTime: -1 })
		.lean<LeanBooking[]>();
	return docs.map(serialize);
}

export async function getBookingsForTutor(
	tutorUserId: string,
): Promise<BookingDTO[]> {
	await connectDB();
	const docs = await Booking.find({ tutorId: tutorUserId })
		.sort({ startTime: -1 })
		.lean<LeanBooking[]>();
	return docs.map(serialize);
}

/** Future active intervals for a tutor profile — used for slot generation. */
export async function getUpcomingBusyIntervals(
	tutorProfileId: string,
	now = new Date(),
): Promise<{ start: Date; end: Date }[]> {
	await expireStalePendingBookings(now);
	await connectDB();
	const docs = await Booking.find({
		tutorProfileId,
		status: { $in: ACTIVE_BOOKING_STATUSES },
		startTime: { $gte: now },
	})
		.select("startTime endTime")
		.lean<{ startTime: Date; endTime: Date }[]>();
	return docs.map((d) => ({
		start: new Date(d.startTime),
		end: new Date(d.endTime),
	}));
}

export async function findConflictingBooking(
	tutorProfileId: string,
	startTime: Date,
	endTime: Date,
): Promise<boolean> {
	await connectDB();
	const conflict = await Booking.exists({
		tutorProfileId,
		status: { $in: ACTIVE_BOOKING_STATUSES },
		startTime: { $lt: endTime },
		endTime: { $gt: startTime },
	});
	return Boolean(conflict);
}
