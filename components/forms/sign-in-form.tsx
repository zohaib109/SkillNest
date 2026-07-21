"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth-client";
import { SUBJECTS } from "@/lib/constants";

type Tab = "login" | "signup";
type Role = "student" | "tutor";

export function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
	const initialTab = (searchParams.get("tab") as Tab) ?? "login";
	const initialRole = (searchParams.get("role") as Role) ?? "student";

	const [activeTab, setActiveTab] = useState<Tab>(initialTab);
	const [role, setRole] = useState<Role>(initialRole);

	// Form fields
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [headline, setHeadline] = useState("");
	const [hourlyRate, setHourlyRate] = useState("");
	const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0] as string);

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// Sync tab and role from URL search params if they change
	useEffect(() => {
		const tabParam = searchParams.get("tab");
		if (tabParam === "login" || tabParam === "signup") {
			setActiveTab(tabParam as Tab);
		}
		const roleParam = searchParams.get("role");
		if (roleParam === "student" || roleParam === "tutor") {
			setRole(roleParam as Role);
		}
	}, [searchParams]);

	// Strong password validation regex
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

	// Helper to write cookies for OAuth or Hook consumption
	function setRegistrationCookies() {
		// Set cookies with a max-age of 1 hour (3600 seconds)
		// biome-ignore lint/suspicious/noDocumentCookie: cookie configuration is needed for OAuth signup metadata passing
		document.cookie = `selected_role=${role}; path=/; max-age=3600; SameSite=Lax`;
		if (role === "tutor") {
			// biome-ignore lint/suspicious/noDocumentCookie: cookie configuration is needed for OAuth signup metadata passing
			document.cookie = `tutor_headline=${encodeURIComponent(headline)}; path=/; max-age=3600; SameSite=Lax`;
			// biome-ignore lint/suspicious/noDocumentCookie: cookie configuration is needed for OAuth signup metadata passing
			document.cookie = `tutor_rate=${hourlyRate}; path=/; max-age=3600; SameSite=Lax`;
			// biome-ignore lint/suspicious/noDocumentCookie: cookie configuration is needed for OAuth signup metadata passing
			document.cookie = `tutor_subjects=${encodeURIComponent(selectedSubject)}; path=/; max-age=3600; SameSite=Lax`;
		}
	}

	async function handleEmailAuth(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (activeTab === "login") {
				// Login
				await signIn.email(
					{ email, password, callbackURL: callbackUrl },
					{
						onSuccess: () => {
							router.push(callbackUrl);
							router.refresh();
						},
						onError: (ctx) => {
							setError(ctx.error.message ?? "Sign in failed");
						},
					},
				);
			} else {
				// Sign Up
				// Enforce strong password
				if (!passwordRegex.test(password)) {
					setError(
						"Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.",
					);
					setLoading(false);
					return;
				}

				// Enforce tutor-specific fields
				if (role === "tutor") {
					if (headline.trim().length < 10) {
						setError("Headline must be at least 10 characters.");
						setLoading(false);
						return;
					}
					if (!hourlyRate || Number(hourlyRate) < 1) {
						setError("Hourly rate must be at least $1.");
						setLoading(false);
						return;
					}
				}

				// Set cookies so that database hooks can pick up details
				setRegistrationCookies();

				await signUp.email(
					{
						email,
						password,
						name,
						role,
						callbackURL: "/dashboard",
					} as any,
					{
						onSuccess: () => {
							router.push("/dashboard");
							router.refresh();
						},
						onError: (ctx) => {
							setError(ctx.error.message ?? "Sign up failed");
						},
					},
				);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setLoading(false);
		}
	}

	async function handleGoogleSignIn() {
		setError("");
		setLoading(true);
		try {
			// Enforce tutor-specific fields if signing up
			if (activeTab === "signup" && role === "tutor") {
				if (headline.trim().length < 10) {
					setError("Headline must be at least 10 characters.");
					setLoading(false);
					return;
				}
				if (!hourlyRate || Number(hourlyRate) < 1) {
					setError("Hourly rate must be at least $1.");
					setLoading(false);
					return;
				}
			}

			// Write role and metadata cookies for social signup to read from headers
			setRegistrationCookies();

			await signIn.social(
				{ provider: "google", callbackURL: "/dashboard" },
				{
					onError: (ctx) => {
						setError(ctx.error.message ?? "Google sign in failed");
					},
				},
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Google sign in failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col gap-6 max-w-md w-full mx-auto bg-white p-8 rounded-3xl border border-border shadow-xs">
			{/* Tab Switcher */}
			<div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1 border border-border/60">
				<button
					type="button"
					onClick={() => {
						setActiveTab("login");
						setError("");
					}}
					className={`rounded-xl py-2 text-sm font-semibold transition-all cursor-pointer ${
						activeTab === "login"
							? "bg-white text-foreground shadow-xs"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Log In
				</button>
				<button
					type="button"
					onClick={() => {
						setActiveTab("signup");
						setError("");
					}}
					className={`rounded-xl py-2 text-sm font-semibold transition-all cursor-pointer ${
						activeTab === "signup"
							? "bg-white text-foreground shadow-xs"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Sign Up
				</button>
			</div>

			{/* Header copy */}
			<div className="text-center">
				<h1 className="text-2xl font-bold tracking-tight text-foreground">
					{activeTab === "login" ? "Welcome back" : "Create your account"}
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					{activeTab === "login"
						? "Sign in to access your SkillNest space"
						: "Join as a student or tutor to get started"}
				</p>
			</div>

			{error && (
				<div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive text-center font-medium">
					{error}
				</div>
			)}

			<form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
				{/* Sign Up Role Selection */}
				{activeTab === "signup" && (
					<div className="flex flex-col gap-2">
						<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Select Account Type
						</span>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => setRole("student")}
								className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-sm transition-all cursor-pointer ${
									role === "student"
										? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
										: "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
								}`}
							>
								<span className="text-base">📚</span>
								<span className="font-semibold">Student</span>
							</button>
							<button
								type="button"
								onClick={() => setRole("tutor")}
								className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-sm transition-all cursor-pointer ${
									role === "tutor"
										? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
										: "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
								}`}
							>
								<span className="text-base">🎓</span>
								<span className="font-semibold">Tutor</span>
							</button>
						</div>
					</div>
				)}

				{/* Basic Fields */}
				{activeTab === "signup" && (
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="name"
							className="text-xs font-semibold text-foreground"
						>
							Full Name
						</label>
						<Input
							id="name"
							type="text"
							placeholder="John Doe"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
				)}

				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="email"
						className="text-xs font-semibold text-foreground"
					>
						Email Address
					</label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoComplete="email"
					/>
				</div>

				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="password"
						className="text-xs font-semibold text-foreground"
					>
						Password
					</label>
					<Input
						id="password"
						type="password"
						placeholder={
							activeTab === "signup"
								? "At least 8 chars, 1 uppercase, 1 number"
								: "••••••••"
						}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoComplete={
							activeTab === "signup" ? "new-password" : "current-password"
						}
					/>
				</div>

				{/* Tutor Extra Onboarding Fields */}
				{activeTab === "signup" && role === "tutor" && (
					<div className="flex flex-col gap-4 border-t border-border/80 pt-4 mt-1">
						<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Tutor Profile Information
						</span>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="headline"
								className="text-xs font-semibold text-foreground"
							>
								Professional Headline
							</label>
							<Input
								id="headline"
								type="text"
								placeholder="e.g. Expert Physics & Calculus Instructor"
								value={headline}
								onChange={(e) => setHeadline(e.target.value)}
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="rate"
									className="text-xs font-semibold text-foreground"
								>
									Hourly Rate (USD)
								</label>
								<Input
									id="rate"
									type="number"
									min="1"
									placeholder="20"
									value={hourlyRate}
									onChange={(e) => setHourlyRate(e.target.value)}
									required
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="subject"
									className="text-xs font-semibold text-foreground"
								>
									Primary Subject
								</label>
								<select
									id="subject"
									value={selectedSubject}
									onChange={(e) => setSelectedSubject(e.target.value)}
									className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
								>
									{SUBJECTS.map((sub) => (
										<option key={sub} value={sub}>
											{sub}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
				)}

				<Button
					type="submit"
					size="lg"
					className="w-full mt-2"
					disabled={loading}
				>
					{loading
						? activeTab === "login"
							? "Logging in..."
							: "Creating Account..."
						: activeTab === "login"
							? "Log In"
							: "Sign Up"}
				</Button>
			</form>

			{/* Divider */}
			<div className="relative my-2">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-border" />
				</div>
				<div className="relative flex justify-center text-2xs uppercase">
					<span className="bg-white px-3 text-muted-foreground font-semibold">
						or continue with
					</span>
				</div>
			</div>

			{/* Google Login */}
			<Button
				type="button"
				variant="outline"
				size="lg"
				className="w-full rounded-full cursor-pointer hover:bg-muted"
				onClick={handleGoogleSignIn}
				disabled={loading}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					aria-hidden="true"
					className="mr-2"
				>
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
				Continue with Google
			</Button>
		</div>
	);
}
