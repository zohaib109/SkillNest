"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { isAdminSession } from "@/lib/permissions";
import { getStripe } from "@/lib/stripe";
import type { RefundRequestDTO, RefundStatus } from "@/lib/types";
import { z } from "zod/v4";
import { Booking } from "@/models/Booking";
import { Payment } from "@/models/Payment";
import { RefundRequest } from "@/models/RefundRequest";

type ActionResult = { success: true } | { success: false; error: string };

const requestRefundSchema = z.object({
	bookingId: z.string().min(1),
	reason: z
		.string()
		.trim()
		.min(10, "Tell us briefly what went wrong (at least 10 characters)")
		.max(1000, "Reason is too long"),
});

const decideRefundSchema = z.object({
	requestId: z.string().min(1),
	decision: z.enum(["approved", "rejected"]),
	note: z.string().trim().max(500).optional(),
});

function serialize(doc: {
	_id: unknown;
	bookingId: string;
	studentId: string;
	tutorName?: string;
	subject?: string;
	lessonStart: Date;
	amount: number;
	currency?: string;
	reason: string;
	status: string;
	adminNote?: string;
	processedBy?: string;
	processedAt?: Date | null;
	createdAt?: Date;
}): RefundRequestDTO {
	return {
		id: String(doc._id),
		bookingId: doc.bookingId,
		studentId: doc.studentId,
		tutorName: doc.tutorName ?? "",
		subject: doc.subject ?? "",
		lessonStart: new Date(doc.lessonStart).toISOString(),
		amount: doc.amount,
		currency: doc.currency ?? "USD",
		reason: doc.reason,
		status: doc.status as RefundStatus,
		adminNote: doc.adminNote ?? "",
		processedBy: doc.processedBy ?? "",
		processedAt: doc.processedAt ? new Date(doc.processedAt).toISOString() : "",
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
	};
}

export async function requestRefund(
	bookingId: string,
	reason: string,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };

	const parsed = requestRefundSchema.safeParse({ bookingId, reason });
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid refund request",
		};
	}

	await connectDB();
	const booking = await Booking.findOne({ _id: parsed.data.bookingId });
	if (!booking) return { success: false, error: "Booking not found" };
	if (booking.studentId !== session.user.id) {
		return { success: false, error: "You are not part of this booking" };
	}
	if (booking.paymentStatus !== "paid" || booking.status !== "confirmed") {
		return { success: false, error: "Only paid upcoming lessons can be refunded" };
	}
	if (new Date(booking.startTime).getTime() <= Date.now()) {
		return { success: false, error: "This lesson has already started" };
	}

	const existing = await RefundRequest.exists({
		bookingId: parsed.data.bookingId,
		status: "pending",
	});
	if (existing) {
		return { success: false, error: "A refund request is already under review" };
	}

	await RefundRequest.create({
		bookingId: parsed.data.bookingId,
		studentId: session.user.id,
		tutorName: booking.tutorName,
		subject: booking.subject,
		lessonStart: booking.startTime,
		amount: booking.priceAmount,
		currency: booking.priceCurrency,
		reason: parsed.data.reason,
	});

	revalidatePath("/dashboard/bookings");
	return { success: true };
}

export async function decideRefund(
	requestId: string,
	decision: "approved" | "rejected",
	note?: string,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session || !isAdminSession(session)) {
		return { success: false, error: "Forbidden" };
	}

	const parsed = decideRefundSchema.safeParse({ requestId, decision, note });
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid refund decision",
		};
	}

	await connectDB();
	const request = await RefundRequest.findOne({ _id: parsed.data.requestId });
	if (!request) return { success: false, error: "Refund request not found" };
	if (request.status !== "pending") {
		return { success: false, error: "This request has already been handled" };
	}

	if (parsed.data.decision === "approved") {
		const payment = await Payment.findOne({
			bookingId: request.bookingId,
			status: "paid",
		});
		if (!payment?.stripePaymentIntentId) {
			return {
				success: false,
				error:
					"No Stripe payment found for this booking — process manually and reject this ticket with a note.",
			};
		}
		const stripe = getStripe();
		if (!stripe) return { success: false, error: "Payments are not configured" };

		try {
			await stripe.refunds.create({
				payment_intent: payment.stripePaymentIntentId,
				metadata: { refundRequestId: String(request._id) },
			});
		} catch (err) {
			console.error("[refunds] Stripe refund failed:", err);
			return {
				success: false,
				error: "Stripe rejected the refund. Check the dashboard and try again.",
			};
		}

		// The `charge.refunded` webhook flips payment/booking payment status.
		// Release the calendar slot here so the lesson no longer blocks others.
		await Booking.updateOne(
			{ _id: request.bookingId, status: "confirmed" },
			{
				$set: {
					status: "cancelled_by_student",
					cancelledAt: new Date(),
					cancellationReason: "Lesson refunded by platform",
				},
			},
		);
	} else {
		// Rejected: nothing further to do; the webhook never fires.
	}

	request.status = parsed.data.decision;
	request.adminNote = parsed.data.note ?? "";
	request.processedBy = session.user.id;
	request.processedAt = new Date();
	await request.save();

	revalidatePath("/dashboard/admin/refunds");
	revalidatePath("/dashboard/bookings");
	return { success: true };
}

/** All refund requests for the admin queue (pending first, newest first). */
export async function listRefundRequests(): Promise<RefundRequestDTO[]> {
	const session = await getSession();
	if (!session || !isAdminSession(session)) return [];
	await connectDB();
	const docs = await RefundRequest.find()
		.sort({ createdAt: -1 })
		.limit(200)
		.lean();
	return docs.map((d) => serialize(d));
}

/** Refund requests belonging to one student (for booking cards). */
export async function listMyRefundRequests(): Promise<RefundRequestDTO[]> {
	const session = await getSession();
	if (!session) return [];
	await connectDB();
	const docs = await RefundRequest.find({ studentId: session.user.id })
		.sort({ createdAt: -1 })
		.limit(100)
		.lean();
	return docs.map((d) => serialize(d));
}
