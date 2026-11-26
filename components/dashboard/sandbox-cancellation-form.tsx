"use client";

import { useActionState } from "react";
import { requestSandboxCancellation } from "@/actions/refunds";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SandboxCancellationForm({ bookingId }: { bookingId: string }) {
	const [error, action, pending] = useActionState(
		requestSandboxCancellation,
		"",
	);
	return (
		<details className="w-full border-t border-border pt-3">
			<summary className="w-fit cursor-pointer text-sm font-medium">
				Cancel sandbox lesson
			</summary>
			<form action={action} className="mt-3 space-y-2">
				<input type="hidden" name="bookingId" value={bookingId} />
				<p className="text-sm text-muted-foreground">
					Cancelling immediately frees the time and sends a simulated refund
					request for review.
				</p>
				<label
					htmlFor={`cancel-${bookingId}`}
					className="block text-sm font-medium"
				>
					Reason for cancellation
				</label>
				<Textarea
					id={`cancel-${bookingId}`}
					name="reason"
					required
					minLength={5}
					maxLength={500}
				/>
				<Button
					type="submit"
					size="sm"
					variant="destructive"
					disabled={pending}
				>
					{pending ? "Cancelling…" : "Cancel and request refund"}
				</Button>
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				)}
			</form>
		</details>
	);
}
