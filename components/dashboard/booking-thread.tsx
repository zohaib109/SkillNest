"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
	flagBookingMessage,
	sendBookingMessage,
} from "@/actions/booking-messages";
import { Button } from "@/components/ui/button";

export function ThreadControls({
	id,
	canSend,
	latest,
}: {
	id: string;
	canSend: boolean;
	latest: boolean;
}) {
	const router = useRouter();
	const [draft, setDraft] = useState("");
	const [nonce, setNonce] = useState<string | null>(null);
	const [status, send, pending] = useActionState(async (_previous: string) => {
		const key = nonce ?? crypto.randomUUID();
		setNonce(key);
		const result = await sendBookingMessage(id, key, draft);
		if (result) return result;
		setDraft("");
		setNonce(null);
		return "Message sent.";
	}, "");
	useEffect(() => {
		if (!latest) return;
		const timer = window.setInterval(() => {
			if (document.visibilityState === "visible") router.refresh();
		}, 30000);
		return () => window.clearInterval(timer);
	}, [latest, router]);
	return (
		<div className="space-y-3">
			<Button variant="outline" size="sm" onClick={() => router.refresh()}>
				Refresh messages
			</Button>
			{canSend ? (
				<form action={send} className="grid gap-2">
					<label htmlFor="new-message" className="font-medium">
						Write a message
					</label>
					<textarea
						id="new-message"
						required
						maxLength={1000}
						rows={3}
						value={draft}
						disabled={pending}
						onChange={(e) => {
							setDraft(e.target.value);
							setNonce(null);
						}}
						className="w-full rounded-xl border border-border bg-card p-3"
					/>
					<p className="text-xs text-muted-foreground">
						Use this thread to coordinate your lesson. Each participant can send
						up to 60 messages until 24 hours after the lesson ends.
					</p>
					<Button type="submit" disabled={pending || !draft.trim()}>
						{pending ? "Sending…" : "Send message"}
					</Button>
					<p role="status">{status}</p>
				</form>
			) : (
				<p>This thread is read-only.</p>
			)}
		</div>
	);
}

export function ReportMessage({
	id,
	messageKey,
}: {
	id: string;
	messageKey: string;
}) {
	const [status, action, pending] = useActionState(
		flagBookingMessage.bind(null, id, messageKey),
		"",
	);
	return (
		<details className="mt-2 text-sm">
			<summary className="cursor-pointer">Report this message</summary>
			<form action={action} className="mt-2 space-y-2">
				<label className="block">
					Why should staff review this message?
					<textarea
						required
						minLength={5}
						maxLength={300}
						name="reason"
						className="mt-1 block w-full rounded border border-border bg-card px-2 py-1"
					/>
				</label>
				<p>Staff receive this message and your reason.</p>
				<Button type="submit" size="sm" variant="outline" disabled={pending}>
					Submit report
				</Button>
				<p role="status">{status}</p>
			</form>
		</details>
	);
}
