"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { createBookingHold, releaseBookingHold } from "@/lib/bookings";
import { bookingHoldSchema, bookingIdSchema } from "@/lib/validators/booking";

export async function reserveLesson(
	_previous: string,
	form: FormData,
): Promise<string> {
	const session = await getSession();
	if (!session?.user.emailVerified || session.user.role !== "student")
		return "A verified student account is required.";
	const parsed = bookingHoldSchema.safeParse({
		profileId: form.get("profileId"),
		goal: form.get("goal") ?? undefined,
		startsAt: form.get("startsAt"),
		duration: Number(form.get("duration")),
		studentTimezone: form.get("studentTimezone"),
		amountMinor: Number(form.get("amountMinor")),
		currency: form.get("currency"),
	});
	if (!parsed.success) return "Choose a valid lesson time and try again.";
	try {
		const result = await createBookingHold(session.user.id, parsed.data);
		if (!result.success) return result.error;
	} catch {
		return "Couldn't hold the lesson. Try again.";
	}
	revalidatePath("/dashboard/bookings");
	redirect("/dashboard/bookings");
}

export async function cancelLessonHold(
	_previous: string,
	form: FormData,
): Promise<string> {
	const session = await getSession();
	if (!session?.user.emailVerified || session.user.role !== "student")
		return "A verified student account is required.";
	const parsed = bookingIdSchema.safeParse(form.get("bookingId"));
	if (!parsed.success) return "Invalid reservation.";
	try {
		if (!(await releaseBookingHold(session.user.id, parsed.data)))
			return "This hold is no longer active.";
	} catch {
		return "Couldn't release the hold. Try again.";
	}
	revalidatePath("/dashboard/bookings");
	return "";
}
