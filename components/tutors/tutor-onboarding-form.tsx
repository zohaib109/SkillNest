"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
	saveAvailability,
	saveTutorProfile,
	submitTutorProfileForReview,
} from "@/actions/tutors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DAYS_OF_WEEK, SUBJECTS } from "@/lib/constants";
import type { AvailabilityRule, TutorProfileDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProfilePhotoPicker } from "./profile-photo-picker";

// Display order for days of week: Monday first, Sunday last
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface TutorOnboardingFormProps {
	initial: TutorProfileDTO | null;
}

export function TutorOnboardingForm({ initial }: TutorOnboardingFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	// Core Onboarding Fields
	const [headline, setHeadline] = useState(initial?.headline ?? "");
	const [bio, setBio] = useState(initial?.bio ?? "");
	const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
	const [introVideoUrl, setIntroVideoUrl] = useState(
		initial?.introVideoUrl ?? "",
	);
	const [hourlyRate, setHourlyRate] = useState(
		initial?.hourlyRate ? String(initial.hourlyRate) : "25",
	);

	// Subjects: Primary subject + optional additional subjects
	const initialPrimary = initial?.subjects?.[0] ?? SUBJECTS[0];
	const initialAdditional = initial?.subjects?.slice(1) ?? [];

	const [primarySubject, setPrimarySubject] = useState<string>(initialPrimary);
	const [additionalSubjects, setAdditionalSubjects] =
		useState<string[]>(initialAdditional);

	// Availability Slots
	const [rules, setRules] = useState<AvailabilityRule[]>(
		initial?.availabilityRules ?? [
			{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
			{ dayOfWeek: 2, startTime: "09:00", endTime: "12:00" },
			{ dayOfWeek: 3, startTime: "09:00", endTime: "12:00" },
		],
	);

	function toggleAdditionalSubject(subject: string) {
		if (subject === primarySubject) return;
		setAdditionalSubjects((prev) =>
			prev.includes(subject)
				? prev.filter((s) => s !== subject)
				: [...prev, subject],
		);
	}

	function addSlot(dayOfWeek: number) {
		setRules((prev) => [
			...prev,
			{ dayOfWeek, startTime: "09:00", endTime: "12:00" },
		]);
	}

	function updateSlot(
		index: number,
		field: "startTime" | "endTime",
		value: string,
	) {
		setRules((prev) =>
			prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)),
		);
	}

	function removeSlot(index: number) {
		setRules((prev) => prev.filter((_, i) => i !== index));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setFeedback(null);

		// Basic Validation
		if (headline.trim().length < 10) {
			setFeedback({
				type: "error",
				message: "Headline must be at least 10 characters long.",
			});
			return;
		}

		if (bio.trim().length < 50) {
			setFeedback({
				type: "error",
				message: "Bio must be at least 50 characters long.",
			});
			return;
		}
		if (!photoUrl) {
			setFeedback({
				type: "error",
				message: "Add a profile photo before continuing.",
			});
			return;
		}

		const rateNum = Number(hourlyRate);
		if (!rateNum || rateNum < 1) {
			setFeedback({
				type: "error",
				message: "Please enter a valid hourly rate of at least $1.",
			});
			return;
		}

		// Combine primary + additional subjects
		const allSubjects = [
			primarySubject,
			...additionalSubjects.filter((s) => s !== primarySubject),
		];

		const profileInput = {
			photoUrl,
			headline: headline.trim(),
			bio: bio.trim(),
			subjects: allSubjects,
			languages: initial?.languages?.length ? initial.languages : ["English"],
			hourlyRate: rateNum,
			currency: initial?.currency || "USD",
			introVideoUrl: introVideoUrl.trim(),
			country: initial?.country || "Pakistan",
			timezone: initial?.timezone || "Asia/Karachi",
			lessonDurations: initial?.lessonDurations?.length
				? initial.lessonDurations
				: [60],
		};

		startTransition(async () => {
			// Save Profile
			const profileResult = await saveTutorProfile(profileInput);
			if (!profileResult.success) {
				setFeedback({ type: "error", message: profileResult.error });
				return;
			}

			// Save Availability
			const availabilityResult = await saveAvailability(rules);
			if (!availabilityResult.success) {
				setFeedback({ type: "error", message: availabilityResult.error });
				return;
			}

			const reviewResult = await submitTutorProfileForReview();
			if (!reviewResult.success) {
				setFeedback({ type: "error", message: reviewResult.error });
				return;
			}

			// New tutor profiles enter the private pending-review workspace.
			router.push("/dashboard");
			router.refresh();
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			{feedback && (
				<div
					className={cn(
						"rounded-xl border px-4 py-3 text-sm font-medium",
						feedback.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
							: "border-destructive/30 bg-destructive/10 text-destructive",
					)}
				>
					{feedback.message}
				</div>
			)}

			{/* Section 1: Basic Info */}
			<div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
				<div className="border-b border-border/60 pb-3">
					<h2 className="text-xl font-bold tracking-tight text-foreground">
						1. Teaching profile
					</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						This is what the review team and students will see.
					</p>
				</div>

				<Field label="Profile photo" hint="Use a clear, friendly headshot.">
					<ProfilePhotoPicker
						value={photoUrl}
						name={initial?.userName ?? "Tutor"}
						onChange={setPhotoUrl}
						disabled={isPending}
					/>
				</Field>

				<Field
					label="Professional Headline"
					hint="Summarize your teaching focus (e.g. Expert Calculus & High School Physics Tutor)."
				>
					<Input
						value={headline}
						onChange={(e) => setHeadline(e.target.value)}
						placeholder="e.g. Experienced Mathematics & Physics Instructor"
						maxLength={120}
						required
					/>
				</Field>

				<Field
					label="Intro video (optional)"
					hint="A YouTube or Vimeo link helps students get to know you."
				>
					<Input
						type="url"
						value={introVideoUrl}
						onChange={(event) => setIntroVideoUrl(event.target.value)}
						placeholder="https://youtube.com/watch?v=..."
					/>
				</Field>

				<Field
					label="Bio / About Yourself"
					hint="Describe your qualifications, teaching methodology, and experience (min 50 characters)."
				>
					<Textarea
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						placeholder="Hello! I am a passionate educator with over 5 years of experience helping students master complex academic topics..."
						rows={5}
						maxLength={2000}
						required
					/>
				</Field>

				<div className="grid gap-6 sm:grid-cols-2">
					<Field
						label="Hourly Rate (USD)"
						hint="Set your standard rate per hour."
					>
						<Input
							type="number"
							min={1}
							max={10000}
							value={hourlyRate}
							onChange={(e) => setHourlyRate(e.target.value)}
							placeholder="25"
							required
						/>
					</Field>

					<Field
						label="Primary Subject"
						hint="Select the main subject you specialize in."
					>
						<Select
							value={primarySubject}
							onChange={(e) => {
								setPrimarySubject(e.target.value);
								setAdditionalSubjects((prev) =>
									prev.filter((s) => s !== e.target.value),
								);
							}}
						>
							{SUBJECTS.map((sub) => (
								<option key={sub} value={sub}>
									{sub}
								</option>
							))}
						</Select>
					</Field>
				</div>

				<Field
					label="Additional Subjects (Optional)"
					hint="Select any extra subjects you are qualified to teach."
				>
					<div className="flex flex-wrap gap-2 pt-1">
						{SUBJECTS.map((subject) => {
							if (subject === primarySubject) return null;
							const isSelected = additionalSubjects.includes(subject);
							return (
								<button
									key={subject}
									type="button"
									onClick={() => toggleAdditionalSubject(subject)}
									className={cn(
										"rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
										isSelected
											? "border-primary bg-primary/10 text-primary"
											: "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
									)}
								>
									{subject}
								</button>
							);
						})}
					</div>
				</Field>
			</div>

			{/* Section 2: Availability */}
			<div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
				<div className="flex flex-col gap-1 border-b border-border/60 pb-3">
					<h2 className="text-xl font-bold tracking-tight text-foreground">
						2. Teaching Availability
					</h2>
					<p className="text-xs text-muted-foreground">
						Configure your standard weekly available hours.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					{DAY_ORDER.map((dayValue) => {
						const daySlots = rules
							.map((rule, index) => ({ rule, index }))
							.filter(({ rule }) => rule.dayOfWeek === dayValue);

						return (
							<div
								key={dayValue}
								className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="w-28 shrink-0 text-sm font-semibold text-foreground">
									{DAYS_OF_WEEK[dayValue]}
								</div>

								<div className="flex flex-1 flex-col gap-2">
									{daySlots.length === 0 && (
										<span className="text-xs text-muted-foreground italic">
											Not available
										</span>
									)}
									{daySlots.map(({ rule, index }) => (
										<div
											key={`${dayValue}-${index}`}
											className="flex items-center gap-2"
										>
											<Input
												type="time"
												value={rule.startTime}
												onChange={(e) =>
													updateSlot(index, "startTime", e.target.value)
												}
												className="w-32 text-xs"
											/>
											<span className="text-muted-foreground">–</span>
											<Input
												type="time"
												value={rule.endTime}
												onChange={(e) =>
													updateSlot(index, "endTime", e.target.value)
												}
												className="w-32 text-xs"
											/>
											<button
												type="button"
												onClick={() => removeSlot(index)}
												className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
											>
												Remove
											</button>
										</div>
									))}
								</div>

								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => addSlot(dayValue)}
									className="shrink-0 text-xs"
								>
									+ Add Slot
								</Button>
							</div>
						);
					})}
				</div>
			</div>

			{/* Submit Actions */}
			<div className="flex justify-end pt-2">
				<Button
					type="submit"
					size="lg"
					disabled={isPending}
					className="min-w-48"
				>
					{isPending ? "Submitting profile..." : "Submit profile for review"}
				</Button>
			</div>
		</form>
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
				<span className="text-sm font-semibold text-foreground">{label}</span>
				{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
			</div>
			{children}
		</div>
	);
}
