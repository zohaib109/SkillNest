"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-server";
import {
	sandboxPaymentsEnabled,
	simulateLessonPayment,
} from "@/lib/sandbox-payments";
import { bookingIdSchema } from "@/lib/validators/booking";

export async function runSandboxCheckout(_previous: string, form: FormData) {
	if (!sandboxPaymentsEnabled()) return "Sandbox checkout is disabled.";
	const session = await getSession();
	if (!session?.user.emailVerified || session.user.role !== "student")
		return "A verified student account is required.";
	const id = bookingIdSchema.safeParse(form.get("bookingId"));
	if (!id.success) return "Invalid reservation.";
	try {
		const outcome = await simulateLessonPayment(session.user.id, id.data);
		if (outcome === "confirmed") {
			revalidatePath("/dashboard/bookings");
			return "";
		}
		return "The hold could not be confirmed. Check your reservation and try again.";
	} catch {
		return "Couldn't complete the simulated checkout. Try again.";
	}
}
