import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonHoldForm } from "@/components/tutors/lesson-hold-form";
import { buttonVariants } from "@/components/ui/button";
import { getBookableWeek } from "@/lib/bookings";
import { requireVerifiedRole } from "@/lib/permissions";
import { sandboxPaymentsEnabled } from "@/lib/sandbox-payments";

export default async function BookTutorPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		duration?: string | string[];
		week?: string | string[];
	}>;
}) {
	const session = await requireVerifiedRole("student");
	const { slug } = await params;
	if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
	const query = await searchParams;
	const requestedWeek =
		typeof query.week === "string" && /^\d{1,2}$/.test(query.week)
			? Number(query.week)
			: 0;
	const requestedDuration =
		typeof query.duration === "string" ? Number(query.duration) : 0;
	const booking = await getBookableWeek(
		slug,
		session.user.id,
		requestedDuration,
		requestedWeek,
	);
	if (!booking) notFound();
	const href = (duration: number, week: number) =>
		`/tutors/${slug}/book?duration=${duration}&week=${week}`;
	const { duration, durations, week, weekCount, quote, slots, profileId } =
		booking;

	return (
		<main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-8 sm:px-6 sm:py-12">
			<Link
				href={`/tutors/${slug}`}
				className="text-sm font-medium text-primary hover:underline"
			>
				← Tutor profile
			</Link>
			<h1 className="text-3xl tracking-tight sm:text-4xl">
				Choose a time with {booking.tutorName}
			</h1>
			{duration && quote ? (
				<section className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
					<nav aria-label="Lesson length" className="flex flex-wrap gap-2">
						{durations.map((item) => (
							<Link
								key={item}
								href={href(item, week)}
								aria-current={duration === item ? "true" : undefined}
								className={buttonVariants({
									variant: duration === item ? "default" : "outline",
									size: "sm",
								})}
							>
								{item} min
							</Link>
						))}
					</nav>
					<nav
						aria-label="Availability week"
						className="flex flex-wrap items-center gap-3 border-y border-border py-3"
					>
						{week > 0 && (
							<Link
								href={href(duration, week - 1)}
								className="text-sm font-medium text-primary hover:underline"
							>
								← Previous week
							</Link>
						)}
						<p className="text-sm text-muted-foreground">
							Week {week + 1} of {weekCount}
						</p>
						{week + 1 < weekCount && (
							<Link
								href={href(duration, week + 1)}
								className="text-sm font-medium text-primary hover:underline"
							>
								Next week →
							</Link>
						)}
					</nav>
					{slots.length ? (
						<LessonHoldForm
							key={`${week}-${duration}-${quote.amountMinor}`}
							profileId={profileId}
							duration={duration}
							{...quote}
							slots={slots}
							canSimulate={sandboxPaymentsEnabled()}
						/>
					) : (
						<p className="text-sm text-muted-foreground">
							There are no available times for this lesson length this week.
						</p>
					)}
				</section>
			) : (
				<p className="text-muted-foreground">
					This tutor has no bookable lessons right now.
				</p>
			)}
		</main>
	);
}
