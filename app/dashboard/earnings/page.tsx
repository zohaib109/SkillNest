import { LocalTime } from "@/components/tutors/local-time";
import { formatLessonPrice } from "@/lib/booking-terms";
import { tutorSandboxStatement } from "@/lib/financial-statements";
import { requireVerifiedRole } from "@/lib/permissions";

const labels = {
	platform_commission: "Platform fee",
	pending_tutor_earning: "Pending tutor earnings",
	commission_refund: "Platform fee reversal",
	pending_earning_refund: "Tutor earnings reversal",
};
export default async function EarningsPage() {
	const session = await requireVerifiedRole("tutor");
	const statement = await tutorSandboxStatement(session.user.id);
	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<header>
				<h1 className="text-3xl">Tutor earnings</h1>
				<p className="mt-2 text-muted-foreground">
					Sandbox activity. These amounts are simulated and cannot be withdrawn.
				</p>
			</header>
			{statement.totals.length === 0 ? (
				<p>No sandbox earnings have been posted.</p>
			) : (
				<>
					<div className="grid gap-4 sm:grid-cols-2">
						{statement.totals.map((row) => (
							<section
								key={row._id}
								className="rounded-xl border border-border bg-card p-4"
							>
								<h2 className="text-xl">{row._id} statement</h2>
								<dl className="mt-3 grid grid-cols-[1fr_auto] gap-2 text-sm">
									<dt>Lesson payments</dt>
									<dd>{formatLessonPrice(row.captured, row._id)}</dd>
									<dt>Student refunds</dt>
									<dd>{formatLessonPrice(-row.refunded || 0, row._id)}</dd>
									<dt>Platform fee after refunds</dt>
									<dd>{formatLessonPrice(row.commission, row._id)}</dd>
									<dt className="font-semibold">Pending tutor earnings</dt>
									<dd className="font-semibold">
										{formatLessonPrice(row.pending, row._id)}
									</dd>
								</dl>
							</section>
						))}
					</div>
					<section className="space-y-2">
						<h2 className="text-xl">Latest entries</h2>
						<p className="text-sm text-muted-foreground">
							Up to 40 entries. The statements above include the full ledger.
						</p>
						<ul className="divide-y divide-border">
							{statement.recent.map((entry) => (
								<li key={entry._id} className="py-3">
									<div className="flex flex-wrap justify-between gap-2">
										<strong>{labels[entry.kind]}</strong>
										<span>
											{formatLessonPrice(entry.amountMinor, entry.currency)}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										<LocalTime value={entry.recordedAt.toISOString()} /> ·
										Booking {String(entry.paymentId)}
									</p>
								</li>
							))}
						</ul>
					</section>
				</>
			)}
		</div>
	);
}
