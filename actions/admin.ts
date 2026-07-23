"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { isAdminEmail } from "@/lib/permissions";
import { rejectTutorSchema } from "@/lib/validators/tutor";
import { TutorProfile } from "@/models/TutorProfile";

type ActionResult = { success: true } | { success: false; error: string };

export async function approveTutor(profileId: string): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (!isAdminEmail(session.user.email)) {
		return { success: false, error: "Forbidden" };
	}

	await connectDB();
	const profile = await TutorProfile.findById(profileId);
	if (!profile) return { success: false, error: "Tutor profile not found" };
	if (profile.status !== "pending_review") {
		return { success: false, error: "This tutor is not awaiting review" };
	}

	profile.status = "approved";
	profile.isApproved = true;
	profile.approvedAt = new Date();
	profile.approvedBy = session.user.id;
	profile.rejectionReason = "";
	await profile.save();

	revalidatePath("/admin");
	revalidatePath("/tutors");
	revalidatePath(`/tutors/${profile.slug}`);
	revalidatePath("/dashboard");
	return { success: true };
}

export async function rejectTutor(
	profileId: string,
	reason: string,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (!isAdminEmail(session.user.email)) {
		return { success: false, error: "Forbidden" };
	}

	const parsed = rejectTutorSchema.safeParse({ profileId, reason });
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid input",
		};
	}

	await connectDB();
	const profile = await TutorProfile.findById(profileId);
	if (!profile) return { success: false, error: "Tutor profile not found" };
	if (profile.status !== "pending_review") {
		return { success: false, error: "This tutor is not awaiting review" };
	}

	profile.status = "rejected";
	profile.isApproved = false;
	profile.rejectionReason = parsed.data.reason;
	await profile.save();

	revalidatePath("/admin");
	revalidatePath("/tutors");
	revalidatePath(`/tutors/${profile.slug}`);
	return { success: true };
}
