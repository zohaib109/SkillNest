export default function StudentBookingsPage() {
	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-3xl tracking-tight text-foreground">My Bookings</h1>
			<p className="text-muted-foreground">
				Your upcoming and past lessons will appear here. Booking functionality
				is coming in Phase 5.
			</p>
			<div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
				<p className="text-sm text-muted-foreground">
					No bookings yet. Browse tutors to book your first lesson.
				</p>
			</div>
		</div>
	);
}
