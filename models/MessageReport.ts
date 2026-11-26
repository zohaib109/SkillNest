import mongoose, { type InferSchemaType, Schema } from "mongoose";

const schema = new Schema(
	{
		_id: { type: String, required: true },
		bookingId: { type: Schema.Types.ObjectId, required: true },
		reporterId: { type: String, required: true },
		senderRole: { type: String, enum: ["student", "tutor"], required: true },
		excerpt: { type: String, required: true },
		reason: { type: String, required: true, maxlength: 300 },
		reviewedAt: Date,
		reviewedBy: String,
		decision: String,
	},
	{ timestamps: true },
);
schema.index({ reviewedAt: 1, createdAt: 1 });
export const MessageReport =
	(mongoose.models.MessageReport as mongoose.Model<
		InferSchemaType<typeof schema>
	>) ?? mongoose.model("MessageReport", schema);
