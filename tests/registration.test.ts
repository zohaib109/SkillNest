import { describe, expect, it } from "vitest";
import {
	readSelectedRoleCookie,
	resolveSelfServiceRole,
} from "@/lib/registration";
import { signUpCredentialsSchema } from "@/lib/validators/auth";

describe("self-service role resolution", () => {
	it("allows student and tutor registration", () => {
		expect(resolveSelfServiceRole("student")).toBe("student");
		expect(resolveSelfServiceRole("tutor")).toBe("tutor");
	});

	it("never grants admin through public input", () => {
		expect(resolveSelfServiceRole("admin")).toBe("student");
		expect(resolveSelfServiceRole({ role: "admin" })).toBe("student");
	});

	it("supports the constrained OAuth role cookie", () => {
		expect(resolveSelfServiceRole("student", "tutor")).toBe("tutor");
	});
});

describe("registration role cookie parsing", () => {
	it("reads only supported roles", () => {
		expect(readSelectedRoleCookie("theme=dark; selected_role=tutor")).toBe(
			"tutor",
		);
		expect(readSelectedRoleCookie("selected_role=admin")).toBeNull();
		expect(readSelectedRoleCookie("selected_role=%ZZ")).toBeNull();
	});
});

describe("server signup validation", () => {
	it("normalizes valid account details", () => {
		const parsed = signUpCredentialsSchema.parse({
			name: "  Ayesha Khan  ",
			email: "  AYESHA@EXAMPLE.COM ",
			password: "SecurePass1!",
		});

		expect(parsed.name).toBe("Ayesha Khan");
		expect(parsed.email).toBe("ayesha@example.com");
	});

	it("rejects weak passwords and invalid names", () => {
		expect(
			signUpCredentialsSchema.safeParse({
				name: "User 123",
				email: "user@example.com",
				password: "password",
			}).success,
		).toBe(false);
	});
});
