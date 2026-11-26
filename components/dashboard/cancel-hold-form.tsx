"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { cancelLessonHold } from "@/actions/bookings";
import { LocalTime } from "@/components/tutors/local-time";
import { Button } from "@/components/ui/button";

export function CancelHoldForm({
	bookingId,
	expiresAt,
}: {
	bookingId: string;
	expiresAt: string;
}) {
	const [error, action, pending] = useActionState(cancelLessonHold, "");
	const router = useRouter();
	useEffect(() => {
		const delay = Math.max(0, Date.parse(expiresAt) - Date.now() + 1000);
		const timer = window.setTimeout(() => router.refresh(), delay);
		return () => window.clearTimeout(timer);
	}, [expiresAt, router]);

	return (
		<form action={action} className="space-y-2">
			<input type="hidden" name="bookingId" value={bookingId} />
			<p className="text-sm text-muted-foreground">
				Expires <LocalTime value={expiresAt} />
			</p>
			<Button type="submit" variant="outline" size="sm" disabled={pending}>
				{pending ? "Releasing…" : "Release hold"}
			</Button>
			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}
		</form>
	);
}
