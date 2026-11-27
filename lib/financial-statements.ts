import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { bookingIdSchema } from "@/lib/validators/booking";
import { Booking } from "@/models/Booking";
import { LedgerEntry, Payment, RefundRequest } from "@/models/Payment";

interface StudentReceipt {
	tutorName: string;
	startsAt: Date;
	duration: number;
	confirmedAt: Date;
	amountMinor: number;
	currency: string;
	refundedMinor: number;
	refundStatus: "requested" | "approved" | "rejected" | null;
}
export async function studentSandboxReceipt(
	studentId: string,
	bookingId: string,
) {
	if (!bookingIdSchema.safeParse(bookingId).success) return null;
	await connectDB();
	type Charge = { amountMinor: number; currency: string; status: string };
	type RecordSnapshot = Omit<
		StudentReceipt,
		"refundStatus" | "refundedMinor"
	> & { payment: Charge; refund?: Charge };
	const [record] = await Booking.aggregate<RecordSnapshot>([
		{
			$match: {
				_id: new Types.ObjectId(bookingId),
				studentId,
				paymentMode: "sandbox",
				confirmedAt: { $type: "date" },
			},
		},
		{
			$lookup: {
				from: Payment.collection.name,
				localField: "_id",
				foreignField: "_id",
				as: "payment",
				pipeline: [
					{
						$match: {
							mode: "sandbox",
							status: { $in: ["captured", "partially_refunded", "refunded"] },
						},
					},
					{ $project: { amountMinor: 1, currency: 1, status: 1 } },
				],
			},
		},
		{ $unwind: "$payment" },
		{
			$lookup: {
				from: RefundRequest.collection.name,
				localField: "_id",
				foreignField: "_id",
				as: "refund",
				pipeline: [
					{ $match: { studentId, mode: "sandbox" } },
					{ $project: { amountMinor: 1, currency: 1, status: 1 } },
				],
			},
		},
		{
			$project: {
				_id: 0,
				tutorName: 1,
				startsAt: 1,
				duration: 1,
				confirmedAt: 1,
				amountMinor: 1,
				currency: 1,
				payment: 1,
				refund: { $first: "$refund" },
			},
		},
	]).readConcern("snapshot");
	if (!record) return null;
	const { payment, refund, ...lesson } = record;
	if (
		payment.amountMinor !== lesson.amountMinor ||
		payment.currency !== lesson.currency
	)
		return null;
	const refundStatus = refund?.status ?? null;
	if (
		refundStatus !== null &&
		refundStatus !== "requested" &&
		refundStatus !== "approved" &&
		refundStatus !== "rejected"
	)
		return null;
	if (refund && refund.currency !== lesson.currency) return null;
	const refundedMinor = refund?.status === "approved" ? refund.amountMinor : 0;
	if (
		!Number.isSafeInteger(refundedMinor) ||
		refundedMinor < 0 ||
		refundedMinor > lesson.amountMinor
	)
		return null;
	const expected =
		refundedMinor === 0
			? "captured"
			: refundedMinor === lesson.amountMinor
				? "refunded"
				: "partially_refunded";
	if (
		payment.status !== expected ||
		(refundStatus === "approved" && refundedMinor === 0)
	)
		return null;
	return { ...lesson, refundedMinor, refundStatus } satisfies StudentReceipt;
}

type LedgerKind =
	| "platform_commission"
	| "pending_tutor_earning"
	| "commission_refund"
	| "pending_earning_refund";
interface TutorStatement {
	totals: {
		_id: string;
		captured: number;
		refunded: number;
		commission: number;
		pending: number;
	}[];
	recent: {
		_id: string;
		paymentId: Types.ObjectId;
		currency: string;
		kind: LedgerKind;
		amountMinor: number;
		recordedAt: Date;
	}[];
}
export async function tutorSandboxStatement(tutorId: string) {
	await connectDB();
	// One snapshot keeps the summary and activity in agreement during a capture or refund.
	const sumKinds = (kinds: LedgerKind[]) => ({
		$sum: { $cond: [{ $in: ["$kind", kinds] }, "$amountMinor", 0] },
	});
	const [statement] = await LedgerEntry.aggregate<TutorStatement>([
		{ $match: { tutorId, mode: "sandbox" } },
		{ $sort: { recordedAt: -1, _id: -1 } },
		{
			$facet: {
				totals: [
					{
						$group: {
							_id: "$currency",
							captured: sumKinds([
								"platform_commission",
								"pending_tutor_earning",
							]),
							refunded: sumKinds([
								"commission_refund",
								"pending_earning_refund",
							]),
							commission: sumKinds([
								"platform_commission",
								"commission_refund",
							]),
							pending: sumKinds([
								"pending_tutor_earning",
								"pending_earning_refund",
							]),
						},
					},
					{ $sort: { _id: 1 } },
				],
				recent: [
					{ $limit: 40 },
					{
						$project: {
							paymentId: 1,
							currency: 1,
							kind: 1,
							amountMinor: 1,
							recordedAt: 1,
						},
					},
				],
			},
		},
	]).readConcern("snapshot");
	return statement;
}
