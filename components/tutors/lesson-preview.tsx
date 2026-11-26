import { LocalTime } from "@/components/tutors/local-time";
import { formatLessonPrice } from "@/lib/booking-terms";
import type { PublicTutorProfileDTO } from "@/lib/types";

export function LessonPreview({ tutor }: { tutor: PublicTutorProfileDTO }) {
	if (!tutor.quote) return <p>Lesson pricing unavailable</p>;
	return (
		<div className="space-y-1 rounded-xl bg-muted p-4">
			<p className="font-semibold">
				{formatLessonPrice(tutor.quote.amountMinor, tutor.quote.currency)} total
				· {tutor.duration} min
			</p>
			<p className="text-sm">
				{tutor.nextStart ? (
					<>
						Next opening · <LocalTime value={tutor.nextStart} />
					</>
				) : (
					"No opening for this length in the next seven days."
				)}
			</p>
		</div>
	);
}
