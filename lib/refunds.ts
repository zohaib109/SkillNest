import "server-only";

import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { estimateStudentRefund } from "@/lib/refund-policy";
import { sandboxPaymentsEnabled } from "@/lib/sandbox-payments";
import { Booking } from "@/models/Booking";
import {
	LedgerEntry,
	Payment,
	PaymentEvent,
	RefundRequest,
} from "@/models/Payment";

const transactionOptions = {
	readConcern: { level: "snapshot" },
	writeConcern: { w: "majority" },
} as const;

export async function cancelAndRequestSandboxRefund(
	studentId: string,
	bookingId: string,
	reason: string,
) {
	if (!sandboxPaymentsEnabled()) return false;
	const { connection } = await connectDB();
	await RefundRequest.init();
	return connection.transaction(async (session) => {
		const now = new Date();
		const booking = await Booking.findOneAndUpdate(
			{
				_id: bookingId,
				studentId,
				status: "confirmed",
				paymentMode: "sandbox",
				startsAt: { $gt: now },
			},
			{ $set: { status: "cancelled", cancelledAt: now } },
			{ session },
		).lean();
		if (!booking) {
			return Boolean(
				await RefundRequest.exists({
					_id: bookingId,
					studentId,
					reason,
				}).session(session),
			);
		}
		const estimate = estimateStudentRefund(
			booking.amountMinor,
			booking.startsAt,
			now,
		);
		await new RefundRequest({
			_id: booking._id,
			studentId,
			reason,
			mode: "sandbox",
			status: "requested",
			currency: booking.currency,
			...estimate,
		}).save({ session });
		return true;
	}, transactionOptions);
}

export async function reviewSandboxRefund(
	adminId: string,
	bookingId: string,
	decision: "approved" | "rejected",
	reviewNote: string,
) {
	if (!sandboxPaymentsEnabled()) return false;
	const { connection } = await connectDB();
	return connection.transaction(async (session) => {
		const now = new Date();
		const request = await RefundRequest.findOneAndUpdate(
			{
				_id: bookingId,
				status: "requested",
				mode: "sandbox",
				...(decision === "approved" && { amountMinor: { $gt: 0 } }),
			},
			{
				$set: {
					status: decision,
					reviewedBy: adminId,
					reviewedAt: now,
					reviewNote,
				},
			},
			{ session },
		).lean();
		if (!request) return false;
		if (decision === "rejected") return true;
		const payment = await Payment.findOne({
			_id: request._id,
			mode: "sandbox",
			status: "captured",
			currency: request.currency,
			amountMinor: { $gte: request.amountMinor },
		})
			.session(session)
			.lean();
		const booking = await Booking.findOne({
			_id: request._id,
			status: "cancelled",
			paymentMode: "sandbox",
		})
			.session(session)
			.lean();
		if (!payment || !booking || payment.amountMinor !== booking.amountMinor)
			throw new Error("Refund request has no matching captured booking");
		const status =
			payment.amountMinor === request.amountMinor
				? "refunded"
				: "partially_refunded";
		await Payment.updateOne(
			{ _id: payment._id, status: "captured" },
			{ $set: { status } },
			{ session },
		);
		const commission = Math.round(
			(request.amountMinor * payment.commissionBasisPoints) / 10_000,
		);
		const common = {
			paymentId: payment._id,
			mode: "sandbox" as const,
			tutorId: booking.tutorId,
			currency: request.currency,
			recordedAt: now,
		};
		await LedgerEntry.insertMany(
			[
				{
					...common,
					_id: `${payment._id}:commission-refund`,
					kind: "commission_refund",
					amountMinor: -commission,
				},
				{
					...common,
					_id: `${payment._id}:earning-refund`,
					kind: "pending_earning_refund",
					amountMinor: commission - request.amountMinor,
				},
			],
			{ session },
		);
		return true;
	}, transactionOptions);
}

export async function listStudentRefunds(
	studentId: string,
	bookingIds: string[],
) {
	await connectDB();
	return RefundRequest.find({ _id: { $in: bookingIds }, studentId })
		.select("status amountMinor currency")
		.lean();
}

export async function listSandboxReconciliation() {
	await connectDB();
	const [requests, late, mismatches, returns] = await Promise.all([
		RefundRequest.find({ status: "requested" })
			.sort({ createdAt: 1 })
			.limit(50)
			.lean(),
		PaymentEvent.find({
			mode: "sandbox",
			returnedAt: { $exists: false },
			outcome: "refund_required",
		})
			.sort({ verifiedAt: 1, _id: 1 })
			.limit(50)
			.lean(),
		PaymentEvent.find({ mode: "sandbox", outcome: "amount_mismatch" })
			.sort({ verifiedAt: -1 })
			.limit(25)
			.lean(),
		PaymentEvent.find({
			mode: "sandbox",
			outcome: "refund_required",
			returnedAt: { $type: "date" },
		})
			.sort({ returnedAt: -1 })
			.limit(10)
			.lean(),
	]);
	return { requests, events: [...late, ...mismatches], returns };
}

export async function returnUnbookedSandboxPayment(
	adminId: string,
	eventId: string,
) {
	if (!sandboxPaymentsEnabled()) return false;
	const { connection } = await connectDB();
	return connection.transaction(async (session) => {
		const event = await PaymentEvent.findOne({
			_id: eventId,
			mode: "sandbox",
			kind: "succeeded",
			outcome: "refund_required",
		})
			.session(session)
			.lean();
		if (!event) return false;
		if (event.returnedAt) return true;
		const now = new Date();
		const booking = await Booking.exists({
			_id: event.paymentId,
			confirmedAt: null,
			paymentMode: null,
			amountMinor: event.amountMinor,
			currency: event.currency,
			$or: [
				{ status: "cancelled" },
				{ status: "held", holdExpiresAt: { $lte: now } },
			],
		}).session(session);
		if (
			!booking ||
			(await LedgerEntry.exists({ paymentId: event.paymentId }).session(
				session,
			))
		)
			return false;
		const payment = await Payment.updateOne(
			{
				_id: event.paymentId,
				mode: "sandbox",
				status: "refund_required",
				amountMinor: event.amountMinor,
				currency: event.currency,
			},
			{ $set: { status: "late_returned" } },
			{ session },
		);
		if (!payment.modifiedCount) return false;
		await PaymentEvent.updateOne(
			{ _id: eventId },
			{
				$set: { returnedAt: now, returnedBy: adminId },
			},
			{ session },
		);
		return true;
	}, transactionOptions);
}

export async function listStudentLatePayments(
	studentId: string,
	ids: Types.ObjectId[],
) {
	if (!ids.length) return [];
	await connectDB();
	return Booking.aggregate<{
		_id: Types.ObjectId;
		status: "refund_required" | "late_returned";
		amountMinor: number;
		currency: string;
	}>([
		{ $match: { studentId, _id: { $in: ids }, confirmedAt: null } },
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
							status: { $in: ["refund_required", "late_returned"] },
						},
					},
				],
			},
		},
		{ $unwind: "$payment" },
		{
			$project: {
				status: "$payment.status",
				amountMinor: "$payment.amountMinor",
				currency: "$payment.currency",
			},
		},
	]);
}
