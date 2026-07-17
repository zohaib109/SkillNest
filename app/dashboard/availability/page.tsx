export default function TutorAvailabilityPage() {
	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-3xl tracking-tight text-foreground">Availability</h1>
			<p className="text-muted-foreground">
				Set your available teaching hours and time slots. Availability editor is
				coming in Phase 5.
			</p>
			<div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
				<p className="text-sm text-muted-foreground">
					You&apos;ll be able to set weekly availability rules and block
					specific dates.
				</p>
			</div>
		</div>
	);
}
