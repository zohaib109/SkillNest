import mongoose, { type InferSchemaType, Schema } from "mongoose";

/**
 * TutorProfile — tutor-specific public & operational data.
 *
 * Note: the authoritative user identity lives in Better Auth's `user` collection
 * (native MongoDB driver). We denormalize `userName`/`userEmail` here so admin
 * moderation views don't require a cross-collection lookup.
 */

const availabilityRuleSchema = new Schema(
	{
		dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
		startTime: { type: String, required: true }, // "HH:mm"
		endTime: { type: String, required: true }, // "HH:mm"
	},
	{ _id: false },
);

const tutorProfileSchema = new Schema(
	{
		userId: { type: String, required: true, unique: true, index: true },
		userName: { type: String, default: "" },
		userEmail: { type: String, default: "" },
		photoUrl: { type: String, default: "" },
		slug: { type: String, required: true, unique: true, index: true },
		headline: { type: String, default: "" },
		bio: { type: String, default: "" },
		subjects: { type: [String], default: [] },
		languages: { type: [String], default: [] },
		hourlyRate: { type: Number, default: 0 },
		currency: { type: String, default: "USD" },
		introVideoUrl: { type: String, default: "" },
		country: { type: String, default: "" },
		timezone: { type: String, default: "" },
		lessonDurations: { type: [Number], default: [] },
		availabilityRules: { type: [availabilityRuleSchema], default: [] },
		status: {
			type: String,
			enum: ["draft", "pending_review", "approved", "rejected"],
			default: "draft",
			index: true,
		},
		isApproved: { type: Boolean, default: false, index: true },
		approvedAt: { type: Date, default: null },
		approvedBy: { type: String, default: "" },
		rejectionReason: { type: String, default: "" },
		ratingAverage: { type: Number, default: 0 },
		reviewCount: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

export type TutorProfileDoc = InferSchemaType<typeof tutorProfileSchema>;

export const TutorProfile =
	(mongoose.models.TutorProfile as mongoose.Model<TutorProfileDoc>) ??
	mongoose.model<TutorProfileDoc>("TutorProfile", tutorProfileSchema);
