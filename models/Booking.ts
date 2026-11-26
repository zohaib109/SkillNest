import mongoose, { type InferSchemaType, Schema } from "mongoose";

const bookingSchema = new Schema(
	{
		studentId: { type: String, required: true },
		tutorId: { type: String, required: true },
		tutorProfileId: { type: Schema.Types.ObjectId, required: true },
		tutorName: { type: String, required: true },
		startsAt: { type: Date, required: true },
		endsAt: { type: Date, required: true },
		blockedUntil: { type: Date, required: true },
		duration: { type: Number, required: true },
		tutorTimezone: { type: String, required: true },
		studentTimezone: { type: String, required: true },
		amountMinor: { type: Number, required: true },
		currency: { type: String, required: true },
		status: {
			type: String,
			required: true,
			enum: ["held", "confirmed", "cancelled", "completed"],
		},
		holdExpiresAt: { type: Date, required: true },
		cancelledAt: Date,
	},
	{ timestamps: true },
);

bookingSchema.index({ tutorId: 1, startsAt: 1, blockedUntil: 1 });
bookingSchema.index({ studentId: 1, startsAt: -1 });
bookingSchema.index({ studentId: 1, status: 1, holdExpiresAt: 1 });

// Hold expiry is checked by each operation. Preserve the booking for audit and
// late-payment reconciliation, including after its unpaid hold expires.
export type BookingDoc = InferSchemaType<typeof bookingSchema>;
export const Booking =
	(mongoose.models.Booking as mongoose.Model<BookingDoc>) ??
	mongoose.model<BookingDoc>("Booking", bookingSchema);

const studentBookingLockSchema = new Schema(
	{
		_id: { type: String, required: true },
		sequence: { type: Number, required: true },
	},
	{ versionKey: false },
);

export const StudentBookingLock =
	(mongoose.models.StudentBookingLock as mongoose.Model<
		InferSchemaType<typeof studentBookingLockSchema>
	>) ?? mongoose.model("StudentBookingLock", studentBookingLockSchema);
