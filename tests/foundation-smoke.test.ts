import { randomBytes } from "node:crypto";
import { type Db, MongoClient } from "mongodb";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { parseTutorSearchParams } from "@/lib/tutor-search";

const { requestContext, verificationLinks } = vi.hoisted(() => ({
	requestContext: { headers: new Headers() },
	verificationLinks: new Map<string, string>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
	headers: async () => requestContext.headers,
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/email", () => ({
	sendVerificationEmail: async ({
		user,
		url,
	}: {
		user: { email: string };
		url: string;
	}) => {
		verificationLinks.set(user.email, url);
	},
}));

describe.runIf(process.env.npm_lifecycle_event === "test:smoke")(
	"foundation MongoDB smoke",
	() => {
		const origin = "http://localhost:3000";
		const password = "SmokeTest1!Pass";
		const runId = `skillnest-smoke-${crypto.randomUUID()}`;
		const emails = ["student", "tutor", "admin", "invalid"].map(
			(role) => `${runId}-${role}@example.com`,
		);
		const [studentEmail, tutorEmail, adminEmail, invalidEmail] = emails;
		const inconsistentUserId = `${runId}-inconsistent`;
		let db: Db;
		let auth: typeof import("@/lib/auth").auth;
		let authClient: MongoClient | undefined;
		let smokeClient: MongoClient | undefined;

		function authPost(
			path: string,
			body: Record<string, string>,
			role = "student",
		) {
			return auth.handler(
				new Request(`${origin}/api/auth/${path}`, {
					method: "POST",
					headers: {
						"content-type": "application/json",
						cookie: `selected_role=${role}`,
						origin,
					},
					body: JSON.stringify(body),
				}),
			);
		}

		function signUp(email: string, role: string, credential = password) {
			return authPost(
				"sign-up/email",
				{ name: "SkillNest Smoke", email, password: credential, role: "admin" },
				role,
			);
		}

		async function signIn(email: string) {
			const response = await authPost("sign-in/email", { email, password });
			expect(response.status).toBe(200);
			const cookies = response.headers
				.getSetCookie()
				.map((cookie) => cookie.split(";", 1)[0])
				.join("; ");
			expect(cookies).toContain("better-auth.session_token=");
			return new Headers({ cookie: cookies });
		}

		beforeAll(async () => {
			const uri = process.env.SMOKE_MONGODB_URI ?? "";
			if (!/^mongodb(?:\+srv)?:\/\/[^/?#]+\/[^/?#]+(?:\?|$)/.test(uri)) {
				throw new Error(
					"Set SMOKE_MONGODB_URI to a confirmed development MongoDB URI with an explicit database name.",
				);
			}

			smokeClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
			const smokeDb = smokeClient.db();
			await smokeDb.command({ ping: 1 });
			db = smokeDb;

			vi.stubEnv("MONGODB_URI", uri);
			vi.stubEnv("BETTER_AUTH_SECRET", randomBytes(32).toString("hex"));
			vi.stubEnv("BETTER_AUTH_URL", origin);
			vi.stubEnv("GOOGLE_CLIENT_ID", "skillnest-smoke-client");
			vi.stubEnv("GOOGLE_CLIENT_SECRET", "skillnest-smoke-secret");
			({ auth, client: authClient } = await import("@/lib/auth"));
		}, 30_000);

		afterAll(async () => {
			try {
				if (!db) return;
				const users = await db
					.collection("user")
					.find({ email: { $in: emails } }, { projection: { _id: 1 } })
					.toArray();
				const userIds = users.map(({ _id }) => String(_id));
				const authIds = [...users.map(({ _id }) => _id), ...userIds];
				await Promise.all([
					db.collection("tutorprofiles").deleteMany({
						userId: { $in: [...userIds, inconsistentUserId] },
					}),
					db.collection("savedtutors").deleteMany({
						studentId: { $in: userIds },
					}),
					db.collection("session").deleteMany({ userId: { $in: authIds } }),
					db.collection("account").deleteMany({ userId: { $in: authIds } }),
					db.collection("verification").deleteMany({
						identifier: { $in: emails },
					}),
				]);
				await db.collection("user").deleteMany({ email: { $in: emails } });
			} finally {
				await Promise.all([
					mongoose.disconnect(),
					authClient?.close(),
					smokeClient?.close(),
				]);
				vi.unstubAllEnvs();
			}
		}, 30_000);

		it("authenticates users and enforces the onboarding, moderation and discovery boundaries", async () => {
			const { approveTutor, rejectTutor } = await import("@/actions/admin");
			const { toggleSavedTutor } = await import("@/actions/saved-tutors");
			const {
				saveTutorProfile,
				saveAvailability,
				submitTutorProfileForReview,
			} = await import("@/actions/tutors");
			const { requireVerifiedRole } = await import("@/lib/permissions");
			const {
				findApprovedTutors,
				getApprovedTutorBySlug,
				getTutorProfileByUserId,
			} = await import("@/lib/tutors");
			const { TutorProfile } = await import("@/models/TutorProfile");

			expect(
				(await signUp(invalidEmail, "student", "weak-password")).status,
			).toBe(400);
			expect(
				await db.collection("user").findOne({ email: invalidEmail }),
			).toBeNull();
			expect((await signUp(studentEmail, "admin")).ok).toBe(true);
			expect((await signUp(tutorEmail, "tutor")).ok).toBe(true);
			expect((await signUp(adminEmail, "student")).ok).toBe(true);

			const student = await db
				.collection("user")
				.findOne({ email: studentEmail });
			const tutor = await db.collection("user").findOne({ email: tutorEmail });
			expect(student?.role).toBe("student");
			expect(tutor?.role).toBe("tutor");
			const studentId = String(student?._id);
			expect(await getTutorProfileByUserId(studentId)).toBeNull();
			const profile = await getTutorProfileByUserId(String(tutor?._id));
			if (!profile) throw new Error("Signup did not create the tutor profile");
			expect(profile.status).toBe("draft");
			expect(await getApprovedTutorBySlug(profile.slug)).toBeNull();

			expect(await approveTutor(profile.id)).toEqual({
				success: false,
				error: "Unauthorized",
			});
			requestContext.headers = await signIn(studentEmail);
			expect(await approveTutor(profile.id)).toEqual({
				success: false,
				error: "Forbidden",
			});
			expect((await toggleSavedTutor(profile.id)).success).toBe(false);
			const verificationUrl = verificationLinks.get(studentEmail);
			if (!verificationUrl)
				throw new Error("Signup did not request verification");
			const verification = await auth.handler(new Request(verificationUrl));
			expect(verification.status).toBeLessThan(400);
			requestContext.headers = await signIn(studentEmail);
			expect((await requireVerifiedRole("student")).user.emailVerified).toBe(
				true,
			);
			const studentHeaders = requestContext.headers;

			requestContext.headers = await signIn(tutorEmail);
			expect((await submitTutorProfileForReview()).success).toBe(false);
			const profileInput = {
				headline: `Mathematics lessons ${runId}`,
				bio: "I help students build confidence in mathematics with clear, practical lessons.",
				subjects: ["Mathematics"],
				languages: ["English"],
				hourlyRate: 25,
				currency: "USD",
				introVideoUrl: "",
				country: "Pakistan",
				timezone: "Asia/Karachi",
				lessonDurations: [60],
			};
			const availability = [
				{ dayOfWeek: 1, startTime: "10:00", endTime: "12:00" },
			];
			expect((await saveTutorProfile(profileInput)).success).toBe(true);
			expect((await submitTutorProfileForReview()).success).toBe(false);
			expect((await saveAvailability(availability)).success).toBe(true);
			expect((await submitTutorProfileForReview()).success).toBe(true);
			expect(await getApprovedTutorBySlug(profile.slug)).toBeNull();
			const tutorHeaders = requestContext.headers;

			await db
				.collection("user")
				.updateOne({ email: adminEmail }, { $set: { role: "admin" } });
			requestContext.headers = await signIn(adminEmail);
			expect(
				(await rejectTutor(profile.id, "Please revise the lesson description."))
					.success,
			).toBe(true);
			expect(await getApprovedTutorBySlug(profile.slug)).toBeNull();
			expect((await approveTutor(profile.id)).success).toBe(false);
			const adminHeaders = requestContext.headers;

			requestContext.headers = tutorHeaders;
			expect((await submitTutorProfileForReview()).success).toBe(true);
			requestContext.headers = adminHeaders;
			expect((await approveTutor(profile.id)).success).toBe(true);
			expect((await approveTutor(profile.id)).success).toBe(false);

			await TutorProfile.create({
				userId: inconsistentUserId,
				slug: inconsistentUserId,
				headline: profileInput.headline,
				status: "approved",
				isApproved: false,
			});
			const filters = parseTutorSearchParams({ q: runId });
			expect(
				(await findApprovedTutors(filters, studentId)).tutors.map(
					({ id }) => id,
				),
			).toEqual([profile.id]);
			expect(await getApprovedTutorBySlug(inconsistentUserId)).toBeNull();
			const approved = await getApprovedTutorBySlug(profile.slug);
			expect(approved?.id).toBe(profile.id);
			expect(approved).not.toHaveProperty("userEmail");

			requestContext.headers = studentHeaders;
			expect(await toggleSavedTutor(profile.id)).toEqual({
				success: true,
				saved: true,
			});
			const saved = await findApprovedTutors(
				{ ...filters, savedOnly: true },
				studentId,
			);
			expect(saved.savedTutorIds).toEqual([profile.id]);
			expect(await toggleSavedTutor(profile.id)).toEqual({
				success: true,
				saved: false,
			});

			requestContext.headers = tutorHeaders;
			expect(
				(await saveAvailability([{ ...availability[0], startTime: "09:00" }]))
					.success,
			).toBe(true);
			expect(await getApprovedTutorBySlug(profile.slug)).toBeNull();
			expect((await findApprovedTutors(filters, studentId)).total).toBe(0);
		}, 60_000);
	},
);
