import mongoose, { type InferSchemaType, Schema } from "mongoose";

/**
 * Payment — ledger record for money movement against a Booking.
 *
 * One booking has at most one active payment record; retried checkouts reuse
 * it (stripeSessionId is updated). Stripe webhook events are the only writer
 * of terminal states (paid / failed / refunded) for reconciliation safety.
 */
const paymentSchema = new Schema(
	{
		bookingId: { type: String, required: true, index: true },
		studentId: { type: String, required: true },

		stripeSessionId: { type: String, index: true },
		stripePaymentIntentId: { type: String, default: "" },

		amount: { type: Number, required: true },
		currency: { type: String, required: true },

		status: {
			type: String,
			enum: ["pending", "paid", "failed", "refunded"],
			default: "pending",
			index: true,
		},
		paidAt: { type: Date, default: null },
	},
	{ timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof paymentSchema>;

export const Payment =
	(mongoose.models.Payment as mongoose.Model<PaymentDoc>) ??
	mongoose.model<PaymentDoc>("Payment", paymentSchema);
