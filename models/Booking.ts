import mongoose, { type InferSchemaType, Schema } from "mongoose";

const recapSchema = new Schema(
	{
		practised: { type: String, required: true, maxlength: 400 },
		exercise: { type: String, required: true, maxlength: 300 },
		resource: { type: String, default: "", maxlength: 500 },
		publishedAt: { type: Date, required: true },
	},
	{ _id: false },
);

const messageSchema = new Schema(
	{
		key: { type: String, required: true },
		sender: { type: String, enum: ["student", "tutor"], required: true },
		body: { type: String, required: true, maxlength: 1000 },
		sentAt: { type: Date, required: true },
	},
	{ _id: false },
);

const incidentStatementSchema = new Schema(
	{
		role: { type: String, enum: ["student", "tutor"], required: true },
		reason: {
			type: String,
			enum: ["could_not_connect", "other_person_absent", "other"],
			required: true,
		},
		detail: { type: String, maxlength: 400, required: true },
		reportedAt: { type: Date, required: true },
	},
	{ _id: false },
);
const incidentDecisionSchema = new Schema(
	{
		revision: { type: Number, required: true },
		note: { type: String, required: true, maxlength: 400 },
		reviewedAt: { type: Date, required: true },
		reviewedBy: { type: String, required: true },
	},
	{ _id: false },
);

const bookingSchema = new Schema(
	{
		studentId: { type: String, required: true },
		messages: { type: [messageSchema], default: undefined, select: false },
		studentSent: { type: Number, default: 0 },
		tutorSent: { type: Number, default: 0 },
		studentLastSent: Date,
		studentCheckedInAt: Date,
		tutorCheckedInAt: Date,
		studentDeliveryConfirmedAt: Date,
		tutorDeliveryConfirmedAt: Date,
		sandboxReview: {
			type: new Schema(
				{
					score: { type: Number, required: true, min: 1, max: 5 },
					comment: { type: String, default: "", maxlength: 500 },
					submittedAt: { type: Date, required: true },
				},
				{ _id: false },
			),
			select: false,
		},
		incidentStatements: {
			type: [incidentStatementSchema],
			default: undefined,
			select: false,
		},
		incidentDecisions: {
			type: [incidentDecisionSchema],
			default: undefined,
			select: false,
		},
		incidentRevision: { type: Number, default: 0 },
		incidentPending: { type: Boolean, default: false },
		tutorLastSent: Date,
		studentRead: { type: Number, default: 0 },
		tutorRead: { type: Number, default: 0 },
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
		confirmedAt: Date,
		paymentMode: { type: String, enum: ["sandbox"] },
		cancelledAt: Date,
		goal: { type: String, maxlength: 300 },
		recap: recapSchema,
		practiceResponse: { type: String, enum: ["independent", "needs_help"] },
	},
	{ timestamps: true },
);

bookingSchema.index(
	{ incidentPending: 1, startsAt: 1 },
	{ partialFilterExpression: { incidentPending: true } },
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
