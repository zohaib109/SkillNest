"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TutorProfileDTO } from "@/lib/types";

export function TutorDirectory({ profiles }: { profiles: TutorProfileDTO[] }) {
	const [query, setQuery] = useState("");
	const [subject, setSubject] = useState("all");
	const subjects = useMemo(
		() =>
			Array.from(
				new Set(profiles.flatMap((profile) => profile.subjects)),
			).sort(),
		[profiles],
	);
	const filtered = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return profiles.filter((profile) => {
			const matchesSubject =
				subject === "all" || profile.subjects.includes(subject);
			const searchable = [
				profile.userName,
				profile.headline,
				profile.subjects.join(" "),
				profile.languages.join(" "),
			].join(" ");
			return (
				matchesSubject && searchable.toLowerCase().includes(normalizedQuery)
			);
		});
	}, [profiles, query, subject]);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1fr_13rem] sm:p-4">
				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search tutors, subjects, or languages"
					aria-label="Search tutors"
				/>
				<Select
					value={subject}
					onChange={(event) => setSubject(event.target.value)}
				>
					<option value="all">All subjects</option>
					{subjects.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</Select>
			</div>

			{filtered.length ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filtered.map((profile) => (
						<Link
							key={profile.id}
							href={`/tutors/${profile.slug}`}
							className="group flex min-h-64 flex-col rounded-3xl border border-border bg-card p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
						>
							<div className="flex items-start gap-3">
								<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-bold text-primary">
									{profile.photoUrl ? (
										// biome-ignore lint/performance/noImgElement: profile images are stored locally as compressed data URLs
										<img
											src={profile.photoUrl}
											alt={`${profile.userName}'s profile`}
											className="h-full w-full object-cover"
										/>
									) : (
										profile.userName.charAt(0).toUpperCase() || "T"
									)}
								</div>
								<div className="min-w-0">
									<h2 className="truncate text-lg text-foreground">
										{profile.userName}
									</h2>
									<p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
										{profile.headline}
									</p>
								</div>
							</div>
							<div className="mt-4 flex flex-wrap gap-1.5">
								{profile.subjects.slice(0, 3).map((item) => (
									<span
										key={item}
										className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
									>
										{item}
									</span>
								))}
							</div>
							<p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
								{profile.bio}
							</p>
							<div className="mt-auto flex items-center justify-between border-t border-border pt-4">
								<span className="text-sm font-semibold text-foreground">
									{profile.currency} {profile.hourlyRate}/hr
								</span>
								<span className="text-sm font-semibold text-primary group-hover:underline">
									View profile →
								</span>
							</div>
						</Link>
					))}
				</div>
			) : (
				<div className="rounded-3xl border border-dashed border-border bg-card px-5 py-12 text-center">
					<p className="text-sm text-muted-foreground">
						No tutors match that search yet. Try another subject or phrase.
					</p>
				</div>
			)}
		</div>
	);
}
