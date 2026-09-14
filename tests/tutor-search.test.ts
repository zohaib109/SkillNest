import { describe, expect, it } from "vitest";
import { parseTutorSearchParams } from "@/lib/tutor-search";

describe("tutor discovery search params", () => {
	it("accepts supported filters and normalizes bounds", () => {
		expect(
			parseTutorSearchParams({
				q: "  physics  ",
				subject: "Physics",
				language: "English",
				currency: "USD",
				duration: "60",
				minRate: "80",
				maxRate: "20",
				sort: "price_asc",
				page: "3",
			}),
		).toEqual({
			query: "physics",
			subject: "Physics",
			language: "English",
			currency: "USD",
			duration: 60,
			minRate: 20,
			maxRate: 80,
			savedOnly: false,
			sort: "price_asc",
			page: 3,
		});
	});

	it("drops unsupported values and clamps pagination", () => {
		const filters = parseTutorSearchParams({
			subject: "Hacking",
			language: "Klingon",
			currency: "BTC",
			duration: "75",
			minRate: "nope",
			saved: "1",
			sort: "random",
			page: "9999",
		});

		expect(filters).toMatchObject({
			subject: "",
			language: "",
			currency: "",
			duration: undefined,
			minRate: undefined,
			savedOnly: true,
			sort: "recommended",
			page: 100,
		});
	});
});
