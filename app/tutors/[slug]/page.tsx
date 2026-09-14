import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveTutorButton } from "@/components/tutors/save-tutor-button";
import { buttonVariants } from "@/components/ui/button";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { requireVerifiedRole } from "@/lib/permissions";
import { getApprovedTutorBySlug, isTutorSaved } from "@/lib/tutors";

function videoEmbedUrl(value: string) {
	if (!value) return null;
	try {
		const url = new URL(value);
		const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
		if (hostname === "youtu.be") {
			const id = url.pathname.split("/").filter(Boolean)[0];
			return id
				? `https://www.youtube.com/embed/${encodeURIComponent(id)}`
				: null;
		}
		if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
			const id =
				url.searchParams.get("v") ??
				url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
			return id
				? `https://www.youtube.com/embed/${encodeURIComponent(id)}`
				: null;
		}
		if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) {
			const id = url.pathname.split("/").find((part) => /^\d+$/.test(part));
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
	const session = await requireVerifiedRole("student");
	const { slug } = await params;
	if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
	const tutor = await getApprovedTutorBySlug(slug);
	if (!tutor) notFound();
	const embedUrl = videoEmbedUrl(tutor.introVideoUrl);
	const saved = await isTutorSaved(session.user.id, tutor.id);

	return (
		<main className="flex-1 bg-background">
			<div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8">
				<div className="flex flex-col gap-8">
					<Link
						href="/tutors"
						className="text-sm font-medium text-primary hover:underline"
					>
						← Back to tutors
					</Link>
					<header className="rounded-3xl border border-border bg-white p-6 sm:p-8">
						<p className="text-sm font-semibold text-primary">
							SkillNest approved tutor
						</p>
						<h1 className="mt-2 text-4xl tracking-tight text-foreground">
							{tutor.userName || "SkillNest Tutor"}
						</h1>
						<p className="mt-3 text-lg text-muted-foreground">
							{tutor.headline}
						</p>
						<div className="mt-5 flex flex-wrap gap-2">
							{tutor.subjects.map((subject) => (
								<span
									key={subject}
									className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
								>
									{subject}
								</span>
							))}
						</div>
					</header>

					<section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
						<h2 className="text-2xl text-foreground">About</h2>
						<p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
							{tutor.bio}
						</p>
					</section>

					{embedUrl && (
						<section className="overflow-hidden rounded-3xl border border-border bg-white">
							<div className="aspect-video">
								<iframe
									src={embedUrl}
									title={`${tutor.userName} introduction`}
									className="size-full"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
								/>
							</div>
						</section>
					)}

					<section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
						<h2 className="text-2xl text-foreground">Weekly availability</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Times are shown in the tutor&apos;s timezone: {tutor.timezone}.
						</p>
						<div className="mt-5 divide-y divide-border/60">
							{tutor.availabilityRules.map((rule) => (
								<div
									key={`${rule.dayOfWeek}-${rule.startTime}-${rule.endTime}`}
									className="flex items-center justify-between gap-4 py-3 text-sm"
								>
									<span className="font-medium text-foreground">
										{DAYS_OF_WEEK[rule.dayOfWeek]}
									</span>
									<span className="font-mono text-muted-foreground">
										{rule.startTime}–{rule.endTime}
									</span>
								</div>
							))}
						</div>
					</section>
				</div>

				<aside className="h-fit rounded-3xl border border-border bg-white p-6 lg:sticky lg:top-24">
					<p className="text-3xl font-bold text-foreground">
						{tutor.currency} {tutor.hourlyRate}
					</p>
					<p className="text-sm text-muted-foreground">per hour</p>
					<dl className="mt-6 space-y-4 text-sm">
						<div>
							<dt className="text-muted-foreground">Rating</dt>
							<dd className="font-semibold text-foreground">
								{tutor.reviewCount
									? `${tutor.ratingAverage.toFixed(1)} from ${tutor.reviewCount} reviews`
									: "New tutor"}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Languages</dt>
							<dd className="font-semibold text-foreground">
								{tutor.languages.join(", ")}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Lesson lengths</dt>
							<dd className="font-semibold text-foreground">
								{tutor.lessonDurations
									.map((duration) => `${duration} min`)
									.join(", ")}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Location</dt>
							<dd className="font-semibold text-foreground">{tutor.country}</dd>
						</div>
					</dl>
					<span
						className={buttonVariants({
							variant: "default",
							className: "mt-6 w-full opacity-60",
						})}
					>
						Booking opens soon
					</span>
					<div className="mt-2">
						<SaveTutorButton
							profileId={tutor.id}
							initialSaved={saved}
							fullWidth
						/>
					</div>
				</aside>
			</div>
		</main>
	);
}
