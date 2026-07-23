"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { connectDB } from "@/lib/db";
import { isTutorApproved } from "@/lib/permissions";
import {
	lessonRequestDecisionSchema,
	lessonRequestSchema,
} from "@/lib/validators/tutor";
import { LessonRequest } from "@/models/LessonRequest";
import { TutorProfile } from "@/models/TutorProfile";
import type { LessonRequestInput, LessonRequestStatus } from "@/lib/types";

type ActionResult = { success: true } | { success: false; error: string };

export async function createLessonRequest(
	input: LessonRequestInput,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Please sign in to send a request" };
	if (session.user.role !== "student") {
		return { success: false, error: "Only student accounts can send requests" };
	}

	const parsed = lessonRequestSchema.safeParse(input);
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid request",
		};
	}

	await connectDB();
	const tutor = await TutorProfile.findOne({
		slug: parsed.data.tutorSlug,
		status: "approved",
		isApproved: true,
	});
	if (!isTutorApproved(tutor)) {
		return { success: false, error: "This tutor is not available for requests" };
	}
	if (!tutor.subjects.includes(parsed.data.subject)) {
		return { success: false, error: "Choose a subject offered by this tutor" };
	}
	if (!tutor.lessonDurations.includes(parsed.data.duration)) {
		return { success: false, error: "Choose one of the tutor's lesson durations" };
	}

	const existing = await LessonRequest.exists({
		tutorId: tutor.userId,
		studentId: session.user.id,
		status: "pending",
	});
	if (existing) {
		return {
			success: false,
			error: "You already have a request awaiting this tutor's response",
		};
	}

	await LessonRequest.create({
		tutorId: tutor.userId,
		tutorProfileId: String(tutor._id),
		tutorName: tutor.userName,
		tutorSlug: tutor.slug,
		studentId: session.user.id,
		studentName: session.user.name ?? "",
		studentEmail: session.user.email ?? "",
		...parsed.data,
	});

	revalidatePath(`/tutors/${tutor.slug}`);
	revalidatePath("/dashboard/bookings");
	revalidatePath("/dashboard/requests");
	return { success: true };
}

export async function decideLessonRequest(
	requestId: string,
	decision: Extract<LessonRequestStatus, "accepted" | "declined">,
): Promise<ActionResult> {
	const session = await getSession();
	if (!session) return { success: false, error: "Unauthorized" };
	if (session.user.role !== "tutor") {
		return { success: false, error: "Only tutors can handle requests" };
	}

	const parsed = lessonRequestDecisionSchema.safeParse({ requestId, decision });
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Invalid request decision",
		};
	}

	await connectDB();
	const request = await LessonRequest.findOne({
		_id: parsed.data.requestId,
		tutorId: session.user.id,
	});
	if (!request) return { success: false, error: "Lesson request not found" };
	if (request.status !== "pending") {
		return { success: false, error: "This request has already been handled" };
	}

	request.status = parsed.data.decision;
	request.respondedAt = new Date();
	await request.save();
	revalidatePath("/dashboard");
	revalidatePath("/dashboard/requests");
	return { success: true };
}
