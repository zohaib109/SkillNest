import mongoose, { type InferSchemaType, Schema } from "mongoose";

/**
 * RefundRequest — student-initiated refund ticket reviewed manually by admins
 * (see decisions.md #4). Approval triggers a Stripe refund whose confirmation
 * arrives via the existing `charge.refunded` webhook handler.
 *
 * Lesson details are denormalized so the admin queue renders without joins.
 */
const refundRequestSchema = new Schema(
	{
		bookingId: { type: String, required: true, index: true },
		studentId: { type: String, required: true, index: true },

		// Denormalized snapshot for queue rendering
		tutorName: { type: String, default: "" },
		subject: { type: String, default: "" },
		lessonStart: { type: Date, required: true },
		amount: { type: Number, required: true },
		currency: { type: String, default: "USD" },

		reason: { type: String, required: true },

		status: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
			index: true,
		},
		adminNote: { type: String, default: "" },
		processedBy: { type: String, default: "" },
		processedAt: { type: Date, default: null },
	},
	{ timestamps: true },
);

refundRequestSchema.index({ status: 1, createdAt: -1 });
refundRequestSchema.index({ bookingId: 1, status: 1 });

export type RefundRequestDoc = InferSchemaType<typeof refundRequestSchema>;

export const RefundRequest =
	(mongoose.models.RefundRequest as mongoose.Model<RefundRequestDoc>) ??
	mongoose.model<RefundRequestDoc>("RefundRequest", refundRequestSchema);
