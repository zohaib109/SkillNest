"use client";

import { useActionState } from "react";
import {
	decideSandboxRefund,
	returnLateSandboxCapture,
} from "@/actions/refunds";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function LateReturnForm({ eventId }: { eventId: string }) {
	const [error, action, pending] = useActionState(returnLateSandboxCapture, "");
	return (
		<form action={action} className="space-y-2">
			<input type="hidden" name="eventId" value={eventId} />
			<Button type="submit" size="sm" variant="outline" disabled={pending}>
				Simulate full return
			</Button>
			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}
		</form>
	);
}

export function RefundReviewForm({
	bookingId,
	canApprove,
}: {
	bookingId: string;
	canApprove: boolean;
}) {
	const [error, action, pending] = useActionState(decideSandboxRefund, "");
	return (
		<form action={action} className="space-y-2">
			<input type="hidden" name="bookingId" value={bookingId} />
			<label
				htmlFor={`review-${bookingId}`}
				className="block text-sm font-medium"
			>
				Review note
			</label>
			<Textarea
				id={`review-${bookingId}`}
				name="note"
				required
				minLength={5}
				maxLength={500}
			/>
			<div className="flex flex-wrap gap-2">
				{canApprove && (
					<Button
						type="submit"
						name="decision"
						value="approved"
						size="sm"
						disabled={pending}
					>
						Approve simulated refund
					</Button>
				)}
				<Button
					type="submit"
					name="decision"
					value="rejected"
					size="sm"
					variant="outline"
					disabled={pending}
				>
					Decline request
				</Button>
			</div>
			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}
		</form>
	);
}
