"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import type { AvailabilityRule, TutorProfileInput } from "@/lib/types";
import { availabilitySchema, tutorProfileSchema } from "@/lib/validators/tutor";
import { TutorProfile } from "@/models/TutorProfile";

type ActionResult = { success: true } | { success: false; error: string };

/** Find the current tutor's profile, creating a draft shell if none exists. */
async function ensureProfile(
	userId: string,
	userName: string,
	userEmail: string,
) {
	let profile = await TutorProfile.findOne({ userId });
	if (!profile) {
		const slug = await generateUniqueSlug(
			userName || "tutor",
			async (candidate) =>
				Boolean(await TutorProfile.exists({ slug: candidate })),
		);
		profile = await TutorProfile.create({
			userId,
			userName,
			userEmail,
			slug,
			status: "draft",
		});
	}
	return profile;
}

export async function saveTutorProfile(
	input: TutorProfileInput,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "tutor") {
		return { success: false, error: "Only tutors can edit a tutor profile" };
	}

	const parsed = tutorProfileSchema.safeParse(input);
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid input",
		};
	}

	await connectDB();
	const profile = await ensureProfile(
		session.user.id,
		session.user.name ?? "",
		session.user.email ?? "",
	);

	Object.assign(profile, parsed.data);
	profile.userName = session.user.name ?? profile.userName;
	profile.userEmail = session.user.email ?? profile.userEmail;

	// Editing a previously rejected profile returns it to draft for resubmission.
	if (profile.status === "rejected") {
		profile.status = "draft";
		profile.isApproved = false;
		profile.rejectionReason = "";
	}

	await profile.save();
	revalidatePath("/dashboard");
	revalidatePath("/dashboard/profile");
	revalidatePath("/complete-profile");
	revalidatePath("/tutors");
	revalidatePath(`/tutors/${profile.slug}`);
	return { success: true };
}

export async function submitTutorProfileForReview(): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "tutor") {
		return { success: false, error: "Forbidden" };
	}

	await connectDB();
	const profile = await TutorProfile.findOne({ userId: session.user.id });
	if (!profile) {
		return { success: false, error: "Create and save your profile first" };
	}

	const parsed = tutorProfileSchema.safeParse({
		photoUrl: profile.photoUrl,
		headline: profile.headline,
		bio: profile.bio,
		subjects: profile.subjects,
		languages: profile.languages,
		hourlyRate: profile.hourlyRate,
		currency: profile.currency,
		introVideoUrl: profile.introVideoUrl,
		country: profile.country,
		timezone: profile.timezone,
		lessonDurations: profile.lessonDurations,
	});
	if (!parsed.success) {
		return {
			success: false,
			error: "Complete all required fields before submitting for review",
		};
	}

	if (profile.status === "approved") {
		return { success: false, error: "Your profile is already approved" };
	}

	profile.status = "pending_review";
	profile.isApproved = false;
	profile.rejectionReason = "";
	await profile.save();
	revalidatePath("/dashboard");
	revalidatePath("/dashboard/profile");
	revalidatePath("/admin");
	return { success: true };
}

export async function saveAvailability(
	rules: AvailabilityRule[],
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "tutor") {
		return { success: false, error: "Forbidden" };
	}

	const parsed = availabilitySchema.safeParse({ rules });
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid availability",
		};
	}

	await connectDB();
	const profile = await ensureProfile(
		session.user.id,
		session.user.name ?? "",
		session.user.email ?? "",
	);
	profile.set("availabilityRules", parsed.data.rules);
	await profile.save();
	revalidatePath("/dashboard/availability");
	revalidatePath(`/tutors/${profile.slug}`);
	return { success: true };
}

export async function saveTutorIntroVideo(
	introVideoUrl: string,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "tutor") {
		return { success: false, error: "Only tutors can update an intro video" };
	}

	const parsed = tutorProfileSchema.shape.introVideoUrl.safeParse(introVideoUrl);
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid intro video URL",
		};
	}

	await connectDB();
	const profile = await ensureProfile(
		session.user.id,
		session.user.name ?? "",
		session.user.email ?? "",
	);
	profile.introVideoUrl = parsed.data;
	if (profile.status === "rejected") {
		profile.status = "draft";
		profile.isApproved = false;
		profile.rejectionReason = "";
	}
	await profile.save();
	revalidatePath("/dashboard");
	revalidatePath("/dashboard/intro-video");
	revalidatePath("/dashboard/profile");
	revalidatePath(`/tutors/${profile.slug}`);
	return { success: true };
}
