"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveTutorIntroVideo } from "@/actions/tutors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function IntroVideoForm({ initialUrl }: { initialUrl: string }) {
	const router = useRouter();
	const [url, setUrl] = useState(initialUrl);
	const [isPending, startTransition] = useTransition();
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFeedback(null);
		startTransition(async () => {
			const result = await saveTutorIntroVideo(url);
			if (result.success) {
				setFeedback({ type: "success", message: "Intro video saved." });
				router.refresh();
			} else {
				setFeedback({ type: "error", message: result.error });
			}
		});
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex max-w-2xl flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-2xs sm:p-6"
		>
			<div>
				<label
					htmlFor="intro-video-url"
					className="text-sm font-semibold text-foreground"
				>
					Video link
				</label>
				<p className="mt-1 text-xs text-muted-foreground">
					Use a public YouTube or Vimeo link. Leave it empty to remove your
					video.
				</p>
			</div>
			<Input
				id="intro-video-url"
				type="url"
				value={url}
				onChange={(event) => setUrl(event.target.value)}
				placeholder="https://youtube.com/watch?v=..."
			/>
			{feedback && (
				<p
					className={cn(
						"rounded-xl border px-3 py-2 text-sm",
						feedback.type === "success"
							? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
							: "border-destructive/30 bg-destructive/10 text-destructive",
					)}
				>
					{feedback.message}
				</p>
			)}
			<div className="flex justify-end border-t border-border pt-4">
				<Button type="submit" disabled={isPending}>
					{isPending ? "Saving..." : "Save intro video"}
				</Button>
			</div>
		</form>
	);
}
