import { describe, expect, it } from "vitest";
import { resetTutorModeration } from "@/lib/tutor-moderation";
import { tutorProfileSchema } from "@/lib/validators/tutor";

const validProfile = {
	headline: "Experienced mathematics tutor",
	bio: "I help students build durable mathematical understanding with clear, patient, and practical lessons.",
	subjects: ["Mathematics"],
	languages: ["English"],
	hourlyRate: 25,
	currency: "USD",
	introVideoUrl: "https://www.youtube.com/watch?v=example",
	country: "Pakistan",
	timezone: "Asia/Karachi",
	lessonDurations: [60],
};

describe("tutor profile validation", () => {
	it("accepts supported video hosts and valid IANA timezones", () => {
		expect(tutorProfileSchema.safeParse(validProfile).success).toBe(true);
		expect(
			tutorProfileSchema.safeParse({
				...validProfile,
				introVideoUrl: "https://player.vimeo.com/video/123",
			}).success,
		).toBe(true);
	});

	it("rejects deceptive video URLs and invalid timezones", () => {
		expect(
			tutorProfileSchema.safeParse({
				...validProfile,
				introVideoUrl: "https://example.com/?next=youtube.com",
			}).success,
		).toBe(false);
		expect(
			tutorProfileSchema.safeParse({
				...validProfile,
				timezone: "Not/A_Timezone",
			}).success,
		).toBe(false);
	});

	it("rejects duplicated selections", () => {
		expect(
			tutorProfileSchema.safeParse({
				...validProfile,
				subjects: ["Mathematics", "Mathematics"],
			}).success,
		).toBe(false);
	});
});

describe("tutor moderation reset", () => {
	it("leaves an existing draft unchanged", () => {
		const profile = {
			status: "draft" as const,
			isApproved: false,
			approvedAt: null,
			approvedBy: "",
			rejectionReason: "",
		};

		expect(resetTutorModeration(profile)).toBe(false);
		expect(profile.status).toBe("draft");
	});

	it("returns edited approved content to a private draft", () => {
		const profile = {
			status: "approved" as const,
			isApproved: true,
			approvedAt: new Date("2026-01-01T00:00:00.000Z"),
			approvedBy: "admin-id",
			rejectionReason: "",
		};

		expect(resetTutorModeration(profile)).toBe(true);
		expect(profile).toMatchObject({
			status: "draft",
			isApproved: false,
			approvedAt: null,
			approvedBy: "",
			rejectionReason: "",
		});
	});
});
