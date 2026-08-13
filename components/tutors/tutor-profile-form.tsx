"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
	saveTutorProfile,
	submitTutorProfileForReview,
} from "@/actions/tutors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	CURRENCIES,
	LANGUAGES,
	LESSON_DURATIONS,
	SUBJECTS,
} from "@/lib/constants";
import type { TutorProfileDTO, TutorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIMEZONES: string[] =
	typeof Intl !== "undefined" &&
	"supportedValuesOf" in Intl &&
	typeof (Intl as { supportedValuesOf?: unknown }).supportedValuesOf ===
		"function"
		? (
				Intl as unknown as {
					supportedValuesOf: (key: string) => string[];
				}
			).supportedValuesOf("timeZone")
		: ["UTC", "Asia/Karachi", "Europe/London", "America/New_York"];

const statusStyles: Record<TutorStatus, string> = {
	draft: "bg-muted text-muted-foreground",
	pending_review: "bg-amber-100 text-amber-700",
	approved: "bg-emerald-100 text-emerald-700",
	rejected: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<TutorStatus, string> = {
	draft: "Draft",
	pending_review: "Pending Review",
	approved: "Approved & Live",
	rejected: "Changes Requested",
};

export function TutorProfileForm({
	initial,
}: {
	initial: TutorProfileDTO | null;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const status: TutorStatus = initial?.status ?? "draft";
	const [headline, setHeadline] = useState(initial?.headline ?? "");
	const [bio, setBio] = useState(initial?.bio ?? "");
	const [subjects, setSubjects] = useState<string[]>(initial?.subjects ?? []);
	const [languages, setLanguages] = useState<string[]>(
		initial?.languages ?? [],
	);
	const [hourlyRate, setHourlyRate] = useState(
		initial?.hourlyRate ? String(initial.hourlyRate) : "",
	);
	const [currency, setCurrency] = useState(initial?.currency || "USD");
	const [introVideoUrl, setIntroVideoUrl] = useState(
		initial?.introVideoUrl ?? "",
	);
	const [country, setCountry] = useState(initial?.country ?? "");
	const [timezone, setTimezone] = useState(initial?.timezone || "Asia/Karachi");
	const [lessonDurations, setLessonDurations] = useState<number[]>(
		initial?.lessonDurations ?? [60],
	);

	function toggleSubject(value: string) {
		setSubjects((prev) =>
			prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
		);
	}

	function toggleLanguage(value: string) {
		setLanguages((prev) =>
			prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
		);
	}

	function toggleDuration(value: number) {
		setLessonDurations((prev) =>
			prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
		);
	}

	function buildInput() {
		return {
			headline: headline.trim(),
			bio: bio.trim(),
			subjects,
			languages,
			hourlyRate: Number(hourlyRate) || 0,
			currency,
			introVideoUrl: introVideoUrl.trim(),
			country: country.trim(),
			timezone,
			lessonDurations,
		};
	}

	function handleSave() {
		setFeedback(null);
		startTransition(async () => {
			const result = await saveTutorProfile(buildInput());
			if (result.success) {
				setFeedback({
					type: "success",
					message:
						status === "approved" || status === "pending_review"
							? "Changes saved as a draft. Submit them for a new review when ready."
							: "Profile saved.",
				});
				router.refresh();
			} else {
				setFeedback({ type: "error", message: result.error });
			}
		});
	}

	function handleSubmitForReview() {
		setFeedback(null);
		startTransition(async () => {
			const saveResult = await saveTutorProfile(buildInput());
			if (!saveResult.success) {
				setFeedback({ type: "error", message: saveResult.error });
				return;
			}
			const submitResult = await submitTutorProfileForReview();
			if (submitResult.success) {
				setFeedback({
					type: "success",
					message: "Submitted for admin review!",
				});
				router.refresh();
			} else {
				setFeedback({ type: "error", message: submitResult.error });
			}
		});
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Status banner */}
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4">
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-foreground">
						Profile status
					</span>
					<span
						className={cn(
							"inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
							statusStyles[status],
						)}
					>
						{statusLabels[status]}
					</span>
				</div>
				{status === "rejected" && initial?.rejectionReason && (
					<p className="text-sm text-destructive">
						Reason: {initial.rejectionReason}
					</p>
				)}
			</div>

			{feedback && (
				<div
					className={cn(
						"rounded-lg border px-4 py-3 text-sm",
						feedback.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-700"
							: "border-destructive/30 bg-destructive/10 text-destructive",
					)}
				>
					{feedback.message}
				</div>
			)}

			{(status === "approved" || status === "pending_review") && (
				<div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
					Editing and saving moderated profile details returns the profile to
					draft and requires a new admin review.
				</div>
			)}

			{/* Headline */}
			<Field label="Headline" hint="A short, catchy tagline (10–120 chars).">
				<Input
					value={headline}
					onChange={(e) => setHeadline(e.target.value)}
					placeholder="e.g. Experienced Math tutor for high school & SAT"
					maxLength={120}
				/>
			</Field>

			{/* Bio */}
			<Field
				label="Bio"
				hint="Tell students about your experience and teaching style (50–2000 chars)."
			>
				<Textarea
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					placeholder="Describe your background, qualifications, and how you help students succeed…"
					rows={6}
					maxLength={2000}
				/>
			</Field>

			{/* Subjects */}
			<Field label="Subjects" hint="Select all subjects you teach.">
				<div className="flex flex-wrap gap-2">
					{SUBJECTS.map((subject) => (
						<Chip
							key={subject}
							active={subjects.includes(subject)}
							onClick={() => toggleSubject(subject)}
						>
							{subject}
						</Chip>
					))}
				</div>
			</Field>

			{/* Languages */}
			<Field label="Languages" hint="Languages you can teach in.">
				<div className="flex flex-wrap gap-2">
					{LANGUAGES.map((language) => (
						<Chip
							key={language}
							active={languages.includes(language)}
							onClick={() => toggleLanguage(language)}
						>
							{language}
						</Chip>
					))}
				</div>
			</Field>

			{/* Rate + currency */}
			<div className="grid gap-6 sm:grid-cols-2">
				<Field label="Hourly rate">
					<Input
						type="number"
						min={1}
						max={10000}
						value={hourlyRate}
						onChange={(e) => setHourlyRate(e.target.value)}
						placeholder="e.g. 25"
					/>
				</Field>
				<Field label="Currency">
					<Select
						value={currency}
						onChange={(e) => setCurrency(e.target.value)}
					>
						{CURRENCIES.map((c) => (
							<option key={c.code} value={c.code}>
								{c.label}
							</option>
						))}
					</Select>
				</Field>
			</div>

			{/* Lesson durations */}
			<Field
				label="Lesson durations"
				hint="Fixed lesson lengths students can book (minutes)."
			>
				<div className="flex flex-wrap gap-2">
					{LESSON_DURATIONS.map((duration) => (
						<Chip
							key={duration}
							active={lessonDurations.includes(duration)}
							onClick={() => toggleDuration(duration)}
						>
							{duration} min
						</Chip>
					))}
				</div>
			</Field>

			{/* Intro video */}
			<Field
				label="Intro video URL"
				hint="Optional. YouTube or Vimeo link only."
			>
				<Input
					type="url"
					value={introVideoUrl}
					onChange={(e) => setIntroVideoUrl(e.target.value)}
					placeholder="https://youtube.com/watch?v=…"
				/>
			</Field>

			{/* Country + timezone */}
			<div className="grid gap-6 sm:grid-cols-2">
				<Field label="Country">
					<Input
						value={country}
						onChange={(e) => setCountry(e.target.value)}
						placeholder="e.g. Pakistan"
					/>
				</Field>
				<Field label="Timezone">
					<Select
						value={timezone}
						onChange={(e) => setTimezone(e.target.value)}
					>
						{TIMEZONES.map((tz) => (
							<option key={tz} value={tz}>
								{tz}
							</option>
						))}
					</Select>
				</Field>
			</div>

			{/* Actions */}
			<div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
				<Button
					type="button"
					variant="outline"
					onClick={handleSave}
					disabled={isPending}
				>
					{isPending ? "Saving…" : "Save Draft"}
				</Button>
				<Button
					type="button"
					onClick={handleSubmitForReview}
					disabled={
						isPending || status === "approved" || status === "pending_review"
					}
				>
					{status === "approved"
						? "Already Approved"
						: status === "pending_review"
							? "Awaiting Review"
							: "Submit for Review"}
				</Button>
			</div>
		</div>
	);
}

function Field({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-0.5">
				<span className="text-sm font-medium text-foreground">{label}</span>
				{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
			</div>
			{children}
		</div>
	);
}

function Chip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-full border px-3 py-1.5 text-sm transition-colors",
				active
					? "border-primary bg-primary/10 text-primary"
					: "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}
