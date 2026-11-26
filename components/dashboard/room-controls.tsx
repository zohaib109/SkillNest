"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
	reportLessonIssue,
	resolveLessonIssue,
	roomCheckIn,
} from "@/actions/lesson-room";
import { Button } from "@/components/ui/button";

export function DevicePreview() {
	const video = useRef<HTMLVideoElement>(null),
		stream = useRef<MediaStream | null>(null),
		attempt = useRef(0);
	const [state, setState] = useState<"idle" | "asking" | "on" | "failed">(
		"idle",
	);
	useEffect(
		() => () => {
			attempt.current++;
			stream.current?.getTracks().forEach((track) => {
				track.stop();
			});
		},
		[],
	);
	function stop() {
		attempt.current++;
		stream.current?.getTracks().forEach((track) => {
			track.stop();
		});
		stream.current = null;
		if (video.current) video.current.srcObject = null;
		setState("idle");
	}
	async function start() {
		const requestNumber = ++attempt.current;
		setState("asking");
		try {
			const media = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			});
			if (requestNumber !== attempt.current) {
				media.getTracks().forEach((track) => {
					track.stop();
				});
				return;
			}
			stream.current = media;
			if (video.current) video.current.srcObject = media;
			setState("on");
		} catch {
			if (requestNumber === attempt.current) setState("failed");
		}
	}
	return (
		<section className="space-y-3 rounded-xl border border-border bg-card p-5">
			<h2 className="text-xl">Check your devices</h2>
			<p className="text-sm text-muted-foreground">
				Preview your camera and check microphone access on this device. The
				preview stays in your browser.
			</p>
			<video
				ref={video}
				muted
				autoPlay
				playsInline
				aria-label="Local camera preview"
				className={state === "on" ? "w-full rounded-xl" : "hidden"}
			/>
			{state === "on" || state === "asking" ? (
				<Button type="button" variant="outline" onClick={stop}>
					Stop preview
				</Button>
			) : (
				<Button type="button" variant="outline" onClick={start}>
					Test camera and microphone
				</Button>
			)}
			<p role="status" className="text-sm">
				{state === "failed"
					? "Camera or microphone unavailable. Check your browser permissions and device settings, then retry."
					: state === "on"
						? "Camera preview active · microphone access available"
						: state === "asking"
							? "Waiting for device permission…"
							: ""}
			</p>
		</section>
	);
}

export function CheckInForm({ id, enabled }: { id: string; enabled: boolean }) {
	const router = useRouter();
	const [status, action, pending] = useActionState(
		roomCheckIn.bind(null, id),
		"",
	);
	return (
		<div className="flex flex-wrap items-center gap-3">
			{enabled && (
				<form action={action}>
					<Button type="submit" disabled={pending}>
						Check in for this lesson
					</Button>
				</form>
			)}
			<Button variant="outline" onClick={() => router.refresh()}>
				Refresh status
			</Button>
			<p role="status">{status}</p>
		</div>
	);
}
export function LessonIssueForm({ id }: { id: string }) {
	const [status, action, pending] = useActionState(
		reportLessonIssue.bind(null, id),
		"",
	);
	return (
		<details>
			<summary className="cursor-pointer font-medium">
				Report a lesson problem
			</summary>
			<form action={action} className="mt-3 grid gap-3">
				<label>
					What happened?
					<select
						name="reason"
						className="block rounded border border-border bg-card p-2"
					>
						<option value="could_not_connect">Connection trouble</option>
						<option value="other_person_absent">
							The other person did not join
						</option>
						<option value="other">Another lesson problem</option>
					</select>
				</label>
				<label>
					Tell staff what happened
					<textarea
						required
						minLength={5}
						maxLength={400}
						name="detail"
						rows={3}
						className="block w-full rounded border border-border bg-card p-2"
					/>
				</label>
				<p className="text-xs text-muted-foreground">
					Submit one statement. Staff can read the details. The other
					participant sees that a report was filed and the shared review
					outcome.
				</p>
				<Button type="submit" disabled={pending}>
					Submit lesson report
				</Button>
				<p role="status">{status}</p>
			</form>
		</details>
	);
}
export function CaseDecision({
	id,
	revision,
}: {
	id: string;
	revision: number;
}) {
	const [status, action, pending] = useActionState(
		resolveLessonIssue.bind(null, id, revision),
		"",
	);
	return (
		<form action={action} className="mt-3 grid gap-2">
			<label>
				Outcome and next step for both participants
				<textarea
					required
					minLength={5}
					maxLength={400}
					name="decision"
					className="block w-full rounded border border-border bg-card p-2"
				/>
			</label>
			<p className="text-xs">
				This records the review. Any payment adjustment requires separate
				financial authorization.
			</p>
			<Button type="submit" variant="outline" disabled={pending}>
				Record case review
			</Button>
			<p role="status">{status}</p>
		</form>
	);
}
