"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface EmailVerificationPromptProps {
	email: string;
}

export function EmailVerificationPrompt({
	email,
}: EmailVerificationPromptProps) {
	const [status, setStatus] = useState<
		"idle" | "sending" | "success" | "error"
	>("idle");
	const [message, setMessage] = useState("");

	async function handleResend() {
		setStatus("sending");
		setMessage("");
		try {
			await authClient.sendVerificationEmail({
				email,
				callbackURL: `${window.location.origin}/dashboard`,
			});
			setStatus("success");
			setMessage("A new verification link has been sent to your email.");
		} catch (err) {
			setStatus("error");
			setMessage(
				err instanceof Error
					? err.message
					: "Failed to send link. Please try again.",
			);
		}
	}

	return (
		<div className="flex flex-1 items-center justify-center p-6 sm:p-10 min-h-[60vh]">
			<div className="max-w-md w-full bg-white border border-border rounded-3xl p-8 text-center flex flex-col gap-6 shadow-xs">
				<div className="flex justify-center text-4xl">✉️</div>
				<div className="flex flex-col gap-2">
					<h2 className="text-2xl font-bold text-foreground tracking-tight">
						Verify Your Email
					</h2>
					<p className="text-sm text-muted-foreground leading-relaxed">
						We&apos;ve sent a verification link to{" "}
						<strong className="text-foreground">{email}</strong>. Please check
						your inbox and verify your email to unlock access to SkillNest.
					</p>
					{process.env.NODE_ENV === "development" && (
						<p className="text-2xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5 mt-1">
							⚙️ Dev Note: No production email service is connected yet. Copy the
							verification link printed in your server terminal.
						</p>
					)}
				</div>

				{message && (
					<div
						role={status === "error" ? "alert" : "status"}
						className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
							status === "success"
								? "border-emerald-200 bg-emerald-50 text-emerald-700"
								: "border-destructive/20 bg-destructive/5 text-destructive"
						}`}
					>
						{message}
					</div>
				)}

				<div className="flex flex-col gap-3 pt-2">
					<Button
						type="button"
						size="lg"
						onClick={handleResend}
						disabled={status === "sending"}
						className="w-full"
					>
						{status === "sending" ? "Resending..." : "Resend Verification Link"}
					</Button>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
					>
						Checked my email, refresh page
					</button>
				</div>
			</div>
		</div>
	);
}
