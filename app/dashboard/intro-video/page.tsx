import { IntroVideoForm } from "@/components/tutors/intro-video-form";
import { requireRole } from "@/lib/permissions";
import { getTutorProfileByUserId } from "@/lib/tutors";

export default async function IntroVideoPage() {
	const session = await requireRole("tutor");
	const profile = await getTutorProfileByUserId(session.user.id);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
					Your profile
				</p>
				<h1 className="mt-1 text-3xl tracking-tight text-foreground">Intro video</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Give students a quick sense of your teaching style before they request a lesson.
				</p>
			</header>
			<IntroVideoForm initialUrl={profile?.introVideoUrl ?? ""} />
		</div>
	);
}
