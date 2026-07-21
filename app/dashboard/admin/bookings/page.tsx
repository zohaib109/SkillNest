import { requireRole } from "@/lib/permissions";

export default async function AdminBookingsPage() {
	await requireRole("admin");
	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-3xl tracking-tight text-foreground">
				Booking Oversight
			</h1>
			<p className="text-muted-foreground">
				Monitor all platform bookings and handle support issues. Coming in Phase
				7.
			</p>
			<div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
				<p className="text-sm text-muted-foreground">
					Booking management and dispute resolution tools coming soon.
				</p>
			</div>
		</div>
	);
}
