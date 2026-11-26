"use client";

import { useActionState } from "react";
import { runSandboxCheckout } from "@/actions/sandbox-payments";
import { Button } from "@/components/ui/button";

export function SandboxCheckoutForm({ bookingId }: { bookingId: string }) {
	const [error, action, pending] = useActionState(runSandboxCheckout, "");
	return (
		<form action={action} className="space-y-2">
			<input type="hidden" name="bookingId" value={bookingId} />
			<Button type="submit" size="sm" disabled={pending}>
				{pending ? "Simulating…" : "Simulate payment"}
			</Button>
			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}
		</form>
	);
}
