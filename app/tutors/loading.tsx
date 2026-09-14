export default function TutorsLoading() {
	return (
		<main className="flex-1 bg-background">
			<div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-10 sm:px-6 lg:px-8">
				<div className="h-12 w-72 rounded-xl bg-muted" />
				<div className="h-52 rounded-3xl bg-muted" />
				<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
					{[0, 1, 2, 3, 4, 5].map((item) => (
						<div key={item} className="h-80 rounded-3xl bg-muted" />
					))}
				</div>
			</div>
		</main>
	);
}
