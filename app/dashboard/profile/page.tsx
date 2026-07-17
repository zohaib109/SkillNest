export default function TutorProfilePage() {
	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-3xl tracking-tight text-foreground">Tutor Profile</h1>
			<p className="text-muted-foreground">
				Complete your tutor profile to start receiving students. Profile
				management is coming in Phase 3.
			</p>
			<div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
				<p className="text-sm text-muted-foreground">
					Profile editor coming soon. You&apos;ll be able to set your bio,
					subjects, hourly rate, and intro video.
				</p>
			</div>
		</div>
	);
}
