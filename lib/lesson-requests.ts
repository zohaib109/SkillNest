import { connectDB } from "@/lib/db";
import type {
	LessonRequestDTO,
	LessonRequestStatus,
} from "@/lib/types";
import {
	LessonRequest,
	type LessonRequestDoc,
} from "@/models/LessonRequest";

type LeanLessonRequest = LessonRequestDoc & {
	_id: unknown;
	createdAt?: Date;
	updatedAt?: Date;
	respondedAt?: Date | null;
};

function serialize(doc: LeanLessonRequest): LessonRequestDTO {
	return {
		id: String(doc._id),
		tutorId: doc.tutorId,
		tutorProfileId: doc.tutorProfileId,
		tutorName: doc.tutorName ?? "",
		tutorSlug: doc.tutorSlug,
		studentId: doc.studentId,
		studentName: doc.studentName ?? "",
		studentEmail: doc.studentEmail ?? "",
		subject: doc.subject,
		duration: doc.duration,
		preferredSchedule: doc.preferredSchedule,
		message: doc.message,
		status: doc.status as LessonRequestStatus,
		respondedAt: doc.respondedAt
			? new Date(doc.respondedAt).toISOString()
			: "",
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
	};
}

export async function getLessonRequestsForTutor(
	tutorId: string,
): Promise<LessonRequestDTO[]> {
	await connectDB();
	const docs = await LessonRequest.find({ tutorId })
		.sort({ status: 1, createdAt: -1 })
		.lean<LeanLessonRequest[]>();
	return docs.map(serialize);
}

export async function getLessonRequestsForStudent(
	studentId: string,
): Promise<LessonRequestDTO[]> {
	await connectDB();
	const docs = await LessonRequest.find({ studentId })
		.sort({ createdAt: -1 })
		.lean<LeanLessonRequest[]>();
	return docs.map(serialize);
}

export async function getTutorRequestSummary(tutorId: string) {
	await connectDB();
	const rows = await LessonRequest.aggregate<{
		_id: LessonRequestStatus;
		count: number;
	}>([
		{ $match: { tutorId } },
		{ $group: { _id: "$status", count: { $sum: 1 } } },
	]);

	const counts: Record<LessonRequestStatus, number> = {
		pending: 0,
		accepted: 0,
		declined: 0,
	};
	for (const row of rows) counts[row._id] = row.count;

	const total = counts.pending + counts.accepted + counts.declined;
	return {
		...counts,
		total,
		acceptanceRate:
			counts.accepted + counts.declined > 0
				? Math.round(
						(counts.accepted / (counts.accepted + counts.declined)) * 100,
					)
				: null,
	};
}
