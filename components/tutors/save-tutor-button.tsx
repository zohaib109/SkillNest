"use client";

import { useState, useTransition } from "react";
import { toggleSavedTutor } from "@/actions/saved-tutors";
import { Button } from "@/components/ui/button";

export function SaveTutorButton({
	profileId,
	initialSaved,
	fullWidth = false,
}: {
	profileId: string;
	initialSaved: boolean;
	fullWidth?: boolean;
}) {
	const [saved, setSaved] = useState(initialSaved);
	const [error, setError] = useState("");
	const [isPending, startTransition] = useTransition();

	return (
		<div className={fullWidth ? "w-full" : ""}>
			<Button
				type="button"
				variant="outline"
				className={fullWidth ? "w-full" : ""}
				disabled={isPending}
				aria-pressed={saved}
				onClick={() => {
					setError("");
					startTransition(async () => {
						const result = await toggleSavedTutor(profileId);
						if (result.success) setSaved(result.saved);
						else setError(result.error);
					});
				}}
			>
				{isPending ? "Saving…" : saved ? "★ Saved" : "☆ Save tutor"}
			</Button>
			{error && <p className="mt-2 text-xs text-destructive">{error}</p>}
		</div>
	);
}
