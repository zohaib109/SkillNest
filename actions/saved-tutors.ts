"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { SavedTutor } from "@/models/SavedTutor";
import { TutorProfile } from "@/models/TutorProfile";

type ToggleResult =
	| { success: true; saved: boolean }
	| { success: false; error: string };

export async function toggleSavedTutor(
	profileId: string,
): Promise<ToggleResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "student" || !session.user.emailVerified) {
		return { success: false, error: "Only verified students can save tutors" };
	}
	if (!/^[a-f\d]{24}$/i.test(profileId)) {
		return { success: false, error: "Invalid tutor profile" };
	}

	await connectDB();
	const profile = await TutorProfile.findOne({
		_id: profileId,
		status: "approved",
		isApproved: true,
	}).select({ slug: 1 });
	if (!profile) return { success: false, error: "Tutor is not available" };

	const filter = { studentId: session.user.id, tutorProfileId: profile._id };
	const removed = await SavedTutor.findOneAndDelete(filter);
	if (removed) {
		revalidatePath("/tutors");
		revalidatePath(`/tutors/${profile.slug}`);
		return { success: true, saved: false };
	}

	await SavedTutor.updateOne(
		filter,
		{ $setOnInsert: filter },
		{ upsert: true },
	);
	revalidatePath("/tutors");
	revalidatePath(`/tutors/${profile.slug}`);
	return { success: true, saved: true };
}
