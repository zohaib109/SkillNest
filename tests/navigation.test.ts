import { describe, expect, it } from "vitest";
import { sanitizeInternalPath } from "@/lib/navigation";

describe("sanitizeInternalPath", () => {
	it("keeps local paths including query strings", () => {
		expect(sanitizeInternalPath("/tutors?subject=Math")).toBe(
			"/tutors?subject=Math",
		);
	});

	it("rejects external and protocol-relative redirects", () => {
		expect(sanitizeInternalPath("https://example.com/phishing")).toBe(
			"/dashboard",
		);
		expect(sanitizeInternalPath("//example.com/phishing")).toBe("/dashboard");
	});

	it("uses the requested fallback for invalid input", () => {
		expect(sanitizeInternalPath(null, "/sign-in")).toBe("/sign-in");
	});
});
