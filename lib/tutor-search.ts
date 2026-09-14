import {
	CURRENCIES,
	LANGUAGES,
	LESSON_DURATIONS,
	SUBJECTS,
} from "@/lib/constants";

export const TUTOR_SORTS = [
	"recommended",
	"rating",
	"price_asc",
	"price_desc",
	"newest",
] as const;

export type TutorSort = (typeof TUTOR_SORTS)[number];

export interface TutorSearchFilters {
	query: string;
	subject: string;
	language: string;
	currency: string;
	duration?: number;
	minRate?: number;
	maxRate?: number;
	savedOnly: boolean;
	sort: TutorSort;
	page: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function scalar(value: string | string[] | undefined): string {
	return typeof value === "string" ? value : "";
}

function optionalNumber(value: string, options?: { integer?: boolean }) {
	if (value === "") return undefined;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) return undefined;
	return options?.integer ? Math.floor(parsed) : parsed;
}

export function parseTutorSearchParams(
	params: RawSearchParams,
): TutorSearchFilters {
	const subject = scalar(params.subject);
	const language = scalar(params.language);
	const currency = scalar(params.currency);
	const duration = optionalNumber(scalar(params.duration), { integer: true });
	const rawSort = scalar(params.sort);
	const rawPage = optionalNumber(scalar(params.page), { integer: true });
	let minRate = optionalNumber(scalar(params.minRate));
	let maxRate = optionalNumber(scalar(params.maxRate));

	if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
		[minRate, maxRate] = [maxRate, minRate];
	}

	return {
		query: scalar(params.q).trim().slice(0, 80),
		subject: SUBJECTS.includes(subject as (typeof SUBJECTS)[number])
			? subject
			: "",
		language: LANGUAGES.includes(language as (typeof LANGUAGES)[number])
			? language
			: "",
		currency: CURRENCIES.some((item) => item.code === currency) ? currency : "",
		duration: LESSON_DURATIONS.includes(
			duration as (typeof LESSON_DURATIONS)[number],
		)
			? duration
			: undefined,
		minRate,
		maxRate,
		savedOnly: scalar(params.saved) === "1",
		sort: TUTOR_SORTS.includes(rawSort as TutorSort)
			? (rawSort as TutorSort)
			: "recommended",
		page: Math.min(Math.max(rawPage ?? 1, 1), 100),
	};
}
