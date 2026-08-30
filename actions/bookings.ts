"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import {
	findConflictingBooking,
	getUpcomingBusyIntervals,
} from "@/lib/bookings";
import { connectDB } from "@/lib/db";
import { isTutorApproved } from "@/lib/permissions";
import { generateTutorSlotAvailability, isSlotBookable } from "@/lib/slots";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { BookingDTO } from "@/lib/types";
import {
	cancelBookingSchema,
	createBookingSchema,
} from "@/lib/validators/booking";
import { Booking } from "@/models/Booking";
import { Payment } from "@/models/Payment";
import { TutorProfile } from "@/models/TutorProfile";

type ActionResult =
	| { success: true; checkoutUrl?: string }
	| { success: false; error: string };

function appUrl() {
	return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export async function createBooking(input: {
	tutorSlug: string;
	subject: string;
	durationMinutes: number;
	startUtc: string;
}): Promise<ActionResult> {
	const session = await getSession();
	if (!session)
		return { success: false, error: "Please sign in to book a lesson" };
	if (session.user.role !== "student") {
		return { success: false, error: "Only student accounts can book lessons" };
	}

	const parsed = createBookingSchema.safeParse(input);
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid booking",
		};
	}

	await connectDB();
	const tutor = await TutorProfile.findOne({
		slug: parsed.data.tutorSlug,
		status: "approved",
		isApproved: true,
	});
	if (!tutor || !isTutorApproved(tutor)) {
		return { success: false, error: "This tutor is not available for booking" };
	}
	if (!tutor.subjects.includes(parsed.data.subject)) {
		return { success: false, error: "Choose a subject offered by this tutor" };
	}
	if (!tutor.lessonDurations.includes(parsed.data.durationMinutes)) {
		return {
			success: false,
			error: "Choose one of the tutor's lesson durations",
		};
	}

	// Re-validate the chosen slot on the server (never trust client state):
	// lead time, availability-window fit, and existing bookings all apply.
	const startMs = Date.parse(parsed.data.startUtc);
	const endMs = startMs + parsed.data.durationMinutes * 60_000;
	const busy = await getUpcomingBusyIntervals(String(tutor._id));
	const availability = generateTutorSlotAvailability({
		rules: (tutor.availabilityRules ?? []).map((r) => ({
			dayOfWeek: r.dayOfWeek,
			startTime: r.startTime,
			endTime: r.endTime,
		})),
		durations: [parsed.data.durationMinutes],
		timeZone: tutor.timezone || "UTC",
		busyIntervals: busy,
	});
	if (
		!isSlotBookable(
			availability,
			parsed.data.durationMinutes,
			new Date(startMs).toISOString(),
		)
	) {
		return {
			success: false,
			error: "That time slot is no longer available. Please pick another.",
		};
	}

	// Belt-and-braces conflict check against concurrent bookings.
	if (
		await findConflictingBooking(
			String(tutor._id),
			new Date(startMs),
			new Date(endMs),
		)
	) {
		return {
			success: false,
			error: "Someone just booked this slot. Please pick another.",
		};
	}

	const priceAmount =
		Math.round(
			(((tutor.hourlyRate ?? 0) * parsed.data.durationMinutes) / 60) * 100,
		) / 100;
	const priceCurrency = tutor.currency ?? "USD";

	let checkoutUrl: string | undefined;

	if (isStripeConfigured()) {
		const stripe = getStripe();
		if (!stripe) {
			return { success: false, error: "Payment provider unavailable" };
		}

		const booking = await Booking.create({
			tutorId: tutor.userId,
			tutorProfileId: String(tutor._id),
			tutorName: tutor.userName,
			tutorSlug: tutor.slug,
			studentId: session.user.id,
			studentName: session.user.name ?? "",
			studentEmail: session.user.email ?? "",
			subject: parsed.data.subject,
			durationMinutes: parsed.data.durationMinutes,
			startTime: new Date(startMs),
			endTime: new Date(endMs),
			status: "pending_payment",
			priceAmount,
			priceCurrency,
		});

		const paymentSession = await stripe.checkout.sessions.create({
			mode: "payment",
			customer_email: session.user.email ?? undefined,
			line_items: [
				{
					quantity: 1,
					price_data: {
						currency: priceCurrency.toLowerCase(),
						unit_amount: Math.round(priceAmount * 100),
						product_data: {
							name: `${parsed.data.subject} lesson with ${tutor.userName}`,
							description: `${parsed.data.durationMinutes} minutes · ${new Date(startMs).toUTCString()}`,
						},
					},
				},
			],
			metadata: { bookingId: String(booking._id) },
			success_url: `${appUrl()}/dashboard/bookings?payment=success`,
			cancel_url: `${appUrl()}/tutors/${tutor.slug}?payment=cancelled`,
		});

		checkoutUrl = paymentSession.url ?? undefined;

		await Payment.create({
			bookingId: String(booking._id),
			studentId: session.user.id,
			stripeSessionId: paymentSession.id,
			amount: priceAmount,
			currency: priceCurrency,
			status: "pending",
		});

		if (!checkoutUrl) {
			return { success: false, error: "Could not start checkout" };
		}
	} else {
		// Dev/demo mode: Stripe not configured — confirm instantly without payment.
		console.warn(
			"[bookings] STRIPE_SECRET_KEY not set — confirming booking without payment.",
		);
		await Booking.create({
			tutorId: tutor.userId,
			tutorProfileId: String(tutor._id),
			tutorName: tutor.userName,
			tutorSlug: tutor.slug,
			studentId: session.user.id,
			studentName: session.user.name ?? "",
			studentEmail: session.user.email ?? "",
			subject: parsed.data.subject,
			durationMinutes: parsed.data.durationMinutes,
			startTime: new Date(startMs),
			endTime: new Date(endMs),
			status: "confirmed",
			priceAmount,
			priceCurrency,
		});
	}

	revalidatePath(`/tutors/${tutor.slug}`);
	revalidatePath("/dashboard/bookings");
	return { success: true, ...(checkoutUrl ? { checkoutUrl } : {}) };
}

/** Re-open checkout for an unpaid booking whose session expired or was abandoned. */
export async function payBooking(bookingId: string): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };

	await connectDB();
	const booking = await Booking.findOne({ _id: bookingId });
	if (!booking) return { success: false, error: "Booking not found" };
	if (booking.studentId !== session.user.id) {
		return { success: false, error: "You are not part of this booking" };
	}
	if (booking.status !== "pending_payment") {
		return { success: false, error: "This booking does not need payment" };
	}

	const stripe = getStripe();
	if (!stripe) return { success: false, error: "Payments are not configured" };

	const paymentSession = await stripe.checkout.sessions.create({
		mode: "payment",
		customer_email: session.user.email ?? undefined,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: (booking.priceCurrency ?? "USD").toLowerCase(),
					unit_amount: Math.round(booking.priceAmount * 100),
					product_data: {
						name: `${booking.subject} lesson with ${booking.tutorName}`,
						description: `${booking.durationMinutes} minutes · ${new Date(booking.startTime).toUTCString()}`,
					},
				},
			},
		],
		metadata: { bookingId: String(booking._id) },
		success_url: `${appUrl()}/dashboard/bookings?payment=success`,
		cancel_url: `${appUrl()}/dashboard/bookings?payment=cancelled`,
	});

	await Payment.findOneAndUpdate(
		{ bookingId, status: "pending" },
		{ $set: { stripeSessionId: paymentSession.id } },
	);

	revalidatePath("/dashboard/bookings");
	if (!paymentSession.url) {
		return { success: false, error: "Could not start checkout" };
	}
	return { success: true, checkoutUrl: paymentSession.url };
}

export async function cancelBooking(
	bookingId: string,
	reason?: string,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };

	const parsed = cancelBookingSchema.safeParse({ bookingId, reason });
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid cancellation",
		};
	}

	await connectDB();
	const booking = await Booking.findOne({ _id: parsed.data.bookingId });
	if (!booking) return { success: false, error: "Booking not found" };

	const isStudent = booking.studentId === session.user.id;
	const isTutor = booking.tutorId === session.user.id;
	if (!isStudent && !isTutor) {
		return { success: false, error: "You are not part of this booking" };
	}
	if (booking.status !== "confirmed" && booking.status !== "pending_payment") {
		return {
			success: false,
			error: "Only confirmed or unpaid lessons can be cancelled",
		};
	}

	booking.status = isStudent ? "cancelled_by_student" : "cancelled_by_tutor";
	booking.cancelledAt = new Date();
	booking.cancellationReason = parsed.data.reason ?? "";
	await booking.save();

	revalidatePath("/dashboard/bookings");
	return { success: true };
}

/** Server-side fetch used by dashboard pages. */
export async function listMyBookings(): Promise<BookingDTO[]> {
	const session = await getSession();
	if (!session) return [];
	if (session.user.role === "tutor") {
		const { getBookingsForTutor } = await import("@/lib/bookings");
		return getBookingsForTutor(session.user.id);
	}
	const { getBookingsForStudent } = await import("@/lib/bookings");
	return getBookingsForStudent(session.user.id);
}
