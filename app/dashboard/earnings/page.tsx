import Link from "next/link";
import { getTutorRequestSummary } from "@/lib/lesson-requests";
import { requireRole } from "@/lib/permissions";

export default async function TutorEarningsPage() {
	const session = await requireRole("tutor");
	const summary = await getTutorRequestSummary(session.user.id);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
					Teaching workspace
				</p>
				<h1 className="mt-1 text-3xl tracking-tight text-foreground">Earnings & activity</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Track demand now; lesson payments and payouts will be added once booking is enabled.
				</p>
			</header>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric label="Estimated earnings" value="$0" detail="Payments are not enabled yet" />
				<Metric label="Total requests" value={String(summary.total)} detail="All time" />
				<Metric label="Accepted" value={String(summary.accepted)} detail="Ready for next steps" />
				<Metric
					label="Acceptance rate"
					value={summary.acceptanceRate === null ? "—" : `${summary.acceptanceRate}%`}
					detail="Based on answered requests"
				/>
			</div>

			<div className="rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6">
				<h2 className="text-lg font-semibold text-foreground">Keep your momentum visible</h2>
				<p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
					A complete profile, current availability, and an intro video give students the
					context they need to send a confident request.
				</p>
				<Link href="/dashboard/requests" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
					Review lesson requests →
				</Link>
			</div>
		</div>
	);
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
	return (
		<div className="rounded-3xl border border-border bg-card p-4 shadow-2xs">
			<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
			<p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{detail}</p>
		</div>
	);
}
