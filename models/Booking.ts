import mongoose, { type InferSchemaType, Schema } from "mongoose";

/**
 * Booking — a confirmed 1-on-1 lesson slot between a student and a tutor.
 *
 * Times are canonical UTC instants (`startTime`/`endTime`); the UI renders
 * them in each user's local timezone. Payments are not wired yet: bookings
 * start `paymentStatus: "unpaid"` and Stripe integration will flip that
 * without changing the lifecycle states.
 */
const bookingSchema = new Schema(
	{
		tutorId: { type: String, required: true, index: true },
		tutorProfileId: { type: String, required: true },
		tutorName: { type: String, default: "" },
		tutorSlug: { type: String, required: true },

		studentId: { type: String, required: true, index: true },
		studentName: { type: String, default: "" },
		studentEmail: { type: String, default: "" },

		subject: { type: String, required: true },
		durationMinutes: { type: Number, required: true },

		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },

		status: {
			type: String,
			enum: [
				"pending_payment",
				"confirmed",
				"completed",
				"expired",
				"cancelled_by_student",
				"cancelled_by_tutor",
			],
			default: "confirmed",
			index: true,
		},
		paymentStatus: {
			type: String,
			enum: ["unpaid", "paid", "refunded"],
			default: "unpaid",
		},

		priceAmount: { type: Number, required: true },
		priceCurrency: { type: String, default: "USD" },

		cancelledAt: { type: Date, default: null },
		cancellationReason: { type: String, default: "" },
	},
	{ timestamps: true },
);

bookingSchema.index({ tutorProfileId: 1, startTime: 1 });
bookingSchema.index({ studentId: 1, startTime: -1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema>;

export const Booking =
	(mongoose.models.Booking as mongoose.Model<BookingDoc>) ??
	mongoose.model<BookingDoc>("Booking", bookingSchema);
