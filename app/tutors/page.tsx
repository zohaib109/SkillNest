import Link from "next/link";
import { SaveTutorButton } from "@/components/tutors/save-tutor-button";
import { buttonVariants } from "@/components/ui/button";
import {
	CURRENCIES,
	LANGUAGES,
	LESSON_DURATIONS,
	SUBJECTS,
} from "@/lib/constants";
import { requireVerifiedRole } from "@/lib/permissions";
import {
	parseTutorSearchParams,
	type TutorSearchFilters,
} from "@/lib/tutor-search";
import { findApprovedTutors } from "@/lib/tutors";

type SearchParams = Record<string, string | string[] | undefined>;

function pageHref(filters: TutorSearchFilters, page: number) {
	const params = new URLSearchParams();
	if (filters.query) params.set("q", filters.query);
	if (filters.subject) params.set("subject", filters.subject);
	if (filters.language) params.set("language", filters.language);
	if (filters.currency) params.set("currency", filters.currency);
	if (filters.duration) params.set("duration", String(filters.duration));
	if (filters.minRate !== undefined) {
		params.set("minRate", String(filters.minRate));
	}
	if (filters.maxRate !== undefined) {
		params.set("maxRate", String(filters.maxRate));
	}
	if (filters.sort !== "recommended") params.set("sort", filters.sort);
	if (filters.savedOnly) params.set("saved", "1");
	if (page > 1) params.set("page", String(page));
	const query = params.toString();
	return query ? `/tutors?${query}` : "/tutors";
}

function initials(name: string) {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("") || "T"
	);
}

export default async function TutorsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const session = await requireVerifiedRole("student");
	const filters = parseTutorSearchParams(await searchParams);
	const result = await findApprovedTutors(filters, session.user.id);
	const savedTutorIds = new Set(result.savedTutorIds);

	return (
		<main className="flex-1 bg-background">
			<div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
				<header className="flex flex-col gap-2">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
						Approved tutors
					</p>
					<h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
						Find your tutor
					</h1>
					<p className="max-w-2xl text-muted-foreground">
						Compare subjects, languages, lesson lengths, and rates from profiles
						reviewed by SkillNest.
					</p>
				</header>

				<form
					method="get"
					className="grid gap-4 rounded-3xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
				>
					<label className="flex flex-col gap-1.5 sm:col-span-2">
						<span className="text-xs font-semibold text-foreground">
							Search
						</span>
						<input
							name="q"
							defaultValue={filters.query}
							maxLength={80}
							placeholder="Name, subject, or keyword"
							className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
						/>
					</label>
					<FilterSelect name="subject" label="Subject" value={filters.subject}>
						{SUBJECTS.map((subject) => (
							<option key={subject} value={subject}>
								{subject}
							</option>
						))}
					</FilterSelect>
					<FilterSelect
						name="language"
						label="Language"
						value={filters.language}
					>
						{LANGUAGES.map((language) => (
							<option key={language} value={language}>
								{language}
							</option>
						))}
					</FilterSelect>
					<FilterSelect
						name="currency"
						label="Currency"
						value={filters.currency}
					>
						{CURRENCIES.map((currency) => (
							<option key={currency.code} value={currency.code}>
								{currency.code}
							</option>
						))}
					</FilterSelect>
					<FilterSelect
						name="duration"
						label="Lesson length"
						value={filters.duration ? String(filters.duration) : ""}
					>
						{LESSON_DURATIONS.map((duration) => (
							<option key={duration} value={duration}>
								{duration} minutes
							</option>
						))}
					</FilterSelect>
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-semibold text-foreground">
							Minimum rate
						</span>
						<input
							type="number"
							name="minRate"
							min="0"
							step="1"
							defaultValue={filters.minRate}
							placeholder="Any"
							className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
						/>
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-semibold text-foreground">
							Maximum rate
						</span>
						<input
							type="number"
							name="maxRate"
							min="0"
							step="1"
							defaultValue={filters.maxRate}
							placeholder="Any"
							className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
						/>
					</label>
					<FilterSelect name="sort" label="Sort by" value={filters.sort}>
						<option value="recommended">Recommended</option>
						<option value="rating">Highest rated</option>
						<option value="price_asc">Lowest rate</option>
						<option value="price_desc">Highest rate</option>
						<option value="newest">Recently approved</option>
					</FilterSelect>
					<label className="flex h-10 items-center gap-2 self-end rounded-xl border border-input bg-background px-3 text-sm text-foreground">
						<input
							type="checkbox"
							name="saved"
							value="1"
							defaultChecked={filters.savedOnly}
							className="size-4 accent-primary"
						/>
						Saved tutors only
					</label>
					<div className="flex items-end gap-2 lg:col-span-2 lg:justify-end">
						<Link
							href="/tutors"
							className={buttonVariants({ variant: "ghost" })}
						>
							Clear
						</Link>
						<button
							type="submit"
							className={buttonVariants({ variant: "default" })}
						>
							Apply filters
						</button>
					</div>
				</form>

				<div className="flex items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground">
						{result.total} approved {result.total === 1 ? "tutor" : "tutors"}
					</p>
					{result.pageCount > 1 && (
						<p className="text-sm text-muted-foreground">
							Page {result.page} of {result.pageCount}
						</p>
					)}
				</div>

				{result.tutors.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center">
						<h2 className="text-xl text-foreground">
							No tutors match those filters
						</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Try clearing a filter or widening the rate range.
						</p>
					</div>
				) : (
					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{result.tutors.map((tutor) => (
							<article
								key={tutor.id}
								className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-6"
							>
								<div className="flex items-start gap-4">
									<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
										{initials(tutor.userName)}
									</div>
									<div className="min-w-0">
										<h2 className="truncate text-xl text-foreground">
											{tutor.userName || "SkillNest Tutor"}
										</h2>
										<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
											{tutor.headline}
										</p>
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									{tutor.subjects.slice(0, 3).map((subject) => (
										<span
											key={subject}
											className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
										>
											{subject}
										</span>
									))}
								</div>
								<div className="grid grid-cols-2 gap-3 text-sm">
									<CardFact
										label="Rate"
										value={`${tutor.currency} ${tutor.hourlyRate}/hour`}
									/>
									<CardFact
										label="Rating"
										value={
											tutor.reviewCount
												? `${tutor.ratingAverage.toFixed(1)} (${tutor.reviewCount})`
												: "New tutor"
										}
									/>
									<CardFact label="From" value={tutor.country} />
									<CardFact
										label="Lessons"
										value={`${tutor.lessonDurations.join(", ")} min`}
									/>
								</div>
								<div className="mt-auto grid grid-cols-2 gap-2">
									<SaveTutorButton
										profileId={tutor.id}
										initialSaved={savedTutorIds.has(tutor.id)}
									/>
									<Link
										href={`/tutors/${tutor.slug}`}
										className={buttonVariants({ variant: "default" })}
									>
										View profile
									</Link>
								</div>
							</article>
						))}
					</div>
				)}

				{result.pageCount > 1 && (
					<nav
						aria-label="Tutor result pages"
						className="flex items-center justify-center gap-3"
					>
						{result.page > 1 ? (
							<Link
								href={pageHref(filters, result.page - 1)}
								className={buttonVariants({ variant: "outline" })}
							>
								Previous
							</Link>
						) : (
							<span />
						)}
						<span className="text-sm text-muted-foreground">
							{result.page} / {result.pageCount}
						</span>
						{result.page < result.pageCount ? (
							<Link
								href={pageHref(filters, result.page + 1)}
								className={buttonVariants({ variant: "outline" })}
							>
								Next
							</Link>
						) : (
							<span />
						)}
					</nav>
				)}
			</div>
		</main>
	);
}

function FilterSelect({
	name,
	label,
	value,
	children,
}: {
	name: string;
	label: string;
	value: string;
	children: React.ReactNode;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-xs font-semibold text-foreground">{label}</span>
			<select
				name={name}
				defaultValue={value}
				className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 [&>option]:bg-card"
			>
				<option value="">Any</option>
				{children}
			</select>
		</label>
	);
}

function CardFact({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="font-semibold text-foreground">{value}</p>
		</div>
	);
}
