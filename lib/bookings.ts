import "server-only";

import { lessonQuote } from "@/lib/booking-terms";
import { LESSON_DURATIONS } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import {
	activeBookings,
	isSlotOpen,
	occupiedLessons,
} from "@/lib/occupied-lessons";
import {
	DAY_MS,
	findLessonSlots,
	HOLD_MINUTES,
	type LessonSlot,
	MINUTE_MS,
	withSchedulingDefaults,
} from "@/lib/scheduling";
import { APPROVED_TUTOR_FILTER } from "@/lib/tutors";
import type { bookingHoldSchema } from "@/lib/validators/booking";
import { Booking, StudentBookingLock } from "@/models/Booking";
import { TutorProfile, type TutorProfileDoc } from "@/models/TutorProfile";

const WEEK_MS = 7 * DAY_MS;
const MAX_ACTIVE_HOLDS = 3;

function scheduleOf(tutor: TutorProfileDoc) {
	return { ...tutor, scheduling: withSchedulingDefaults(tutor.scheduling) };
}

export async function getBookableWeek(
	slug: string,
	studentId: string,
	requestedDuration: number,
	requestedWeek: number,
) {
	await connectDB();
	const tutor = await TutorProfile.findOne({
		...APPROVED_TUTOR_FILTER,
		slug,
	}).lean();
	if (!tutor) return null;
	const schedule = scheduleOf(tutor);
	const durations = LESSON_DURATIONS.filter((duration) =>
		tutor.lessonDurations.includes(duration),
	);
	const duration =
		durations.find((value) => value === requestedDuration) ?? durations[0];
	const now = new Date();
	// Anchor paging at UTC midnight so links remain stable throughout the day.
	const today = Math.floor(now.getTime() / DAY_MS) * DAY_MS;
	const weekCount = Math.ceil(
		(now.getTime() - today + schedule.scheduling.bookingHorizonDays * DAY_MS) /
			WEEK_MS,
	);
	const week = Math.min(requestedWeek, weekCount - 1);
	const from = new Date(today + week * WEEK_MS);
	const until = new Date(from.getTime() + WEEK_MS);
	const quote = duration
		? lessonQuote(tutor.hourlyRate, tutor.currency, duration)
		: null;
	const candidates = quote
		? findLessonSlots(schedule, duration, now, from, until)
		: [];
	const first = candidates[0];
	const last = candidates.at(-1);
	let slots: LessonSlot[] = [];
	if (first && last) {
		const occupied = await occupiedLessons(
			[tutor.userId],
			studentId,
			first.start,
			last.blockedUntil,
			now,
		);
		slots = candidates.filter((slot) =>
			isSlotOpen(slot, tutor.userId, studentId, occupied),
		);
	}
	return {
		profileId: String(tutor._id),
		tutorId: tutor.userId,
		tutorName: tutor.userName || "SkillNest tutor",
		tutorTimezone: tutor.timezone,
		durations,
		duration,
		week,
		weekCount,
		from,
		until,
		quote,
		slots: slots.map(({ start }) => start.toISOString()),
	};
}

class HoldUnavailable extends Error {}

/** Serialize competitors by tutor and student, then validate and write in one snapshot. */
export async function createBookingHold(
	studentId: string,
	input: ReturnType<typeof bookingHoldSchema.parse>,
) {
	const { connection } = await connectDB();
	try {
		// Concurrent first-time requests may race to create the same primary key.
		await StudentBookingLock.updateOne(
			{ _id: studentId },
			{ $setOnInsert: { sequence: 0 } },
			{ upsert: true },
		);
	} catch (error) {
		if (
			!(
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === 11000
			)
		)
			throw error;
	}

	try {
		return await connection.transaction(
			async (session) => {
				// This write acquires the same document lock as schedule and approval
				// changes. With competing transactions, MongoDB retries the whole snapshot.
				const tutor = await TutorProfile.findOneAndUpdate(
					{ _id: input.profileId, ...APPROVED_TUTOR_FILTER },
					{ $inc: { bookingSequence: 1 } },
					{ session, timestamps: false },
				).lean();
				if (!tutor)
					throw new HoldUnavailable("This tutor is unavailable for booking.");
				const lock = await StudentBookingLock.updateOne(
					{ _id: studentId },
					{ $inc: { sequence: 1 } },
					{ session },
				);
				if (!lock.matchedCount) throw new Error("Missing student booking lock");
				const now = new Date();
				const busy = activeBookings(now);
				const existing = await Booking.findOne({
					studentId,
					tutorProfileId: tutor._id,
					startsAt: input.startsAt,
					duration: input.duration,
					status: "held",
					holdExpiresAt: { $gt: now },
					amountMinor: input.amountMinor,
					currency: input.currency,
				})
					.session(session)
					.lean();
				if (existing)
					return { success: true as const, id: String(existing._id) };

				const endOfSearch = new Date(input.startsAt.getTime() + 1);
				const [slot] = findLessonSlots(
					scheduleOf(tutor),
					input.duration,
					now,
					input.startsAt,
					endOfSearch,
				);
				if (!slot)
					throw new HoldUnavailable(
						"That time is no longer available. Choose another time.",
					);
				const quote = lessonQuote(
					tutor.hourlyRate,
					tutor.currency,
					input.duration,
				);
				if (
					!quote ||
					quote.amountMinor !== input.amountMinor ||
					quote.currency !== input.currency
				) {
					throw new HoldUnavailable(
						"This lesson's price has changed. Review the current price and try again.",
					);
				}
				const conflict = await Booking.exists({
					$and: [
						busy,
						{
							$or: [
								{
									tutorId: tutor.userId,
									startsAt: { $lt: slot.blockedUntil },
									blockedUntil: { $gt: slot.start },
								},
								{
									studentId,
									startsAt: { $lt: slot.end },
									endsAt: { $gt: slot.start },
								},
							],
						},
					],
				}).session(session);
				if (conflict)
					throw new HoldUnavailable(
						"That time conflicts with another reservation. Choose another time.",
					);
				const activeHolds = await Booking.countDocuments({
					studentId,
					status: "held",
					holdExpiresAt: { $gt: now },
				}).session(session);
				if (activeHolds >= MAX_ACTIVE_HOLDS) {
					throw new HoldUnavailable(
						"You have three active holds. Release one in My Bookings to reserve another lesson.",
					);
				}

				const booking = new Booking({
					studentId,
					tutorId: tutor.userId,
					tutorProfileId: tutor._id,
					tutorName: tutor.userName || "SkillNest tutor",
					tutorTimezone: tutor.timezone,
					studentTimezone: input.studentTimezone,
					goal: input.goal || undefined,
					startsAt: slot.start,
					endsAt: slot.end,
					blockedUntil: slot.blockedUntil,
					duration: input.duration,
					...quote,
					status: "held",
					holdExpiresAt: new Date(now.getTime() + HOLD_MINUTES * MINUTE_MS),
				});
				await booking.save({ session });
				return { success: true as const, id: String(booking._id) };
			},
			{ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } },
		);
	} catch (error) {
		if (error instanceof HoldUnavailable)
			return { success: false as const, error: error.message };
		throw error;
	}
}

export async function releaseBookingHold(studentId: string, bookingId: string) {
	await connectDB();
	const now = new Date();
	const booking = await Booking.findOneAndUpdate(
		{ _id: bookingId, studentId, status: "held", holdExpiresAt: { $gt: now } },
		{ $set: { status: "cancelled", cancelledAt: now } },
	);
	return Boolean(booking);
}

export async function listStudentBookings(studentId: string) {
	await connectDB();
	return Booking.find({ studentId })
		.sort({ createdAt: -1, _id: -1 })
		.limit(50)
		.lean();
}

export async function listTutorLessons(tutorId: string) {
	await connectDB();
	return Booking.find({ tutorId, confirmedAt: { $exists: true } })
		.sort({ startsAt: -1 })
		.limit(50)
		.lean();
}

export async function listRecentBookings() {
	await connectDB();
	return Booking.find()
		.select("-goal -recap -practiceResponse")
		.sort({ _id: -1 })
		.limit(50)
		.lean();
}
