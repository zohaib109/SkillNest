import Link from "next/link";
import { notFound } from "next/navigation";
import { LocalTime } from "@/components/tutors/local-time";
import { formatLessonPrice } from "@/lib/booking-terms";
import { studentSandboxReceipt } from "@/lib/financial-statements";
import { requireVerifiedRole } from "@/lib/permissions";
export default async function ReceiptPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await requireVerifiedRole("student");
	const { id } = await params;
	const receipt = await studentSandboxReceipt(session.user.id, id);
	if (!receipt) notFound();
	const money = (amount: number) => formatLessonPrice(amount, receipt.currency);
	return (
		<article className="mx-auto max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6">
			<Link
				href="/dashboard/bookings"
				className="text-sm text-primary underline"
			>
				Back to my bookings
			</Link>
			<h1 className="text-3xl">Sandbox receipt</h1>
			<p>This receipt records a simulated payment.</p>
			<p>
				{receipt.duration} min with {receipt.tutorName} ·{" "}
				<LocalTime value={receipt.startsAt.toISOString()} />
			</p>
			<dl className="grid grid-cols-[1fr_auto] gap-3">
				<dt>Original payment</dt>
				<dd>{money(receipt.amountMinor)}</dd>
				<dt>Refunded</dt>
				<dd>{money(receipt.refundedMinor)}</dd>
				<dt className="font-semibold">Net paid</dt>
				<dd className="font-semibold">
					{money(receipt.amountMinor - receipt.refundedMinor)}
				</dd>
			</dl>
			{receipt.refundStatus && <p>Refund request · {receipt.refundStatus}</p>}
			<footer className="space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
				<p>
					Payment confirmed ·{" "}
					<LocalTime value={receipt.confirmedAt.toISOString()} />
				</p>
				<p>Booking reference · {id}</p>
			</footer>
		</article>
	);
}
