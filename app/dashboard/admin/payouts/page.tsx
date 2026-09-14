import { TEMPORARY_PAYMENT_INSTRUCTIONS as instructions } from "@/lib/payment-instructions";
import { requireRole } from "@/lib/permissions";

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="break-words font-mono text-sm font-medium text-foreground">
				{value}
			</dd>
		</div>
	);
}

export default async function AdminPayoutsPage() {
	await requireRole("admin");

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
			<header className="flex flex-col gap-2">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
					Admin-only temporary setup
				</p>
				<h1 className="text-3xl tracking-tight text-foreground">
					Payments &amp; Payouts
				</h1>
				<p className="max-w-3xl text-muted-foreground">
					Reference the correct receiving account when coordinating a manual
					lesson payment. Automated reconciliation and tutor payout tooling are
					still pending.
				</p>
			</header>

			<div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-sm leading-6 text-foreground">
				<strong>Operational rule:</strong> share payment details only for a
				known student and booking. A transfer never confirms a booking until an
				admin verifies the amount, currency, sender, and booking reference.
				Never request a password, PIN, or one-time code.
			</div>

			<section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
				<div className="mb-5 flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold text-primary">
							{instructions.local.currency}
						</p>
						<h2 className="text-2xl text-foreground">
							{instructions.local.bankName}
						</h2>
					</div>
					<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
						{instructions.local.method}
					</span>
				</div>
				<dl>
					<Detail label="Branch" value={instructions.local.branch} />
					<Detail
						label="Account title"
						value={instructions.local.accountTitle}
					/>
					<Detail
						label="Account number"
						value={instructions.local.accountNumber}
					/>
					<Detail label="IBAN" value={instructions.local.iban} />
				</dl>
			</section>

			<div className="grid gap-6 lg:grid-cols-2">
				{instructions.international.map((account) => (
					<section
						key={account.currency}
						className="rounded-3xl border border-border bg-white p-6 sm:p-8"
					>
						<div className="mb-5 flex items-start justify-between gap-3">
							<div>
								<p className="text-sm font-semibold text-primary">
									{account.currency} · {account.label}
								</p>
								<h2 className="text-2xl text-foreground">{account.bankName}</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									{account.accountLabel} · {account.region}
								</p>
							</div>
							<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
								{account.provider}
							</span>
						</div>
						<dl>
							{"bankAddress" in account && (
								<Detail label="Bank address" value={account.bankAddress} />
							)}
							<Detail
								label={account.routingLabel}
								value={account.routingNumber}
							/>
							<Detail label="Account number" value={account.accountNumber} />
							{"accountType" in account && (
								<Detail label="Account type" value={account.accountType} />
							)}
							<Detail label="Beneficiary" value={account.beneficiaryName} />
						</dl>
					</section>
				))}
			</div>

			<footer className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
				Payment support:{" "}
				<a
					href={`tel:${instructions.contactPhone}`}
					className="font-mono font-semibold text-primary hover:underline"
				>
					{instructions.contactPhone}
				</a>
			</footer>
		</div>
	);
}
