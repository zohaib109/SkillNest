import { connectDB } from "@/lib/db";
import type { TutorSearchFilters } from "@/lib/tutor-search";
import type {
	PublicTutorProfileDTO,
	TutorProfileDTO,
	TutorStatus,
} from "@/lib/types";
import { SavedTutor } from "@/models/SavedTutor";
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

function serializePublic(doc: LeanTutor): PublicTutorProfileDTO {
	const {
		userEmail: _userEmail,
		status: _status,
		isApproved: _isApproved,
		rejectionReason: _rejectionReason,
		...safe
	} = serialize(doc);
	return safe;
}

const APPROVED_TUTOR_FILTER = {
	status: "approved",
	isApproved: true,
} as const;

const DISCOVERY_PAGE_SIZE = 12;

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface TutorDiscoveryResult {
	tutors: PublicTutorProfileDTO[];
	total: number;
	page: number;
	pageCount: number;
	savedTutorIds: string[];
}

export async function findApprovedTutors(
	filters: TutorSearchFilters,
	studentId: string,
): Promise<TutorDiscoveryResult> {
	await connectDB();

	const query: Record<string, unknown> = { ...APPROVED_TUTOR_FILTER };
	if (filters.query) {
		const search = new RegExp(escapeRegExp(filters.query), "i");
		query.$or = [
			{ userName: search },
			{ headline: search },
			{ bio: search },
			{ subjects: search },
		];
	}
	if (filters.subject) query.subjects = filters.subject;
	if (filters.language) query.languages = filters.language;
	if (filters.currency) query.currency = filters.currency;
	if (filters.duration) query.lessonDurations = filters.duration;
	if (filters.minRate !== undefined || filters.maxRate !== undefined) {
		query.hourlyRate = {
			...(filters.minRate !== undefined ? { $gte: filters.minRate } : {}),
			...(filters.maxRate !== undefined ? { $lte: filters.maxRate } : {}),
		};
	}
	if (filters.savedOnly) {
		query._id = {
			$in: await SavedTutor.distinct("tutorProfileId", { studentId }),
		};
	}

	const sort: Record<string, 1 | -1> =
		filters.sort === "price_asc"
			? { hourlyRate: 1 as const, ratingAverage: -1 as const }
			: filters.sort === "price_desc"
				? { hourlyRate: -1 as const, ratingAverage: -1 as const }
				: filters.sort === "newest"
					? { approvedAt: -1 as const }
					: {
							ratingAverage: -1 as const,
							reviewCount: -1 as const,
							updatedAt: -1 as const,
						};

	const total = await TutorProfile.countDocuments(query);
	const pageCount = Math.max(1, Math.ceil(total / DISCOVERY_PAGE_SIZE));
	const page = Math.min(filters.page, pageCount);
	const docs = await TutorProfile.find(query)
		.sort(sort)
		.skip((page - 1) * DISCOVERY_PAGE_SIZE)
		.limit(DISCOVERY_PAGE_SIZE)
		.lean<LeanTutor[]>();
	const savedTutorIds = await SavedTutor.distinct("tutorProfileId", {
		studentId,
		tutorProfileId: { $in: docs.map((doc) => String(doc._id)) },
	});

	return {
		tutors: docs.map(serializePublic),
		total,
		page,
		pageCount,
		savedTutorIds: savedTutorIds.map(String),
	};
}

export async function getApprovedTutorBySlug(
	slug: string,
): Promise<PublicTutorProfileDTO | null> {
	await connectDB();
	const doc = await TutorProfile.findOne({
		...APPROVED_TUTOR_FILTER,
		slug,
	}).lean<LeanTutor>();
	return doc ? serializePublic(doc) : null;
}

export async function isTutorSaved(studentId: string, profileId: string) {
	await connectDB();
	return Boolean(
		await SavedTutor.exists({ studentId, tutorProfileId: profileId }),
	);
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
