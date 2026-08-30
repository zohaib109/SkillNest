import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { Booking } from "@/models/Booking";
import { Payment } from "@/models/Payment";

/**
 * Stripe webhook endpoint — the single source of truth for payment state.
 *
 * Follows official guidance:
 * - Verify signatures against the RAW body before any parsing.
 * - Return 2xx quickly; do heavy work after accepting.
 * - Treat every event as potentially duplicated or out-of-order: handlers are
 *   idempotent state transitions that no-op when already applied.
 */

export async function POST(request: Request) {
	const stripe = getStripe();
	if (!stripe) {
		return new NextResponse("Stripe not configured", { status: 503 });
	}
	if (!env.STRIPE_WEBHOOK_SECRET) {
		console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
		return new NextResponse("Webhook secret not configured", { status: 503 });
	}

	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return new NextResponse("Missing stripe-signature header", { status: 400 });
	}

	let event: Stripe.Event;
	try {
		// Raw text body is required for signature verification.
		const payload = await request.text();
		event = stripe.webhooks.constructEvent(
			payload,
			signature,
			env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (err) {
		console.error("[stripe-webhook] Signature verification failed:", err);
		return new NextResponse("Invalid signature", { status: 400 });
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const checkoutSession = event.data.object;
			await handleCheckoutCompleted(checkoutSession);
			break;
		}
		case "checkout.session.expired":
		case "checkout.session.async_payment_failed": {
			const checkoutSession = event.data.object;
			await handleCheckoutAbandoned(checkoutSession.id);
			break;
		}
		case "charge.refunded": {
			const charge = event.data.object;
			await handleRefunded(charge.payment_intent as string | null);
			break;
		}
		default:
			// Intentionally unhandled — log at debug level only.
			break;
	}

	return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
	checkoutSession: Stripe.Checkout.Session,
) {
	await connectDB();

	const paymentIntentId =
		typeof checkoutSession.payment_intent === "string"
			? checkoutSession.payment_intent
			: (checkoutSession.payment_intent?.id ?? "");

	const payment = await Payment.findOne({
		stripeSessionId: checkoutSession.id,
	});
	if (!payment || payment.status === "paid") return; // duplicate / unknown — no-op

	payment.status = "paid";
	payment.paidAt = new Date();
	if (paymentIntentId) payment.stripePaymentIntentId = paymentIntentId;
	await payment.save();

	await Booking.updateOne(
		{
			_id: payment.bookingId,
			status: "pending_payment",
			paymentStatus: "unpaid",
		},
		{ $set: { status: "confirmed", paymentStatus: "paid" } },
	);

	revalidateBookingPaths(payment.bookingId);
}

async function handleCheckoutAbandoned(stripeSessionId: string) {
	await connectDB();
	const payment = await Payment.findOne({ stripeSessionId });
	if (payment?.status !== "pending") return;

	payment.status = "failed";
	await payment.save();

	await Booking.updateOne(
		{ _id: payment.bookingId, status: "pending_payment" },
		{
			$set: {
				status: "expired",
				cancelledAt: new Date(),
				cancellationReason: "Payment was not completed",
			},
		},
	);

	revalidateBookingPaths(payment.bookingId);
}

async function handleRefunded(paymentIntentId: string | null) {
	if (!paymentIntentId) return;
	await connectDB();
	const payment = await Payment.findOne({
		stripePaymentIntentId: paymentIntentId,
	});
	if (payment?.status !== "paid") return;

	payment.status = "refunded";
	await payment.save();

	await Booking.updateOne(
		{ _id: payment.bookingId },
		{ $set: { paymentStatus: "refunded" } },
	);

	revalidateBookingPaths(payment.bookingId);
}

function revalidateBookingPaths(bookingId: unknown) {
	void import("next/cache").then(({ revalidatePath }) => {
		revalidatePath("/dashboard/bookings");
		if (typeof bookingId === "string" && bookingId) {
			revalidatePath(`/dashboard/bookings?booking=${bookingId}`);
		}
	});
}
