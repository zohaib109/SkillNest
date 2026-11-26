import { describe, expect, it } from "vitest";
import { allowsSandboxPayments } from "@/lib/sandbox-payment-config";

describe("sandbox payment isolation", () => {
	const isolated = {
		enabled: "true",
		nodeEnv: "development",
		authUrl: "http://localhost:3000",
		mongoUri:
			"mongodb://127.0.0.1:27030/skillnest_sandbox_checkout?replicaSet=local&directConnection=true",
	};

	it("accepts only explicit opt-in and a loopback, directly connected sandbox database", () => {
		expect(allowsSandboxPayments(isolated)).toBe(true);
		expect(allowsSandboxPayments({ ...isolated, enabled: undefined })).toBe(
			false,
		);
		expect(allowsSandboxPayments({ ...isolated, nodeEnv: "production" })).toBe(
			false,
		);
		expect(
			allowsSandboxPayments({
				...isolated,
				mongoUri: isolated.mongoUri.replace(
					"skillnest_sandbox_checkout",
					"skillnest",
				),
			}),
		).toBe(false);
		expect(
			allowsSandboxPayments({
				...isolated,
				mongoUri: isolated.mongoUri.replace("127.0.0.1", "example.com"),
			}),
		).toBe(false);
		expect(
			allowsSandboxPayments({
				...isolated,
				mongoUri: isolated.mongoUri.replace(
					"directConnection=true",
					"directConnection=false",
				),
			}),
		).toBe(false);
		expect(
			allowsSandboxPayments({ ...isolated, authUrl: "https://example.com" }),
		).toBe(false);
	});
});
