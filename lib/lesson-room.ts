import "server-only";
import { type Participant, participantScope } from "@/lib/booking-participants";
import { connectDB } from "@/lib/db";
import { Booking } from "@/models/Booking";

const early = 10 * 60000;
const late = 15 * 60000;
export const issueReasons = {
	could_not_connect: "Connection trouble",
	other_person_absent: "The other person did not join",
	other: "Another lesson problem",
} as const;
export async function roomFor(id: string, actor: Participant) {
	await connectDB();
	const doc = await Booking.findOne(participantScope(id, actor))
		.select(
			"status startsAt endsAt tutorName studentCheckedInAt tutorCheckedInAt incidentPending +incidentStatements +incidentDecisions",
		)
		.lean();
	if (!doc) return null;
	const opens = new Date(+doc.startsAt - early),
		closes = new Date(+doc.endsAt + late),
		now = new Date();
	return {
		tutorName: doc.tutorName,
		startsAt: doc.startsAt,
		opens,
		closes,
		canCheckIn: doc.status === "confirmed" && now >= opens && now < closes,
		canReport:
			now >= opens &&
			(doc.status === "confirmed" ||
				doc.status === "completed" ||
				!!doc.incidentStatements?.length),
		ownStatement: doc.incidentStatements?.find((v) => v.role === actor.role),
		otherReported: doc.incidentStatements?.some((v) => v.role !== actor.role),
		pending: doc.incidentPending,
		decision: doc.incidentDecisions?.at(-1)?.note,
		studentCheckIn: doc.studentCheckedInAt,
		tutorCheckIn: doc.tutorCheckedInAt,
	};
}

export async function checkIn(id: string, actor: Participant) {
	await connectDB();
	const now = new Date(),
		field =
			actor.role === "student" ? "studentCheckedInAt" : "tutorCheckedInAt";
	const eligible = {
		...participantScope(id, actor),
		status: "confirmed" as const,
		startsAt: { $lte: new Date(+now + early) },
		endsAt: { $gt: new Date(+now - late) },
	};
	const result = await Booking.updateOne(
		{ ...eligible, [field]: { $exists: false } },
		{ $set: { [field]: now } },
	);
	return (
		!!result.modifiedCount ||
		Boolean(await Booking.exists({ ...eligible, [field]: { $exists: true } }))
	);
}

export async function openLessonIssue(
	id: string,
	actor: Participant,
	reason: keyof typeof issueReasons,
	detail: string,
) {
	await connectDB();
	const scope = participantScope(id, actor),
		now = new Date();
	const result = await Booking.updateOne(
		{
			...scope,
			startsAt: { $lte: new Date(+now + early) },
			$or: [
				{ status: { $in: ["confirmed", "completed"] } },
				{ incidentRevision: { $gt: 0 } },
			],
			"incidentStatements.role": { $ne: actor.role },
		},
		{
			$push: {
				incidentStatements: {
					role: actor.role,
					reason,
					detail,
					reportedAt: now,
				},
			},
			$inc: { incidentRevision: 1 },
			$set: { incidentPending: true },
		},
	);
	return (
		!!result.modifiedCount ||
		Boolean(
			await Booking.exists({
				...scope,
				incidentStatements: {
					$elemMatch: { role: actor.role, reason, detail },
				},
			}),
		)
	);
}

export async function pendingLessonIssues() {
	await connectDB();
	return Booking.find({ incidentPending: true })
		.sort({ startsAt: 1 })
		.limit(50)
		.select(
			"startsAt tutorName studentCheckedInAt tutorCheckedInAt incidentRevision +incidentStatements +incidentDecisions",
		)
		.lean();
}

export async function reviewLessonIssue(
	id: string,
	adminId: string,
	revision: number,
	note: string,
) {
	await connectDB();
	const result = await Booking.updateOne(
		{ _id: id, incidentPending: true, incidentRevision: revision },
		{
			$set: { incidentPending: false },
			$push: {
				incidentDecisions: {
					revision,
					note,
					reviewedBy: adminId,
					reviewedAt: new Date(),
				},
			},
		},
	);
	return result.modifiedCount === 1;
}
