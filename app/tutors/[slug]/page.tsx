import Link from "next/link";
import { notFound } from "next/navigation";
import { SlotPicker } from "@/components/bookings/slot-picker";
import { LessonRequestForm } from "@/components/tutors/lesson-request-form";
import { getUpcomingBusyIntervals } from "@/lib/bookings";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { requireUser } from "@/lib/permissions";
import { generateTutorSlotAvailability } from "@/lib/slots";
import { getApprovedTutorProfileBySlug } from "@/lib/tutors";

function getEmbedUrl(videoUrl: string) {
	try {
		const url = new URL(videoUrl);
		const host = url.hostname.replace(/^www\./, "");
		if (host === "youtu.be") {
			const id = url.pathname.split("/").filter(Boolean)[0];
			return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
		}
		if (host === "youtube.com" || host.endsWith(".youtube.com")) {
			const id =
				url.searchParams.get("v") ||
				url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
			return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
		}
		if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
			const id = url.pathname.split("/").filter(Boolean)[0];
			return id ? `https://player.vimeo.com/video/${id}` : null;
		}
	} catch {
		return null;
	}
	return null;
}

export default async function TutorProfilePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const [session, { slug }] = await Promise.all([requireUser(), params]);
	const profile = await getApprovedTutorProfileBySlug(slug);
	if (!profile) notFound();

	const embedUrl = getEmbedUrl(profile.introVideoUrl);
	const bioPreview = profile.bio.slice(0, 280);
	const remainingBio = profile.bio.slice(280);
	const isStudent = session.user.role === "student";
	const isOwnProfile = session.user.id === profile.userId;

	const canBookInstantly =
		isStudent &&
		profile.lessonDurations.length > 0 &&
		profile.availabilityRules.length > 0;
	const slotAvailability = canBookInstantly
		? generateTutorSlotAvailability({
				rules: profile.availabilityRules,
				durations: profile.lessonDurations,
				timeZone: profile.timezone,
				busyIntervals: await getUpcomingBusyIntervals(profile.id),
			})
		: null;

	return (
		<main className="flex-1 bg-background py-7 sm:py-10">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<Link
					href="/tutors"
					className="mb-5 inline-flex text-sm font-semibold text-primary hover:underline"
				>
					← All tutors
				</Link>
				<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
					<section className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xs">
						<div className="flex flex-col gap-5 border-b border-border p-5 sm:flex-row sm:p-7">
							<div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-primary/10 text-3xl font-bold text-primary">
								{profile.photoUrl ? (
									// biome-ignore lint/performance/noImgElement: profile images are stored as local compressed data URLs
									<img
										src={profile.photoUrl}
										alt={`${profile.userName}'s profile`}
										className="h-full w-full object-cover"
									/>
								) : (
									profile.userName.charAt(0).toUpperCase() || "T"
								)}
							</div>
							<div className="min-w-0">
								<p className="text-sm font-semibold text-primary">
									Verified SkillNest tutor
								</p>
								<h1 className="mt-1 text-3xl tracking-tight text-foreground">
									{profile.userName}
								</h1>
								<p className="mt-2 text-base leading-relaxed text-muted-foreground">
									{profile.headline}
								</p>
								<div className="mt-4 flex flex-wrap gap-1.5">
									{profile.subjects.map((subject) => (
										<span
											key={subject}
											className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
										>
											{subject}
										</span>
									))}
								</div>
							</div>
						</div>

						<div className="grid gap-5 p-5 sm:p-7">
							<section>
								<h2 className="text-lg font-semibold text-foreground">
									About {profile.userName}
								</h2>
								<p className="mt-2 text-sm leading-7 text-muted-foreground">
									{bioPreview}
								</p>
								{remainingBio && (
									<details className="group mt-2">
										<summary className="cursor-pointer text-sm font-semibold text-primary marker:hidden hover:underline">
											<span className="group-open:hidden">Read more</span>
											<span className="hidden group-open:inline">
												Show less
											</span>
										</summary>
										<p className="mt-2 text-sm leading-7 text-muted-foreground">
											{remainingBio}
										</p>
									</details>
								)}
							</section>

							<div className="grid gap-4 border-y border-border py-5 sm:grid-cols-2">
								<div>
									<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
										Teaches in
									</p>
									<p className="mt-1 text-sm text-foreground">
										{profile.languages.join(", ")}
									</p>
								</div>
								<div>
									<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
										Weekly availability
									</p>
									<p className="mt-1 text-sm text-foreground">
										{profile.availabilityRules.length
											? `${profile.availabilityRules.length} teaching windows set`
											: "Contact through a request"}
									</p>
								</div>
							</div>

							{profile.availabilityRules.length > 0 && (
								<section>
									<h2 className="text-lg font-semibold text-foreground">
										Typical weekly hours
									</h2>
									<div className="mt-3 flex flex-wrap gap-2">
										{Array.from(
											new Set(
												profile.availabilityRules.map(
													(rule) =>
														`${rule.dayOfWeek}-${rule.startTime}-${rule.endTime}`,
												),
											),
										).map((windowKey) => {
											const [day, start, end] = windowKey.split("-");
											return (
												<span
													key={windowKey}
													className="rounded-xl border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-foreground"
												>
													{DAYS_OF_WEEK[Number(day)].slice(0, 3)} {start}–{end}
												</span>
											);
										})}
									</div>
								</section>
							)}

							{embedUrl && (
								<section>
									<h2 className="mb-3 text-lg font-semibold text-foreground">
										Meet your tutor
									</h2>
									<div className="aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
										<iframe
											src={embedUrl}
											title={`${profile.userName}'s introduction video`}
											className="h-full w-full"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowFullScreen
										/>
									</div>
								</section>
							)}
						</div>
					</section>

					<aside className="sticky top-20 rounded-3xl border border-border bg-card p-5 shadow-2xs">
						<div className="border-b border-border pb-4">
							<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								Starting rate
							</p>
							<p className="mt-1 text-2xl font-bold text-foreground">
								{profile.currency} {profile.hourlyRate}
								<span className="text-sm font-medium text-muted-foreground">
									{" "}
									/ hour
								</span>
							</p>
							<p className="mt-2 text-xs text-muted-foreground">
								Offers {profile.lessonDurations.join(", ")} minute lessons
							</p>
						</div>
						{isStudent ? (
							<div className="flex flex-col gap-6 pt-4">
								{slotAvailability && (
									<section>
										<h2 className="mb-3 text-base font-semibold text-foreground">
											Book a lesson
										</h2>
										<SlotPicker
											tutorName={profile.userName}
											tutorSlug={profile.slug}
											subjects={profile.subjects}
											availability={slotAvailability}
										/>
									</section>
								)}
								<div className="border-t border-border pt-4">
									{canBookInstantly && (
										<p className="mb-3 text-sm font-semibold text-foreground">
											Not sure about timing?
										</p>
									)}
									<LessonRequestForm
										tutorName={profile.userName}
										tutorSlug={profile.slug}
										subjects={profile.subjects}
										durations={profile.lessonDurations}
									/>
								</div>
							</div>
						) : isOwnProfile ? (
							<p className="pt-4 text-sm leading-relaxed text-muted-foreground">
								This is your live profile. Students can send requests from this
								panel.
							</p>
						) : (
							<p className="pt-4 text-sm leading-relaxed text-muted-foreground">
								Lesson requests are available to student accounts.
							</p>
						)}
					</aside>
				</div>
			</div>
		</main>
	);
}
