import "server-only";
import { connectDB } from "@/lib/db";
import type {
	practiceResponse,
	recapInput,
} from "@/lib/validators/lesson-notes";
import { Booking } from "@/models/Booking";

const teachingStatuses = ["confirmed", "completed"] as const;

/** The tutor attests delivery. A learning note never releases money or marks a booking completed. */
export async function publishLessonRecap(
	tutorId: string,
	bookingId: string,
	input: ReturnType<typeof recapInput.parse>,
) {
	await connectDB();
	const eligible = {
		_id: bookingId,
		tutorId,
		status: { $in: teachingStatuses },
		endsAt: { $lte: new Date() },
	};
	const result = await Booking.updateOne(
		{ ...eligible, "recap.publishedAt": { $exists: false } },
		{ $set: { recap: { ...input, publishedAt: new Date() } } },
	);
	if (result.modifiedCount) return true;
	// Identical retried publication succeeds without resetting the learner's response.
	return Boolean(
		await Booking.exists({
			...eligible,
			"recap.practised": input.practised,
			"recap.exercise": input.exercise,
			"recap.resource": input.resource,
		}),
	);
}

export async function recordPracticeResponse(
	studentId: string,
	bookingId: string,
	response: ReturnType<typeof practiceResponse.parse>,
) {
	await connectDB();
	const result = await Booking.updateOne(
		{
			_id: bookingId,
			studentId,
			status: { $in: teachingStatuses },
			"recap.publishedAt": { $exists: true },
		},
		{ $set: { practiceResponse: response } },
	);
	return result.matchedCount === 1;
}

export async function lastPracticeWithTutor(
	studentId: string,
	tutorId: string,
) {
	await connectDB();
	const last = await Booking.findOne({
		studentId,
		tutorId,
		status: { $in: teachingStatuses },
		"recap.publishedAt": { $exists: true },
	})
		.sort({ endsAt: -1, _id: -1 })
		.select("recap.exercise -_id")
		.lean<{ recap?: { exercise: string } }>();
	return last?.recap?.exercise ?? null;
}
