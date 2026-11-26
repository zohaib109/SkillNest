"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { reserveLesson } from "@/actions/bookings";
import { useLocalTimezone } from "@/components/tutors/local-time";
import { Button } from "@/components/ui/button";
import { formatLessonPrice } from "@/lib/booking-terms";
import { HOLD_MINUTES } from "@/lib/scheduling";

export function LessonHoldForm({
	profileId,
	duration,
	amountMinor,
	currency,
	slots,
	canSimulate,
}: {
	profileId: string;
	duration: number;
	amountMinor: number;
	currency: string;
	slots: string[];
	canSimulate: boolean;
}) {
	const [error, action, pending] = useActionState(reserveLesson, "");
	const router = useRouter();
	const timeZone = useLocalTimezone();
	const dayFormat = new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "long",
		month: "short",
		day: "numeric",
	});
	const timeFormat = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "shortOffset",
	});
	const days = new Map<string, string[]>();
	for (const slot of slots) {
		const day = dayFormat.format(new Date(slot));
		const times = days.get(day) ?? [];
		times.push(slot);
		days.set(day, times);
	}

	return (
		<form action={action} className="space-y-4">
			<input type="hidden" name="profileId" value={profileId} />
			<input type="hidden" name="duration" value={duration} />
			<input type="hidden" name="studentTimezone" value={timeZone} />
			<input type="hidden" name="amountMinor" value={amountMinor} />
			<input type="hidden" name="currency" value={currency} />
			<div className="space-y-2">
				<label htmlFor="lesson-time" className="block text-sm font-medium">
					Lesson start time
				</label>
				<select
					id="lesson-time"
					aria-describedby="lesson-timezone"
					name="startsAt"
					required
					defaultValue=""
					className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground focus-visible:outline-ring"
				>
					<option value="" disabled>
						Choose an available time
					</option>
					{[...days].map(([day, times]) => (
						<optgroup key={day} label={day}>
							{times.map((slot) => (
								<option value={slot} key={slot}>
									{timeFormat.format(new Date(slot))}
								</option>
							))}
						</optgroup>
					))}
				</select>
				<p id="lesson-timezone" className="text-sm text-muted-foreground">
					Displayed in {timeZone}.
				</p>
			</div>
			<p className="text-sm text-muted-foreground">
				{duration} minutes · {formatLessonPrice(amountMinor, currency)} ·{" "}
				{HOLD_MINUTES}-minute hold
			</p>
			<p className="text-sm text-muted-foreground">
				{canSimulate
					? "You can simulate payment from My Bookings."
					: "Payment is currently unavailable. Holds expire automatically."}
			</p>
			{error && (
				<div className="space-y-2">
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => router.refresh()}
					>
						Refresh times
					</Button>
				</div>
			)}
			<Button type="submit" disabled={pending}>
				{pending ? "Holding…" : "Hold this time"}
			</Button>
		</form>
	);
}
