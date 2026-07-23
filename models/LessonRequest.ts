import mongoose, { type InferSchemaType, Schema } from "mongoose";

/**
 * A lightweight pre-booking request. It deliberately contains no payment,
 * meeting, or messaging state: those belong to later product phases.
 */
const lessonRequestSchema = new Schema(
	{
		tutorId: { type: String, required: true, index: true },
		tutorProfileId: { type: String, required: true },
		tutorName: { type: String, default: "" },
		tutorSlug: { type: String, required: true },
		studentId: { type: String, required: true, index: true },
		studentName: { type: String, default: "" },
		studentEmail: { type: String, default: "" },
		subject: { type: String, required: true },
		duration: { type: Number, required: true },
		preferredSchedule: { type: String, required: true },
		message: { type: String, required: true },
		status: {
			type: String,
			enum: ["pending", "accepted", "declined"],
			default: "pending",
			index: true,
		},
		respondedAt: { type: Date, default: null },
	},
	{ timestamps: true },
);

lessonRequestSchema.index({ tutorId: 1, status: 1, createdAt: -1 });
lessonRequestSchema.index({ studentId: 1, createdAt: -1 });

export type LessonRequestDoc = InferSchemaType<typeof lessonRequestSchema>;

export const LessonRequest =
	(mongoose.models.LessonRequest as mongoose.Model<LessonRequestDoc>) ??
	mongoose.model<LessonRequestDoc>("LessonRequest", lessonRequestSchema);
