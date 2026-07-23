import { TutorDirectory } from "@/components/tutors/tutor-directory";
import { requireUser } from "@/lib/permissions";
import { getApprovedTutorProfiles } from "@/lib/tutors";

export default async function TutorsPage() {
	await requireUser();
	const profiles = await getApprovedTutorProfiles();

	return (
		<main className="flex-1 bg-background py-8 sm:py-10">
			<section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<header className="mb-7 flex flex-col gap-2 border-b border-border pb-5">
					<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
						Verified educators
					</p>
					<h1 className="text-3xl tracking-tight text-foreground sm:text-4xl">
						Find a tutor
					</h1>
					<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
						Explore approved tutors, compare their teaching focus, and send a lesson
						request when one feels right for your goal.
					</p>
				</header>
				<TutorDirectory profiles={profiles} />
			</section>
		</main>
	);
}
