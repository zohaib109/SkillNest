import { AvailabilityEditor } from "@/components/tutors/availability-editor";
import { requireRole } from "@/lib/permissions";
import { getTutorProfileByUserId } from "@/lib/tutors";

export default async function AvailabilityPage() {
	const session = await requireRole("tutor");
	const profile = await getTutorProfileByUserId(session.user.id);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl tracking-tight text-foreground">
					Availability
				</h1>
				<p className="mt-1 text-muted-foreground">
					Set your weekly teaching hours. Times are interpreted in your profile
					timezone
					{profile?.timezone ? ` (${profile.timezone})` : ""}.
				</p>
			</div>
			<AvailabilityEditor initial={profile} />
		</div>
	);
}
