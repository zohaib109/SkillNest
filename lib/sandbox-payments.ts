import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod/v4";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { MARKETPLACE_POLICIES } from "@/lib/policies";
import { allowsSandboxPayments } from "@/lib/sandbox-payment-config";
import { bookingIdSchema } from "@/lib/validators/booking";
import { Booking, StudentBookingLock } from "@/models/Booking";
import { LedgerEntry, Payment, PaymentEvent } from "@/models/Payment";
import { TutorProfile } from "@/models/TutorProfile";

const eventSchema = z.object({
	id: z.string().regex(/^[a-z\d:_-]{1,100}$/),
	paymentId: bookingIdSchema,
	kind: z.enum(["succeeded", "failed"]),
	amountMinor: z.number().int().positive().max(1_500_000),
	currency: z.string().regex(/^[A-Z]{3}$/),
});
type SandboxEvent = z.infer<typeof eventSchema>;

export function sandboxPaymentsEnabled() {
	return allowsSandboxPayments({
		enabled: process.env.SKILLNEST_ENABLE_SANDBOX_PAYMENTS,
		nodeEnv: process.env.NODE_ENV,
		mongoUri: env.MONGODB_URI,
		authUrl: env.BETTER_AUTH_URL,
	});
}

export function signSandboxPaymentEvent(body: string) {
	const key = createHmac("sha256", env.BETTER_AUTH_SECRET)
		.update("skillnest sandbox payment signing v1")
		.digest();
	return createHmac("sha256", key).update(body).digest("hex");
}

function verifySandboxPaymentEvent(body: string, signature: string) {
	if (
		body.length > 1024 ||
		!/^[a-f\d]{64}$/.test(signature) ||
		!timingSafeEqual(
			Buffer.from(signature, "hex"),
			Buffer.from(signSandboxPaymentEvent(body), "hex"),
		)
	)
		return null;
	try {
		const parsed = eventSchema.safeParse(JSON.parse(body));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

/** Server-side adapter boundary. A browser never supplies a capture or signature. */
export async function recordSandboxPaymentEvent(
	body: string,
	signature: string,
) {
	if (!sandboxPaymentsEnabled()) return null;
	const event = verifySandboxPaymentEvent(body, signature);
	if (!event) return null;
	const { connection } = await connectDB();
	await PaymentEvent.init();
	await LedgerEntry.init();
	return connection.transaction(
		async (session) => {
			// Serialize deliveries for this intent and reread the event after the lock.
			const payment = await Payment.findOneAndUpdate(
				{ _id: event.paymentId, mode: "sandbox" },
				{ $inc: { sequence: 1 } },
				{ session, timestamps: false },
			).lean();
			if (!payment) return null;
			const previous = await PaymentEvent.findById(event.id)
				.session(session)
				.lean();
			if (previous) {
				return previous.paymentId.equals(payment._id) &&
					previous.kind === event.kind &&
					previous.amountMinor === event.amountMinor &&
					previous.currency === event.currency
					? previous.outcome
					: null;
			}
			const booking = await Booking.findById(payment._id)
				.session(session)
				.lean();
			if (!booking) throw new Error("Payment intent has no booking");

			let outcome:
				| "confirmed"
				| "failed"
				| "ignored"
				| "refund_required"
				| "amount_mismatch" = "ignored";
			let status = payment.status;
			if (
				payment.amountMinor !== event.amountMinor ||
				payment.currency !== event.currency
			) {
				outcome = "amount_mismatch";
			} else if (
				payment.status !== "captured" &&
				payment.status !== "refund_required"
			) {
				if (event.kind === "failed") {
					outcome = "failed";
					status = "failed";
				} else {
					// Use the same participant write locks as hold creation before
					// extending an unpaid hold into an indefinite reservation.
					const tutorLock = await TutorProfile.updateOne(
						{ _id: booking.tutorProfileId, userId: booking.tutorId },
						{ $inc: { bookingSequence: 1 } },
						{ session, timestamps: false },
					);
					const studentLock = await StudentBookingLock.updateOne(
						{ _id: booking.studentId },
						{ $inc: { sequence: 1 } },
						{ session },
					);
					const now = new Date();
					const confirmed =
						tutorLock.matchedCount &&
						studentLock.matchedCount &&
						(await Booking.findOneAndUpdate(
							{
								_id: booking._id,
								status: "held",
								holdExpiresAt: { $gt: now },
								startsAt: { $gt: now },
								amountMinor: payment.amountMinor,
								currency: payment.currency,
							},
							{
								$set: {
									status: "confirmed",
									confirmedAt: now,
									paymentMode: "sandbox",
								},
							},
							{ session },
						));
					outcome = confirmed ? "confirmed" : "refund_required";
					status = confirmed ? "captured" : "refund_required";
					if (confirmed) {
						const commission = Math.round(
							(payment.amountMinor * payment.commissionBasisPoints) / 10_000,
						);
						const common = {
							paymentId: payment._id,
							mode: "sandbox" as const,
							tutorId: booking.tutorId,
							currency: payment.currency,
							recordedAt: now,
						};
						await LedgerEntry.insertMany(
							[
								{
									...common,
									_id: `${payment._id}:commission`,
									kind: "platform_commission",
									amountMinor: commission,
								},
								{
									...common,
									_id: `${payment._id}:earning`,
									kind: "pending_tutor_earning",
									amountMinor: payment.amountMinor - commission,
								},
							],
							{ session },
						);
					}
				}
			}
			if (status !== payment.status)
				await Payment.updateOne(
					{ _id: payment._id },
					{ $set: { status } },
					{ session },
				);
			await new PaymentEvent({
				_id: event.id,
				paymentId: payment._id,
				mode: "sandbox",
				kind: event.kind,
				outcome,
				amountMinor: event.amountMinor,
				currency: event.currency,
				verifiedAt: new Date(),
			}).save({ session });
			return outcome;
		},
		{ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } },
	);
}

export async function simulateLessonPayment(
	studentId: string,
	bookingId: string,
	kind: SandboxEvent["kind"] = "succeeded",
) {
	if (!sandboxPaymentsEnabled()) return null;
	await connectDB();
	const booking = await Booking.findOne({
		_id: bookingId,
		studentId,
		$or: [
			{ status: "held", holdExpiresAt: { $gt: new Date() } },
			{ status: "confirmed", paymentMode: "sandbox" },
		],
	}).lean();
	if (!booking) return null;
	const payment = await Payment.findOneAndUpdate(
		{ _id: booking._id },
		{
			$setOnInsert: {
				mode: "sandbox",
				amountMinor: booking.amountMinor,
				currency: booking.currency,
				commissionBasisPoints:
					MARKETPLACE_POLICIES.platformCommissionBasisPoints,
				status: "pending",
			},
		},
		{ upsert: true, returnDocument: "after" },
	).lean();
	if (!payment) throw new Error("Payment intent was not created");
	const event: SandboxEvent = {
		id: `${payment._id}:${kind}`,
		paymentId: String(payment._id),
		kind,
		amountMinor: payment.amountMinor,
		currency: payment.currency,
	};
	const body = JSON.stringify(event);
	return recordSandboxPaymentEvent(body, signSandboxPaymentEvent(body));
}
