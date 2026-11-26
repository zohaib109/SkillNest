"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { getSession } from "@/lib/auth-server";
import {
	cancelAndRequestSandboxRefund,
	reviewSandboxRefund,
} from "@/lib/refunds";
import { bookingIdSchema } from "@/lib/validators/booking";

const noteSchema = z.string().trim().min(5).max(500);

function refreshBookings() {
	revalidatePath("/dashboard/bookings");
	revalidatePath("/dashboard/admin/bookings");
	revalidatePath("/dashboard/lessons");
}

export async function requestSandboxCancellation(
	_previous: string,
	form: FormData,
) {
	const session = await getSession();
	if (!session?.user.emailVerified || session.user.role !== "student")
		return "A verified student account is required.";
	const id = bookingIdSchema.safeParse(form.get("bookingId"));
	const reason = noteSchema.safeParse(form.get("reason"));
	if (!id.success || !reason.success)
		return "Enter a cancellation reason between 5 and 500 characters.";
	try {
		if (
			!(await cancelAndRequestSandboxRefund(
				session.user.id,
				id.data,
				reason.data,
			))
		)
			return "This lesson is unavailable for cancellation.";
	} catch {
		return "Couldn't cancel this sandbox lesson. Try again.";
	}
	refreshBookings();
	return "";
}

export async function decideSandboxRefund(_previous: string, form: FormData) {
	const session = await getSession();
	if (!session?.user.emailVerified || session.user.role !== "admin")
		return "A verified administrator account is required.";
	const id = bookingIdSchema.safeParse(form.get("bookingId"));
	const note = noteSchema.safeParse(form.get("note"));
	const decision = z
		.enum(["approved", "rejected"])
		.safeParse(form.get("decision"));
	if (!id.success || !decision.success || !note.success)
		return "Choose a decision and enter a review note between 5 and 500 characters.";
	try {
		if (
			!(await reviewSandboxRefund(
				session.user.id,
				id.data,
				decision.data,
				note.data,
			))
		)
			return "This request was already reviewed or is ineligible for approval.";
	} catch {
		return "Couldn't record this sandbox decision. Try again.";
	}
	refreshBookings();
	return "";
}
