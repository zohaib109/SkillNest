"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { getSession } from "@/lib/auth-server";
import {
	checkIn,
	confirmSandboxDelivery,
	openLessonIssue,
	reviewLessonIssue,
	saveSandboxReview,
} from "@/lib/lesson-room";
import { bookingIdSchema } from "@/lib/validators/booking";

async function actorFor(id: string) {
	const s = await getSession(),
		role = s?.user.role;
	if (
		!bookingIdSchema.safeParse(id).success ||
		!s?.user.emailVerified ||
		(role !== "student" && role !== "tutor")
	)
		return null;
	return { id: s.user.id, role: role as "student" | "tutor" };
}
function refresh(id: string) {
	revalidatePath(`/dashboard/room/${id}`);
	revalidatePath("/dashboard/admin/bookings");
}
export async function roomCheckIn(id: string, _previous: string) {
	const actor = await actorFor(id);
	if (!actor || !(await checkIn(id, actor)))
		return "Check-in is unavailable for this booking or time.";
	refresh(id);
	return "Check-in saved.";
}
export async function confirmDelivery(id: string, _previous: string) {
	const actor = await actorFor(id);
	if (!actor || !(await confirmSandboxDelivery(id, actor)))
		return "Delivery confirmation is unavailable for this lesson.";
	refresh(id);
	revalidatePath("/dashboard/bookings");
	revalidatePath("/dashboard/lessons");
	return "Delivery confirmation saved.";
}

export async function submitSandboxReview(
	id: string,
	_previous: string,
	form: FormData,
) {
	const actor = await actorFor(id);
	if (actor?.role !== "student")
		return "A verified student account is required.";
	const score = z.enum(["1", "2", "3", "4", "5"]).safeParse(form.get("score"));
	const comment = z
		.string()
		.trim()
		.max(500)
		.safeParse(form.get("comment") ?? "");
	if (!score.success || !comment.success)
		return "Choose a rating and keep your comment within 500 characters.";
	if (
		!(await saveSandboxReview(id, actor.id, Number(score.data), comment.data))
	)
		return "This lesson is unavailable for review or already has a different review.";
	refresh(id);
	return "Your private sandbox review was saved.";
}
export async function reportLessonIssue(
	id: string,
	_previous: string,
	form: FormData,
) {
	const actor = await actorFor(id);
	const reason = z
			.enum(["could_not_connect", "other_person_absent", "other"])
			.safeParse(form.get("reason")),
		detail = z.string().trim().min(5).max(400).safeParse(form.get("detail"));
	if (!actor || !reason.success || !detail.success)
		return "Choose a reason and describe the problem in 5–400 characters.";
	if (!(await openLessonIssue(id, actor, reason.data, detail.data)))
		return "This report is unavailable or already filed.";
	refresh(id);
	return "Report received.";
}
export async function resolveLessonIssue(
	id: string,
	revision: number,
	_previous: string,
	form: FormData,
) {
	const session = await getSession(),
		note = z.string().trim().min(5).max(400).safeParse(form.get("decision"));
	if (
		!session?.user.emailVerified ||
		session.user.role !== "admin" ||
		!bookingIdSchema.safeParse(id).success ||
		!Number.isInteger(revision) ||
		!note.success
	)
		return "Enter a review note of 5–400 characters.";
	if (!(await reviewLessonIssue(id, session.user.id, revision, note.data)))
		return "The case changed. Refresh and review the latest statements.";
	refresh(id);
	return "Review recorded.";
}
