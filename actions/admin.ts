"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { approveTutorSchema, rejectTutorSchema } from "@/lib/validators/tutor";
import { TutorProfile } from "@/models/TutorProfile";

type ActionResult = { success: true } | { success: false; error: string };

export async function approveTutor(profileId: string): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "admin") {
		return { success: false, error: "Forbidden" };
	}
	const parsed = approveTutorSchema.safeParse({ profileId });
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid input",
		};
	}

	await connectDB();
	const profile = await TutorProfile.findOneAndUpdate(
		{ _id: parsed.data.profileId, status: "pending_review" },
		{
			$set: {
				status: "approved",
				isApproved: true,
				approvedAt: new Date(),
				approvedBy: session.user.id,
				rejectionReason: "",
			},
		},
		{ new: true },
	);
	if (!profile) {
		return { success: false, error: "Tutor profile is not awaiting review" };
	}

	revalidatePath("/dashboard/admin/tutors");
	revalidatePath("/tutors");
	return { success: true };
}

export async function rejectTutor(
	profileId: string,
	reason: string,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "admin") {
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
	const profile = await TutorProfile.findOneAndUpdate(
		{ _id: parsed.data.profileId, status: "pending_review" },
		{
			$set: {
				status: "rejected",
				isApproved: false,
				approvedAt: null,
				approvedBy: "",
				rejectionReason: parsed.data.reason,
			},
		},
		{ new: true },
	);
	if (!profile) {
		return { success: false, error: "Tutor profile is not awaiting review" };
	}

	revalidatePath("/dashboard/admin/tutors");
	revalidatePath("/tutors");
	return { success: true };
}
