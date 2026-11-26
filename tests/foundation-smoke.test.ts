import { randomBytes } from "node:crypto";
import { type Db, MongoClient } from "mongodb";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { allowsSandboxPayments } from "@/lib/sandbox-payment-config";
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
		const bookingTutorIds = [1, 2].map((id) => `${runId}-booking-tutor-${id}`);
		const bookingStudentIds = [1, 2, 3].map(
			(id) => `${runId}-booking-student-${id}`,
		);
		const paymentTutorId = `${runId}-payment-tutor`;
		const paymentStudentId = `${runId}-payment-student`;
		const reservationStudents = [...bookingStudentIds, paymentStudentId];
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
				const reservations = await db
					.collection("bookings")
					.find(
						{ studentId: { $in: reservationStudents } },
						{ projection: { _id: 1 } },
					)
					.toArray();
				const paymentIds = reservations.map(({ _id }) => _id);
				await Promise.all([
					db.collection("tutorprofiles").deleteMany({
						userId: {
							$in: [
								...userIds,
								inconsistentUserId,
								...bookingTutorIds,
								paymentTutorId,
							],
						},
					}),
					db
						.collection("bookings")
						.deleteMany({ studentId: { $in: reservationStudents } }),
					db
						.collection<{ _id: string }>("studentbookinglocks")
						.deleteMany({ _id: { $in: reservationStudents } }),
					db
						.collection("messagereports")
						.deleteMany({ bookingId: { $in: paymentIds } }),
					db.collection("payments").deleteMany({ _id: { $in: paymentIds } }),
					db
						.collection("refundrequests")
						.deleteMany({ _id: { $in: paymentIds } }),
					db
						.collection("paymentevents")
						.deleteMany({ paymentId: { $in: paymentIds } }),
					db
						.collection("ledgerentries")
						.deleteMany({ paymentId: { $in: paymentIds } }),
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
			expect(await getApprovedTutorBySlug(profile.slug, studentId)).toBeNull();

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
			expect(await getApprovedTutorBySlug(profile.slug, studentId)).toBeNull();
			const tutorHeaders = requestContext.headers;

			await db
				.collection("user")
				.updateOne({ email: adminEmail }, { $set: { role: "admin" } });
			requestContext.headers = await signIn(adminEmail);
			expect(
				(await rejectTutor(profile.id, "Please revise the lesson description."))
					.success,
			).toBe(true);
			expect(await getApprovedTutorBySlug(profile.slug, studentId)).toBeNull();
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
			expect(await getApprovedTutorBySlug(inconsistentUserId, null)).toBeNull();
			expect(await getApprovedTutorBySlug(profile.slug, null)).toBeNull();
			expect((await findApprovedTutors(filters, null)).total).toBe(0);
			await TutorProfile.updateOne(
				{ _id: profile.id },
				{ $set: { publicListing: true } },
			);
			const publicDetail = await getApprovedTutorBySlug(profile.slug, null);
			expect(publicDetail?.quote).toEqual({
				currency: "USD",
				amountMinor: 2500,
			});
			for (const field of [
				"userId",
				"userEmail",
				"scheduling",
				"availabilityRules",
				"status",
				"approvedBy",
			])
				expect(publicDetail).not.toHaveProperty(field);
			expect(
				(await findApprovedTutors(filters, null)).tutors.map((t) => t.id),
			).toEqual([profile.id]);
			await TutorProfile.updateOne(
				{ _id: profile.id },
				{ $set: { publicListing: false } },
			);
			expect(await getApprovedTutorBySlug(profile.slug, null)).toBeNull();
			const approved = await getApprovedTutorBySlug(profile.slug, studentId);
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
			expect(await getApprovedTutorBySlug(profile.slug, studentId)).toBeNull();
			expect((await findApprovedTutors(filters, studentId)).total).toBe(0);
		}, 60_000);

		it("keeps published learning notes private to the booking and reuses practice only for the same participant pair", async () => {
			const { Booking } = await import("@/models/Booking");
			const {
				publishLessonRecap,
				recordPracticeResponse,
				lastPracticeWithTutor,
			} = await import("@/lib/lesson-notes");
			const { recapInput } = await import("@/lib/validators/lesson-notes");
			const student = bookingStudentIds[0],
				tutor = `${runId}-practice-tutor`;
			const now = Date.now();
			const b = await Booking.create({
				studentId: student,
				tutorId: tutor,
				tutorProfileId: new mongoose.Types.ObjectId(),
				tutorName: "Test",
				startsAt: new Date(now - 7200000),
				endsAt: new Date(now - 3600000),
				blockedUntil: new Date(now - 3600000),
				duration: 60,
				tutorTimezone: "UTC",
				studentTimezone: "UTC",
				amountMinor: 2500,
				currency: "USD",
				status: "confirmed",
				holdExpiresAt: new Date(now - 7300000),
				confirmedAt: new Date(now - 7200001),
			});
			const id = String(b._id),
				note = {
					practised: "Trace a loop",
					exercise: "Predict the output for an empty list",
					resource: "",
				};
			expect(
				recapInput.safeParse({ ...note, resource: "javascript:alert(1)" })
					.success,
			).toBe(false);
			expect(await lastPracticeWithTutor(student, tutor)).toBeNull();
			expect(await recordPracticeResponse(student, id, "independent")).toBe(
				false,
			);
			expect(await publishLessonRecap(bookingTutorIds[1], id, note)).toBe(
				false,
			);
			await Booking.updateOne(
				{ _id: id },
				{ $set: { endsAt: new Date(now + 3600000) } },
			);
			expect(await publishLessonRecap(tutor, id, note)).toBe(false);
			await Booking.updateOne(
				{ _id: id },
				{ $set: { endsAt: new Date(now - 3600000) } },
			);
			expect(
				await Promise.all([
					publishLessonRecap(tutor, id, note),
					publishLessonRecap(tutor, id, note),
				]),
			).toEqual([true, true]);
			expect(
				await publishLessonRecap(tutor, id, {
					...note,
					exercise: "Different practice",
				}),
			).toBe(false);
			expect(
				await recordPracticeResponse(bookingStudentIds[1], id, "independent"),
			).toBe(false);
			expect(await recordPracticeResponse(student, id, "needs_help")).toBe(
				true,
			);
			expect(await recordPracticeResponse(student, id, "independent")).toBe(
				true,
			);
			expect((await Booking.findById(id).lean())?.status).toBe("confirmed");
			expect(await lastPracticeWithTutor(student, tutor)).toBe(note.exercise);
			expect(
				await lastPracticeWithTutor(bookingStudentIds[1], tutor),
			).toBeNull();
			await Booking.updateOne({ _id: id }, { $set: { status: "cancelled" } });
			expect(await recordPracticeResponse(student, id, "needs_help")).toBe(
				false,
			);
			expect(await lastPracticeWithTutor(student, tutor)).toBeNull();
		});

		it("scopes booking messages, concurrent retries, reports and unread state to the lesson", async () => {
			const { Booking } = await import("@/models/Booking");
			const { MessageReport } = await import("@/models/MessageReport");
			const {
				sendThreadMessage,
				readThread,
				markThreadRead,
				reportThreadMessage,
			} = await import("@/lib/booking-messages");
			const student = { id: bookingStudentIds[0], role: "student" as const },
				tutor = { id: `${runId}-thread-tutor`, role: "tutor" as const },
				other = { ...student, id: bookingStudentIds[2] };
			const day = new Date(Date.now() + 86400000);
			const b = await Booking.create({
				studentId: student.id,
				tutorId: tutor.id,
				tutorProfileId: new mongoose.Types.ObjectId(),
				tutorName: "Test",
				startsAt: day,
				endsAt: new Date(+day + 1800000),
				blockedUntil: new Date(+day + 1800000),
				duration: 30,
				tutorTimezone: "UTC",
				studentTimezone: "UTC",
				amountMinor: 1250,
				currency: "USD",
				status: "confirmed",
				holdExpiresAt: day,
				confirmedAt: new Date(),
			});
			const id = String(b._id),
				nonce = crypto.randomUUID(),
				key = `student-${nonce}`;
			expect(await readThread(id, other)).toBeNull();
			expect(await sendThreadMessage(id, other, nonce, "unauthorized")).toBe(
				false,
			);
			expect(
				await Promise.all([
					sendThreadMessage(id, student, nonce, "Practise loops?"),
					sendThreadMessage(id, student, nonce, "Practise loops?"),
				]),
			).toEqual([true, true]);
			expect(await sendThreadMessage(id, student, nonce, "Changed body")).toBe(
				false,
			);
			expect(
				await sendThreadMessage(id, student, crypto.randomUUID(), "Too soon"),
			).toBe(false);
			const thread = await readThread(id, tutor);
			expect(thread?.messages.map((m) => m.body)).toEqual(["Practise loops?"]);
			expect(thread?.unread).toBe(1);
			expect((await Booking.findById(id).lean())?.messages).toBeUndefined();
			expect(await markThreadRead(id, tutor, 2)).toBe(false);
			expect(await markThreadRead(id, tutor, 1)).toBe(true);
			expect((await readThread(id, tutor))?.unread).toBe(0);
			expect(await reportThreadMessage(id, student, key, "Own message")).toBe(
				false,
			);
			expect(await reportThreadMessage(id, other, key, "Outside booking")).toBe(
				false,
			);
			expect(
				await reportThreadMessage(id, tutor, key, "Please review this message"),
			).toBe(true);
			expect(await reportThreadMessage(id, tutor, key, "Retry")).toBe(true);
			expect(await MessageReport.countDocuments({ bookingId: id })).toBe(1);
			await Booking.updateOne({ _id: id }, { $set: { status: "cancelled" } });
			expect(
				await sendThreadMessage(id, tutor, crypto.randomUUID(), "Too late"),
			).toBe(false);
			expect((await readThread(id, tutor))?.canSend).toBe(false);
		});
		it("serializes tutor and student reservations and releases expired and cancelled holds", async () => {
			const { reserveLesson, cancelLessonHold } = await import(
				"@/actions/bookings"
			);
			const {
				createBookingHold,
				getBookableWeek,
				listStudentBookings,
				releaseBookingHold,
			} = await import("@/lib/bookings");
			const { Booking, StudentBookingLock } = await import("@/models/Booking");
			const { TutorProfile } = await import("@/models/TutorProfile");
			const { DAY_MS, withSchedulingDefaults } = await import(
				"@/lib/scheduling"
			);
			const [student, otherStudent, unrelated] = bookingStudentIds;
			const day = new Date(
				Math.floor(Date.now() / DAY_MS) * DAY_MS + 2 * DAY_MS,
			);
			const date = day.toISOString().slice(0, 10);
			const tutors = await TutorProfile.create(
				bookingTutorIds.map((id) => ({
					userId: id,
					slug: id,
					userName: "Booking Smoke Tutor",
					timezone: "UTC",
					hourlyRate: 25,
					currency: "USD",
					status: "approved" as const,
					isApproved: true,
					lessonDurations: [30, 60],
					availabilityRules: [
						{
							dayOfWeek: day.getUTCDay(),
							startTime: "09:00",
							endTime: "18:00",
						},
					],
					scheduling: withSchedulingDefaults({ bufferMinutes: 15 }),
				})),
			);
			const input = (profileIndex: number, time: string, duration = 60) => ({
				profileId: String(tutors[profileIndex]._id),
				startsAt: new Date(`${date}T${time}:00Z`),
				duration: duration as 30 | 60,
				studentTimezone: "Asia/Karachi",
				amountMinor: duration === 60 ? 2500 : 1250,
				currency: "USD",
			});
			requestContext.headers = new Headers();
			expect(await reserveLesson("", new FormData())).toBe(
				"A verified student account is required.",
			);
			expect(await cancelLessonHold("", new FormData())).toBe(
				"A verified student account is required.",
			);

			const bids = await Promise.all([
				createBookingHold(student, input(0, "09:00")),
				createBookingHold(otherStudent, input(0, "09:30", 30)),
			]);
			expect(bids.filter((result) => result.success)).toHaveLength(1);
			const winnerIndex = bids.findIndex((result) => result.success);
			const winner = bids[winnerIndex];
			if (!winner.success) throw new Error("Expected a reservation");
			const [winnerId, loserId] =
				winnerIndex === 0 ? [student, otherStudent] : [otherStudent, student];
			const winningInput =
				winnerIndex === 0 ? input(0, "09:00") : input(0, "09:30", 30);
			expect(await createBookingHold(winnerId, winningInput)).toEqual(winner);
			expect(await releaseBookingHold(unrelated, winner.id)).toBe(false);
			expect(await listStudentBookings(unrelated)).toEqual([]);
			expect(await Booking.findById(winner.id).lean()).toMatchObject({
				studentTimezone: "Asia/Karachi",
				tutorTimezone: "UTC",
				amountMinor: winningInput.amountMinor,
				status: "held",
			});
			expect(
				(await getBookableWeek(tutors[0].slug, loserId, 30, 0))?.slots,
			).not.toContain(`${date}T10:00:00.000Z`);
			expect(
				(await createBookingHold(loserId, input(0, "10:00", 30))).success,
			).toBe(false);
			await Booking.updateOne(
				{ _id: winner.id },
				{ $set: { holdExpiresAt: new Date(Date.now() - 1000) } },
			);
			expect(await releaseBookingHold(winnerId, winner.id)).toBe(false);
			const replacement = await createBookingHold(
				loserId,
				input(0, "09:30", 30),
			);
			expect(replacement.success).toBe(true);
			if (!replacement.success) throw new Error(replacement.error);
			expect(await releaseBookingHold(loserId, replacement.id)).toBe(true);
			expect(
				(
					await createBookingHold(winnerId, {
						...input(0, "09:00"),
						amountMinor: 1,
					})
				).success,
			).toBe(false);
			expect(
				(await createBookingHold(winnerId, input(0, "09:07"))).success,
			).toBe(false);

			const overlappingTutors = await Promise.all([
				createBookingHold(unrelated, input(0, "13:00")),
				createBookingHold(unrelated, input(1, "13:15")),
			]);
			expect(overlappingTutors.filter((result) => result.success)).toHaveLength(
				1,
			);
			expect(await listStudentBookings(unrelated)).toHaveLength(1);
			expect(await StudentBookingLock.countDocuments({ _id: unrelated })).toBe(
				1,
			);

			await TutorProfile.updateOne(
				{ _id: tutors[0]._id },
				{ $set: { "scheduling.timeOffDates": [date] } },
			);
			expect(
				(await createBookingHold(student, input(0, "16:00"))).success,
			).toBe(false);
			await TutorProfile.updateOne(
				{ _id: tutors[1]._id },
				{ $set: { isApproved: false } },
			);
			expect(await getBookableWeek(tutors[1].slug, student, 60, 0)).toBeNull();
			expect(
				(await createBookingHold(student, input(1, "16:00"))).success,
			).toBe(false);
		}, 60_000);

		it.runIf(
			allowsSandboxPayments({
				enabled: "true",
				nodeEnv: "test",
				mongoUri: process.env.SMOKE_MONGODB_URI ?? "",
				authUrl: origin,
			}),
		)(
			"applies signed sandbox events once, reconciles late captures, and never confirms a failed payment",
			async () => {
				vi.stubEnv("SKILLNEST_ENABLE_SANDBOX_PAYMENTS", "true");
				const { runSandboxCheckout } = await import(
					"@/actions/sandbox-payments"
				);
				const { decideSandboxRefund, requestSandboxCancellation } =
					await import("@/actions/refunds");
				const { createBookingHold, listTutorLessons } = await import(
					"@/lib/bookings"
				);
				const {
					cancelAndRequestSandboxRefund,
					listSandboxReconciliation,
					listStudentRefunds,
					reviewSandboxRefund,
				} = await import("@/lib/refunds");
				const { DAY_MS } = await import("@/lib/scheduling");
				const {
					recordSandboxPaymentEvent,
					signSandboxPaymentEvent,
					simulateLessonPayment,
				} = await import("@/lib/sandbox-payments");
				const { Booking } = await import("@/models/Booking");
				const { LedgerEntry, Payment, PaymentEvent } = await import(
					"@/models/Payment"
				);
				const { TutorProfile } = await import("@/models/TutorProfile");
				const day = new Date(
					Math.floor(Date.now() / DAY_MS) * DAY_MS + 2 * DAY_MS,
				);
				const date = day.toISOString().slice(0, 10);
				const profile = await TutorProfile.create({
					userId: paymentTutorId,
					slug: paymentTutorId,
					userName: "Sandbox Payment Tutor",
					timezone: "UTC",
					hourlyRate: 25,
					currency: "USD",
					status: "approved",
					isApproved: true,
					lessonDurations: [60],
					availabilityRules: [
						{
							dayOfWeek: day.getUTCDay(),
							startTime: "09:00",
							endTime: "18:00",
						},
					],
				});
				const holdInput = (time: string) => ({
					profileId: String(profile._id),
					startsAt: new Date(`${date}T${time}:00Z`),
					duration: 60 as const,
					studentTimezone: "Asia/Karachi",
					amountMinor: 2500,
					currency: "USD",
				});
				const first = await createBookingHold(
					paymentStudentId,
					holdInput("10:00"),
				);
				const late = await createBookingHold(
					paymentStudentId,
					holdInput("14:00"),
				);
				if (!first.success || !late.success)
					throw new Error("Expected both sandbox holds");
				const bodyFor = (id: string, suffix: string, amount = 2500) =>
					JSON.stringify({
						id: `${id}:${suffix}`,
						paymentId: id,
						kind: "succeeded",
						currency: "USD",
						amountMinor: amount,
					});
				requestContext.headers = new Headers();
				expect(await runSandboxCheckout("", new FormData())).toBe(
					"A verified student account is required.",
				);
				expect(
					await simulateLessonPayment(bookingStudentIds[0], first.id),
				).toBeNull();
				expect(
					await simulateLessonPayment(paymentStudentId, first.id, "failed"),
				).toBe("failed");
				expect((await Booking.findById(first.id))?.status).toBe("held");
				expect(await LedgerEntry.countDocuments({ paymentId: first.id })).toBe(
					0,
				);
				expect(
					await recordSandboxPaymentEvent(
						bodyFor(first.id, "fake"),
						"0".repeat(64),
					),
				).toBeNull();
				const wrongAmount = bodyFor(first.id, "mismatch", 2499);
				expect(
					await recordSandboxPaymentEvent(
						wrongAmount,
						signSandboxPaymentEvent(wrongAmount),
					),
				).toBe("amount_mismatch");
				expect((await Booking.findById(first.id))?.status).toBe("held");
				expect(
					await Promise.all([
						simulateLessonPayment(paymentStudentId, first.id),
						simulateLessonPayment(paymentStudentId, first.id),
					]),
				).toEqual(["confirmed", "confirmed"]);
				expect(await Booking.findById(first.id).lean()).toMatchObject({
					status: "confirmed",
					paymentMode: "sandbox",
				});
				expect(
					await Payment.countDocuments({ _id: first.id, status: "captured" }),
				).toBe(1);
				expect(
					await PaymentEvent.countDocuments({
						paymentId: first.id,
						outcome: "confirmed",
					}),
				).toBe(1);
				const entries = await LedgerEntry.find({ paymentId: first.id })
					.sort({ amountMinor: 1 })
					.lean();
				expect(
					entries.map(({ kind, amountMinor, mode }) => [
						kind,
						amountMinor,
						mode,
					]),
				).toEqual([
					["platform_commission", 375, "sandbox"],
					["pending_tutor_earning", 2125, "sandbox"],
				]);
				expect(
					await simulateLessonPayment(paymentStudentId, late.id, "failed"),
				).toBe("failed");
				await Booking.updateOne(
					{ _id: late.id },
					{ $set: { holdExpiresAt: new Date(Date.now() - 1000) } },
				);
				expect(
					(await createBookingHold(bookingStudentIds[0], holdInput("14:00")))
						.success,
				).toBe(true);
				const lateCapture = bodyFor(late.id, "late");
				expect(
					await recordSandboxPaymentEvent(
						lateCapture,
						signSandboxPaymentEvent(lateCapture),
					),
				).toBe("refund_required");
				expect((await Booking.findById(late.id))?.status).toBe("held");
				expect(await LedgerEntry.countDocuments({ paymentId: late.id })).toBe(
					0,
				);
				expect((await Payment.findById(late.id))?.status).toBe(
					"refund_required",
				);

				expect(await listTutorLessons(bookingTutorIds[0])).toEqual([]);
				expect(
					(await listTutorLessons(paymentTutorId)).map(({ _id }) =>
						String(_id),
					),
				).toEqual([first.id]);
				const reason = "I need to reschedule the lesson.";
				expect(
					await cancelAndRequestSandboxRefund(
						bookingStudentIds[0],
						first.id,
						reason,
					),
				).toBe(false);
				expect(
					await cancelAndRequestSandboxRefund(
						paymentStudentId,
						first.id,
						reason,
					),
				).toBe(true);
				expect(
					await cancelAndRequestSandboxRefund(
						paymentStudentId,
						first.id,
						reason,
					),
				).toBe(true);
				expect((await Booking.findById(first.id))?.status).toBe("cancelled");
				expect(
					await listStudentRefunds(bookingStudentIds[0], [first.id]),
				).toEqual([]);
				expect(
					(await listSandboxReconciliation()).requests.find(
						({ _id }) => String(_id) === first.id,
					),
				).toMatchObject({ amountMinor: 2500, status: "requested" });
				expect(await decideSandboxRefund("", new FormData())).toBe(
					"A verified administrator account is required.",
				);
				requestContext.headers = await signIn(studentEmail);
				expect(await decideSandboxRefund("", new FormData())).toBe(
					"A verified administrator account is required.",
				);
				await db
					.collection("user")
					.updateOne({ email: adminEmail }, { $set: { emailVerified: true } });
				requestContext.headers = await signIn(adminEmail);
				expect(await requestSandboxCancellation("", new FormData())).toBe(
					"A verified student account is required.",
				);
				const refundForm = new FormData();
				refundForm.set("bookingId", first.id);
				refundForm.set("decision", "approved");
				refundForm.set("note", "Approved per the sandbox notice window.");
				const decisions = await Promise.all([
					decideSandboxRefund("", refundForm),
					decideSandboxRefund("", refundForm),
				]);
				expect(decisions.filter((message) => message === "")).toHaveLength(1);
				expect(
					await reviewSandboxRefund(
						"duplicate-review",
						first.id,
						"rejected",
						"Already reviewed",
					),
				).toBe(false);
				expect((await Payment.findById(first.id))?.status).toBe("refunded");
				const refundEntries = await LedgerEntry.find({
					paymentId: first.id,
				}).lean();
				expect(refundEntries).toHaveLength(4);
				expect(
					refundEntries.reduce(
						(balance, { amountMinor }) => balance + amountMinor,
						0,
					),
				).toBe(0);
				const repeatedCapture = bodyFor(first.id, "distinct-replay");
				expect(
					await recordSandboxPaymentEvent(
						repeatedCapture,
						signSandboxPaymentEvent(repeatedCapture),
					),
				).toBe("ignored");
				expect(
					(await createBookingHold(bookingStudentIds[1], holdInput("10:00")))
						.success,
				).toBe(true);
			},
			60_000,
		);
	},
);
