import type { Db } from "mongodb";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const shouldRun =
	process.env.RUN_MONGODB_SMOKE === "1" ||
	process.env.npm_lifecycle_event === "test:smoke";

describe.runIf(shouldRun)("foundation MongoDB smoke", () => {
	const runId = `skillnest-smoke-${crypto.randomUUID()}`;
	const studentEmail = `${runId}-student@example.com`;
	const tutorEmail = `${runId}-tutor@example.com`;
	const invalidEmail = `${runId}-invalid@example.com`;
	const emails = [studentEmail, tutorEmail, invalidEmail];
	const userIds: string[] = [];
	const profileUserIds: string[] = [];

	let auth: { handler(request: Request): Promise<Response> };
	let authClient: { db(): Db; close(): Promise<void> };
	let db: Db;
	let databaseReady = false;
	let TutorProfile: typeof import("@/models/TutorProfile").TutorProfile;
	let resetTutorModeration: typeof import("@/lib/tutor-moderation").resetTutorModeration;

	async function signUp(options: {
		email: string;
		password?: string;
		selectedRole: string;
		requestedRole: string;
	}) {
		return auth.handler(
			new Request("http://localhost:3000/api/auth/sign-up/email", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					cookie: `selected_role=${options.selectedRole}`,
					origin: "http://localhost:3000",
				},
				body: JSON.stringify({
					name: "SkillNest Smoke",
					email: options.email,
					password: options.password ?? "SmokeTest1!Pass",
					role: options.requestedRole,
					callbackURL: "/dashboard",
				}),
			}),
		);
	}

	beforeAll(async () => {
		const uri = process.env.MONGODB_URI;
		if (!uri) throw new Error("MONGODB_URI is required for the smoke test");

		const separator = uri.includes("?") ? "&" : "?";
		process.env.MONGODB_URI = `${uri}${separator}serverSelectionTimeoutMS=10000&connectTimeoutMS=10000`;

		const authModule = await import("@/lib/auth");
		const tutorProfileModule = await import("@/models/TutorProfile");
		const moderationModule = await import("@/lib/tutor-moderation");

		auth = authModule.auth;
		authClient = authModule.client;
		db = authClient.db();
		TutorProfile = tutorProfileModule.TutorProfile;
		resetTutorModeration = moderationModule.resetTutorModeration;

		await db.command({ ping: 1 });
		databaseReady = true;
	}, 30_000);

	afterAll(async () => {
		if (!db) return;
		if (!databaseReady) {
			await Promise.allSettled([mongoose.disconnect(), authClient.close()]);
			return;
		}

		const storedUsers = await db
			.collection("user")
			.find({ email: { $in: emails } }, { projection: { _id: 1, id: 1 } })
			.toArray();
		const storedUserIds = storedUsers.flatMap((user) => {
			const id = user.id ?? user._id;
			return id ? [String(id)] : [];
		});
		const allUserIds = [...new Set([...userIds, ...storedUserIds])];
		const allProfileUserIds = [
			...new Set([...profileUserIds, ...allUserIds]),
		];

		await Promise.all([
			TutorProfile.deleteMany({ userId: { $in: allProfileUserIds } }),
			db.collection("session").deleteMany({ userId: { $in: allUserIds } }),
			db.collection("account").deleteMany({ userId: { $in: allUserIds } }),
			db.collection("verification").deleteMany({
				identifier: { $in: emails },
			}),
			db.collection("user").deleteMany({ email: { $in: emails } }),
		]);

		await mongoose.disconnect();
		await authClient.close();
	}, 30_000);

	it(
		"keeps public roles constrained and moderation discovery fail-closed",
		async () => {
			const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

			try {
				const invalidResponse = await signUp({
					email: invalidEmail,
					password: "weak-password",
					selectedRole: "student",
					requestedRole: "admin",
				});
				expect(invalidResponse.status).toBe(400);
				expect(
					await db.collection("user").findOne({ email: invalidEmail }),
				).toBeNull();

				const studentResponse = await signUp({
					email: studentEmail,
					selectedRole: "admin",
					requestedRole: "admin",
				});
				expect(studentResponse.ok).toBe(true);

				const student = await db.collection("user").findOne({ email: studentEmail });
				expect(student).not.toBeNull();
				expect(student?.role).toBe("student");
				const studentId = String(student?.id ?? student?._id);
				userIds.push(studentId);
				expect(await TutorProfile.findOne({ userId: studentId })).toBeNull();

				const tutorResponse = await signUp({
					email: tutorEmail,
					selectedRole: "tutor",
					requestedRole: "admin",
				});
				expect(tutorResponse.ok).toBe(true);

				const tutor = await db.collection("user").findOne({ email: tutorEmail });
				expect(tutor).not.toBeNull();
				expect(tutor?.role).toBe("tutor");
				const tutorId = String(tutor?.id ?? tutor?._id);
				userIds.push(tutorId);
				profileUserIds.push(tutorId);

				const profile = await TutorProfile.findOne({ userId: tutorId });
				expect(profile).not.toBeNull();
				expect(profile?.status).toBe("draft");
				expect(profile?.isApproved).toBe(false);

				if (!profile) throw new Error("Tutor profile hook did not create a profile");
				profile.status = "pending_review";
				await profile.save();

				const approved = await TutorProfile.findOneAndUpdate(
					{ _id: profile._id, status: "pending_review" },
					{
						$set: {
							status: "approved",
							isApproved: true,
							approvedAt: new Date(),
							approvedBy: studentId,
						},
					},
					{ new: true },
				);
				expect(approved?.status).toBe("approved");
				expect(approved?.isApproved).toBe(true);

				const repeatedApproval = await TutorProfile.findOneAndUpdate(
					{ _id: profile._id, status: "pending_review" },
					{ $set: { status: "approved", isApproved: true } },
					{ new: true },
				);
				expect(repeatedApproval).toBeNull();

				const inconsistentUserId = `${runId}-inconsistent`;
				profileUserIds.push(inconsistentUserId);
				await TutorProfile.create({
					userId: inconsistentUserId,
					slug: inconsistentUserId,
					status: "approved",
					isApproved: false,
				});

				const discoverable = await TutorProfile.find({
					userId: { $in: [tutorId, inconsistentUserId] },
					status: "approved",
					isApproved: true,
				}).lean();
				expect(discoverable).toHaveLength(1);
				expect(discoverable[0]?.userId).toBe(tutorId);

				if (!approved) throw new Error("Pending tutor could not be approved");
				resetTutorModeration(approved);
				await approved.save();
				expect(approved.status).toBe("draft");
				expect(approved.isApproved).toBe(false);
				expect(
					await TutorProfile.exists({
						_id: approved._id,
						status: "approved",
						isApproved: true,
					}),
				).toBeNull();
			} finally {
				consoleLog.mockRestore();
			}
		},
		60_000,
	);
});
