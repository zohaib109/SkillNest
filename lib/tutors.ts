import { connectDB } from "@/lib/db";
import type { TutorProfileDTO, TutorStatus } from "@/lib/types";
import { TutorProfile, type TutorProfileDoc } from "@/models/TutorProfile";

/**
 * Server-only data access + serialization for tutor profiles.
 * Converts Mongoose lean documents into plain, client-safe DTOs.
 */

type LeanTutor = TutorProfileDoc & {
	_id: unknown;
	createdAt?: Date;
	updatedAt?: Date;
};

function serialize(doc: LeanTutor): TutorProfileDTO {
	return {
		id: String(doc._id),
		userId: doc.userId,
		userName: doc.userName ?? "",
		userEmail: doc.userEmail ?? "",
		slug: doc.slug,
		headline: doc.headline ?? "",
		bio: doc.bio ?? "",
		subjects: doc.subjects ?? [],
		languages: doc.languages ?? [],
		hourlyRate: doc.hourlyRate ?? 0,
		currency: doc.currency ?? "USD",
		introVideoUrl: doc.introVideoUrl ?? "",
		country: doc.country ?? "",
		timezone: doc.timezone ?? "",
		lessonDurations: doc.lessonDurations ?? [],
		availabilityRules: (doc.availabilityRules ?? []).map((r) => ({
			dayOfWeek: r.dayOfWeek,
			startTime: r.startTime,
			endTime: r.endTime,
		})),
		status: (doc.status ?? "draft") as TutorStatus,
		isApproved: Boolean(doc.isApproved),
		rejectionReason: doc.rejectionReason ?? "",
		ratingAverage: doc.ratingAverage ?? 0,
		reviewCount: doc.reviewCount ?? 0,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
	};
}

export async function getTutorProfileByUserId(
	userId: string,
): Promise<TutorProfileDTO | null> {
	await connectDB();
	const doc = await TutorProfile.findOne({ userId }).lean<LeanTutor>();
	return doc ? serialize(doc) : null;
}

export async function getTutorProfilesByStatus(
	status: TutorStatus,
): Promise<TutorProfileDTO[]> {
	await connectDB();
	const docs = await TutorProfile.find({ status })
		.sort({ updatedAt: -1 })
		.lean<LeanTutor[]>();
	return docs.map(serialize);
}

export async function getAllTutorProfiles(): Promise<TutorProfileDTO[]> {
	await connectDB();
	const docs = await TutorProfile.find({})
		.sort({ updatedAt: -1 })
		.lean<LeanTutor[]>();
	return docs.map(serialize);
}
