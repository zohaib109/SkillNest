import Link from "next/link";
import {
	getLessonRequestsForStudent,
	getTutorRequestSummary,
} from "@/lib/lesson-requests";
import { requireUser } from "@/lib/permissions";
import { getTutorProfileByUserId } from "@/lib/tutors";
import type { TutorStatus } from "@/lib/types";

const profileStatus: Record<
	TutorStatus,
	{ label: string; tone: string; description: string }
> = {
	draft: {
		label: "Profile setup needed",
		tone: "bg-muted text-muted-foreground",
		description:
			"Finish your profile and submit it for review before students can find you.",
	},
	pending_review: {
		label: "Under review",
		tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
		description: "Your profile is private while the SkillNest team reviews it.",
	},
	approved: {
		label: "Profile live",
		tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
		description:
			"Students can now discover your profile and send lesson requests.",
	},
	rejected: {
		label: "Changes requested",
		tone: "bg-destructive/10 text-destructive",
		description: "Update your profile, then submit it again when it is ready.",
	},
};

export default async function DashboardPage() {
	const session = await requireUser();
	const role = session.user.role ?? "student";

	if (role === "tutor") {
		const [profile, summary] = await Promise.all([
			getTutorProfileByUserId(session.user.id),
			getTutorRequestSummary(session.user.id),
		]);
		const status = profile?.status ?? "draft";
		const statusInfo = profileStatus[status];

		return (
			<div className="flex flex-col gap-6">
				<header className="flex flex-col gap-2 border-b border-border pb-5">
					<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
						Tutor workspace
					</p>
					<h1 className="text-3xl tracking-tight text-foreground">
						Welcome back{session.user.name ? `, ${session.user.name}` : ""}
					</h1>
					<p className="text-sm text-muted-foreground">
						Keep your teaching profile current and stay on top of new lesson
						requests.
					</p>
				</header>

				<section className="rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p className="text-sm font-semibold text-foreground">
								Tutor profile status
							</p>
							<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
								{statusInfo.description}
							</p>
							{status === "rejected" && profile?.rejectionReason && (
								<p className="mt-2 text-sm font-medium text-destructive">
									Requested change: {profile.rejectionReason}
								</p>
							)}
						</div>
						<span
							className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusInfo.tone}`}
						>
							{statusInfo.label}
						</span>
					</div>
					<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
						<Link
							href="/dashboard/profile"
							className="font-semibold text-primary hover:underline"
						>
							Edit profile
						</Link>
						{status === "approved" && profile && (
							<Link
								href={`/tutors/${profile.slug}`}
								className="font-semibold text-primary hover:underline"
							>
								View public profile
							</Link>
						)}
					</div>
				</section>

				<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Awaiting decision"
						value={String(summary.pending)}
						detail="Lesson requests"
					/>
					<Metric
						label="Accepted requests"
						value={String(summary.accepted)}
						detail="All time"
					/>
					<Metric
						label="Acceptance rate"
						value={
							summary.acceptanceRate === null
								? "—"
								: `${summary.acceptanceRate}%`
						}
						detail="Answered requests"
					/>
					<Metric
						label="Estimated earnings"
						value="$0"
						detail="Payments coming later"
					/>
				</section>

				<section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
					<WorkspaceCard
						title="Lesson requests"
						description="Review student goals and accept or decline each request."
						href="/dashboard/requests"
						label="Open requests"
					/>
					<WorkspaceCard
						title="Availability"
						description="Keep your weekly teaching windows accurate for interested students."
						href="/dashboard/availability"
						label="Edit availability"
					/>
					<WorkspaceCard
						title="Intro video"
						description="Add a short YouTube or Vimeo introduction to build trust."
						href="/dashboard/intro-video"
						label="Manage video"
					/>
					<WorkspaceCard
						title="Earnings & activity"
						description="See request activity now, with payment reporting ready for the next phase."
						href="/dashboard/earnings"
						label="View activity"
					/>
				</section>
			</div>
		);
	}

	if (role === "student") {
		const requests = await getLessonRequestsForStudent(session.user.id);
		const awaiting = requests.filter(
			(request) => request.status === "pending",
		).length;
		const accepted = requests.filter(
			(request) => request.status === "accepted",
		).length;

		return (
			<div className="flex flex-col gap-6">
				<header className="flex flex-col gap-2 border-b border-border pb-5">
					<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
						Learning workspace
					</p>
					<h1 className="text-3xl tracking-tight text-foreground">
						Welcome back{session.user.name ? `, ${session.user.name}` : ""}
					</h1>
					<p className="text-sm text-muted-foreground">
						Find a tutor, send a focused lesson request, and follow each
						response here.
					</p>
				</header>

				<section className="grid gap-3 sm:grid-cols-3">
					<Metric
						label="Requests sent"
						value={String(requests.length)}
						detail="All time"
					/>
					<Metric
						label="Awaiting response"
						value={String(awaiting)}
						detail="Tutor review"
					/>
					<Metric
						label="Accepted"
						value={String(accepted)}
						detail="Ready for next steps"
					/>
				</section>

				<section className="grid gap-3 lg:grid-cols-2">
					<WorkspaceCard
						title="Find a tutor"
						description="Browse approved educators by subject, teaching focus, and language."
						href="/tutors"
						label="Browse tutors"
					/>
					<WorkspaceCard
						title="My lesson requests"
						description="See which requests are awaiting a response, accepted, or declined."
						href="/dashboard/bookings"
						label="View requests"
					/>
				</section>
			</div>
		);
	}

	return (
		<div className="rounded-3xl border border-border bg-card p-6">
			<h1 className="text-2xl text-foreground">Operations workspace</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				The private review queue is available only to the configured operations
				allowlist.
			</p>
		</div>
	);
}

function Metric({
	label,
	value,
	detail,
}: {
	label: string;
	value: string;
	detail: string;
}) {
	return (
		<div className="rounded-3xl border border-border bg-card p-4 shadow-2xs">
			<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				{label}
			</p>
			<p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{detail}</p>
		</div>
	);
}

function WorkspaceCard({
	title,
	description,
	href,
	label,
}: {
	title: string;
	description: string;
	href: string;
	label: string;
}) {
	return (
		<div className="flex min-h-40 flex-col rounded-3xl border border-border bg-card p-5 shadow-2xs">
			<h2 className="text-base font-semibold text-foreground">{title}</h2>
			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>
			<Link
				href={href}
				className="mt-auto pt-4 text-sm font-semibold text-primary hover:underline"
			>
				{label} →
			</Link>
		</div>
	);
}
