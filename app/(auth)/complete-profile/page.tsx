"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function CompleteProfilePage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await authClient.updateUser({
				name,
			});
			if (result.error) {
				setError(result.error.message ?? "Failed to update profile");
			} else {
				router.push("/dashboard");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2 text-center">
				<h1 className="text-3xl tracking-tight text-foreground">
					Complete your profile
				</h1>
				<p className="text-muted-foreground">
					Tell us a bit about yourself to get started
				</p>
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<label htmlFor="name" className="text-sm font-medium text-foreground">
						Display Name
					</label>
					<Input
						id="name"
						type="text"
						placeholder="Your full name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>
				<Button type="submit" className="w-full" size="lg" disabled={loading}>
					{loading ? "Saving..." : "Continue to Dashboard"}
				</Button>
			</form>
		</div>
	);
}
