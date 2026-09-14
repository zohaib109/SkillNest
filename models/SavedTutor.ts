import mongoose, { type InferSchemaType, Schema } from "mongoose";

const savedTutorSchema = new Schema(
	{
		studentId: { type: String, required: true, index: true },
		tutorProfileId: {
			type: Schema.Types.ObjectId,
			ref: "TutorProfile",
			required: true,
		},
	},
	{ timestamps: true },
);

savedTutorSchema.index(
	{ studentId: 1, tutorProfileId: 1 },
	{ unique: true, name: "unique_student_saved_tutor" },
);

export type SavedTutorDoc = InferSchemaType<typeof savedTutorSchema>;

export const SavedTutor =
	(mongoose.models.SavedTutor as mongoose.Model<SavedTutorDoc>) ??
	mongoose.model<SavedTutorDoc>("SavedTutor", savedTutorSchema);
