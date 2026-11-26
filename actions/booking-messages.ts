"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { getSession } from "@/lib/auth-server";
import {
	markThreadRead,
	reportThreadMessage,
	sendThreadMessage,
} from "@/lib/booking-messages";
import type { Participant } from "@/lib/booking-participants";
import { connectDB } from "@/lib/db";
import { bookingIdSchema } from "@/lib/validators/booking";
import { MessageReport } from "@/models/MessageReport";

async function participant(): Promise<Participant | null> {
	const s = await getSession();
	const role = s?.user.role;
	return s?.user.emailVerified && (role === "student" || role === "tutor")
		? { id: s.user.id, role }
		: null;
}
function refresh(id: string) {
	revalidatePath(`/dashboard/messages/${id}`);
	revalidatePath("/dashboard/bookings");
	revalidatePath("/dashboard/lessons");
}
export async function sendBookingMessage(
	id: string,
	nonce: string,
	body: string,
) {
	const actor = await participant();
	const text = z.string().trim().min(1).max(1000).safeParse(body);
	if (
		!actor ||
		!bookingIdSchema.safeParse(id).success ||
		!z.uuid().safeParse(nonce).success ||
		!text.success
	)
		return "Enter a message of 1–1,000 characters from a verified participant account.";
	try {
		if (!(await sendThreadMessage(id, actor, nonce, text.data)))
			return "Message not sent. Wait a moment before retrying. A closed thread or the per-lesson limit also prevents sending.";
	} catch {
		return "Delivery could not be confirmed. Retry this message.";
	}
	refresh(id);
	return "";
}
export async function acknowledgeMessages(id: string, count: number) {
	const actor = await participant();
	if (
		!actor ||
		!bookingIdSchema.safeParse(id).success ||
		!Number.isInteger(count) ||
		count < 1 ||
		count > 60
	)
		return;
	if (await markThreadRead(id, actor, count)) refresh(id);
}
export async function flagBookingMessage(
	id: string,
	key: string,
	_previous: string,
	form: FormData,
) {
	const actor = await participant();
	const reason = z
		.string()
		.trim()
		.min(5)
		.max(300)
		.safeParse(form.get("reason"));
	if (
		!actor ||
		!bookingIdSchema.safeParse(id).success ||
		!/^((student)|(tutor))-[a-f0-9-]{36}$/i.test(key) ||
		!reason.success
	)
		return "Enter a reason between 5 and 300 characters.";
	if (!(await reportThreadMessage(id, actor, key, reason.data)))
		return "This message is unavailable.";
	revalidatePath("/dashboard/admin/bookings");
	return "Report received. Staff can review this message.";
}
export async function reviewMessageReport(id: string, form: FormData) {
	const session = await getSession();
	const note = z
		.string()
		.trim()
		.min(5)
		.max(300)
		.safeParse(form.get("decision"));
	if (
		session?.user.role !== "admin" ||
		!session.user.emailVerified ||
		!note.success ||
		!/^([a-f0-9]{24})-(student|tutor)-[a-f0-9-]{36}$/i.test(id)
	)
		return;
	await connectDB();
	await MessageReport.updateOne(
		{ _id: id, reviewedAt: { $exists: false } },
		{
			$set: {
				reviewedAt: new Date(),
				reviewedBy: session.user.id,
				decision: note.data,
			},
		},
	);
	revalidatePath("/dashboard/admin/bookings");
}
