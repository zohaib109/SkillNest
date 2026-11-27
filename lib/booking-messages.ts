import "server-only";

import { type Participant, participantScope } from "@/lib/booking-participants";
import { connectDB } from "@/lib/db";
import { Booking, type BookingDoc } from "@/models/Booking";
import { MessageReport } from "@/models/MessageReport";

const pageSize = 20;
const limitPerParticipant = 60;
export async function readThread(
	id: string,
	actor: Participant,
	before?: number,
) {
	await connectDB();
	const count = before === undefined ? pageSize : Math.min(pageSize, before);
	const slice: number | [number, number] =
		before === undefined ? -pageSize : [before - count, count];
	const doc = await Booking.findOne(participantScope(id, actor), {
		messages: { $slice: slice },
		studentSent: 1,
		tutorSent: 1,
		studentRead: 1,
		tutorRead: 1,
		status: 1,
		startsAt: 1,
		endsAt: 1,
		tutorName: 1,
	}).lean<
		Pick<
			BookingDoc,
			| "messages"
			| "studentSent"
			| "tutorSent"
			| "studentRead"
			| "tutorRead"
			| "status"
			| "startsAt"
			| "endsAt"
			| "tutorName"
		>
	>();
	if (!doc) return null;
	const total = (doc.studentSent ?? 0) + (doc.tutorSent ?? 0);
	const end = Math.min(before ?? total, total);
	const peerCount =
		actor.role === "student" ? (doc.tutorSent ?? 0) : (doc.studentSent ?? 0);
	const read =
		actor.role === "student" ? (doc.studentRead ?? 0) : (doc.tutorRead ?? 0);
	return {
		messages: doc.messages ?? [],
		older: Math.max(0, end - pageSize),
		peerCount,
		unread: Math.max(0, peerCount - read),
		startsAt: doc.startsAt,
		tutorName: doc.tutorName,
		canSend:
			(doc.status === "confirmed" || doc.status === "completed") &&
			doc.endsAt.getTime() + 86_400_000 > Date.now(),
	};
}

export async function sendThreadMessage(
	id: string,
	actor: Participant,
	nonce: string,
	body: string,
) {
	await connectDB();
	const scope = participantScope(id, actor);
	const key = `${actor.role}-${nonce}`;
	const counter = actor.role === "student" ? "studentSent" : "tutorSent";
	const last = actor.role === "student" ? "studentLastSent" : "tutorLastSent";
	const now = new Date();
	// Serialize the booking, the sender's budget and the message in one update.
	const result = await Booking.updateOne(
		{
			...scope,
			status: { $in: ["confirmed", "completed"] },
			endsAt: { $gt: new Date(+now - 86_400_000) },
			"messages.key": { $ne: key },
			$and: [
				{
					$or: [
						{ [counter]: { $exists: false } },
						{ [counter]: { $lt: limitPerParticipant } },
					],
				},
				{
					$or: [
						{ [last]: { $exists: false } },
						{ [last]: { $lte: new Date(+now - 2000) } },
					],
				},
			],
		},
		{
			$push: { messages: { key, sender: actor.role, body, sentAt: now } },
			$inc: { [counter]: 1 },
			$set: { [last]: now },
		},
	);
	if (result.modifiedCount) return true;
	return Boolean(
		await Booking.exists({
			...scope,
			messages: { $elemMatch: { key, body, sender: actor.role } },
		}),
	);
}

export async function markThreadRead(
	id: string,
	actor: Participant,
	count: number,
) {
	await connectDB();
	const field = actor.role === "student" ? "studentRead" : "tutorRead";
	const peerCounter = actor.role === "student" ? "tutorSent" : "studentSent";
	return (
		(
			await Booking.updateOne(
				{ ...participantScope(id, actor), [peerCounter]: { $gte: count } },
				{ $max: { [field]: count } },
			)
		).matchedCount === 1
	);
}

export async function reportThreadMessage(
	id: string,
	actor: Participant,
	key: string,
	reason: string,
) {
	await connectDB();
	const sender = actor.role === "student" ? "tutor" : "student";
	const match = { key, sender };
	const booking = await Booking.findOne(
		{ ...participantScope(id, actor), messages: { $elemMatch: match } },
		{ messages: { $elemMatch: match } },
	).lean();
	const message = booking?.messages?.[0];
	if (!message) return false;
	const reportId = `${id}-${key}`;
	try {
		await MessageReport.updateOne(
			{ _id: reportId },
			{
				$setOnInsert: {
					bookingId: id,
					reporterId: actor.id,
					senderRole: sender,
					excerpt: message.body,
					reason,
				},
			},
			{ upsert: true },
		);
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === 11000))
			throw error;
	}
	return true;
}

export async function pendingMessageReports() {
	await connectDB();
	return MessageReport.find({ reviewedAt: { $exists: false } })
		.sort({ createdAt: 1 })
		.limit(50)
		.lean();
}
