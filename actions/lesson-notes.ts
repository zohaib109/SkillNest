"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import { publishLessonRecap, recordPracticeResponse } from "@/lib/lesson-notes";
import { bookingIdSchema } from "@/lib/validators/booking";
import { practiceResponse, recapInput } from "@/lib/validators/lesson-notes";

function refreshLessonNotes() {
	revalidatePath("/dashboard/lessons");
	revalidatePath("/dashboard/bookings");
}

export async function publishRecap(_previous: string, form: FormData) {
	const session = await getSession();
	if (session?.user.role !== "tutor" || !session.user.emailVerified)
		return "A verified tutor account is required.";
	const id = bookingIdSchema.safeParse(form.get("bookingId"));
	const input = recapInput.safeParse({
		practised: form.get("practised"),
		exercise: form.get("exercise"),
		resource: form.get("resource") ?? "",
	});
	if (!id.success || !input.success || form.get("delivered") !== "yes")
		return "Confirm you taught this lesson, complete both notes and use a public HTTPS resource link if needed.";
	try {
		if (!(await publishLessonRecap(session.user.id, id.data, input.data)))
			return "This lesson is unavailable or already has a different recap.";
	} catch {
		return "Your recap could not be saved. Please try again.";
	}
	refreshLessonNotes();
	return "";
}

export async function savePracticeResponse(_previous: string, form: FormData) {
	const session = await getSession();
	if (session?.user.role !== "student" || !session.user.emailVerified)
		return "A verified student account is required.";
	const id = bookingIdSchema.safeParse(form.get("bookingId"));
	const response = practiceResponse.safeParse(form.get("response"));
	if (!id.success || !response.success) return "Choose a practice outcome.";
	try {
		if (
			!(await recordPracticeResponse(session.user.id, id.data, response.data))
		)
			return "This practice is unavailable.";
	} catch {
		return "Your practice response could not be saved. Please try again.";
	}
	refreshLessonNotes();
	return "";
}
