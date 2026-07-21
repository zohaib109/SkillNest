"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";

interface Subject {
	name: string;
	category:
		| "Languages"
		| "School subjects"
		| "Programming"
		| "University subjects";
	description: string;
	popularTopics: string[];
}

const SUBJECTS_DATA: Subject[] = [
	// Languages
	{
		name: "English",
		category: "Languages",
		description:
			"Gain confidence in conversational English, business writing, TOEFL/IELTS preparation, and literature analysis.",
		popularTopics: [
			"IELTS Prep",
			"Conversational English",
			"Business Writing",
			"Literature",
		],
	},
	{
		name: "Urdu",
		category: "Languages",
		description:
			"Master Urdu grammar, conversational Urdu, poetry, and classical literature from native expert instructors.",
		popularTopics: [
			"Grammar",
			"Conversational Urdu",
			"Poetry Analysis",
			"Adab",
		],
	},
	{
		name: "Arabic",
		category: "Languages",
		description:
			"Learn Classical Arabic (Fusha) for academic, spiritual, or professional reasons, or standard dialects.",
		popularTopics: [
			"Quranic Arabic",
			"Modern Standard Arabic",
			"Levantine Dialect",
			"Grammar",
		],
	},
	{
		name: "Spanish",
		category: "Languages",
		description:
			"Learn grammar, vocabulary, pronunciation, and AP Spanish exam prep with interactive native tutors.",
		popularTopics: [
			"AP Spanish",
			"Spanish for Travel",
			"Conversational",
			"Dele Exam",
		],
	},
	{
		name: "French",
		category: "Languages",
		description:
			"Explore the language of culture and international relations. Cover DELF prep, phonetics, and conversational skills.",
		popularTopics: [
			"DELF Prep",
			"French Literature",
			"Phonetics",
			"Beginner French",
		],
	},
	{
		name: "German",
		category: "Languages",
		description:
			"Achieve Goethe-Institut certifications (A1-C2) and master technical German grammar and business conversations.",
		popularTopics: [
			"Goethe Certifications",
			"Business German",
			"German Grammar",
		],
	},
	{
		name: "Mandarin",
		category: "Languages",
		description:
			"Learn Chinese characters, Pinyin, tones, and prepare for HSK examinations with patient guidance.",
		popularTopics: ["HSK Prep", "Pinyin & Tones", "Business Mandarin"],
	},

	// School subjects
	{
		name: "Mathematics",
		category: "School subjects",
		description:
			"Solidify core mathematical understanding from elementary arithmetic and geometry through pre-calculus and SAT prep.",
		popularTopics: [
			"Algebra I & II",
			"Geometry",
			"Trigonometry",
			"SAT Math Prep",
		],
	},
	{
		name: "Physics",
		category: "School subjects",
		description:
			"Understand mechanics, thermodynamics, electromagnetism, and waves. Prepare for GCSE, O-Level, A-Level, or AP Physics.",
		popularTopics: [
			"A-Level Physics",
			"AP Physics Mechanics",
			"O-Level Physics",
			"Electromagnetism",
		],
	},
	{
		name: "Chemistry",
		category: "School subjects",
		description:
			"Break down chemical equations, stoichiometry, states of matter, and atomic structures for high school success.",
		popularTopics: [
			"GCSE Chemistry",
			"AP Chemistry",
			"Organic Basics",
			"Stoichiometry",
		],
	},
	{
		name: "Biology",
		category: "School subjects",
		description:
			"Dive into cell biology, genetics, ecology, and human anatomy. Perfect for students taking school board exams.",
		popularTopics: [
			"Genetics",
			"Anatomy & Physiology",
			"Cellular Biology",
			"Ecology",
		],
	},
	{
		name: "English Literature",
		category: "School subjects",
		description:
			"Critically analyze prose, drama, and poetry. Strengthen essay writing, thesis development, and school assignments.",
		popularTopics: [
			"Shakespeare",
			"Essay Writing",
			"Poetry Analysis",
			"Close Reading",
		],
	},
	{
		name: "History",
		category: "School subjects",
		description:
			"Explore world history, regional events, and geopolitical developments. Develop sound research and argumentative writing.",
		popularTopics: [
			"World History",
			"Modern History",
			"AP US History",
			"Research Writing",
		],
	},

	// Programming / Computer Science
	{
		name: "Python",
		category: "Programming",
		description:
			"Learn Python from the ground up: variables, loops, object-oriented coding, and data science scripts.",
		popularTopics: [
			"Basics for Kids",
			"Data Analysis",
			"OOP in Python",
			"Scripting",
		],
	},
	{
		name: "JavaScript & TypeScript",
		category: "Programming",
		description:
			"Build interactive web frontends and backend APIs. Cover DOM manipulation, async flow, and strict types.",
		popularTopics: [
			"TypeScript Migrations",
			"ES6+ Features",
			"Asynchronous JS",
		],
	},
	{
		name: "Web Development",
		category: "Programming",
		description:
			"Master HTML, CSS, React, and Node.js. Build fully responsive modern web applications from scratch.",
		popularTopics: [
			"React.js",
			"Tailwind CSS",
			"Full Stack Next.js",
			"Node.js & Express",
		],
	},
	{
		name: "Data Structures & Algorithms",
		category: "Programming",
		description:
			"Prepare for coding interviews and exams. Solve complex problems using arrays, linked lists, trees, graphs, and dynamic coding.",
		popularTopics: [
			"LeetCode Prep",
			"Big O Notation",
			"Recursion",
			"Sorting & Searching",
		],
	},
	{
		name: "Databases",
		category: "Programming",
		description:
			"Understand relational models, write complex SQL queries, design database schemas, and explore NoSQL alternatives.",
		popularTopics: ["SQL Queries", "Database Design", "MongoDB", "PostgreSQL"],
	},
	{
		name: "AI & Machine Learning",
		category: "Programming",
		description:
			"Delve into neural networks, machine learning algorithms, model training, and implementations using PyTorch or TensorFlow.",
		popularTopics: [
			"Supervised Learning",
			"Deep Learning",
			"Data Preprocessing",
		],
	},

	// University subjects
	{
		name: "Calculus",
		category: "University subjects",
		description:
			"Master limits, derivatives, integration, multivariable calculus, and differential equations for university exams.",
		popularTopics: [
			"Limits & Continuity",
			"Derivatives",
			"Integration",
			"Differential Equations",
		],
	},
	{
		name: "Linear Algebra",
		category: "University subjects",
		description:
			"Cover vector spaces, matrices, determinants, eigenvalues, eigenvectors, and linear transformations.",
		popularTopics: [
			"Matrix Operations",
			"Vector Spaces",
			"Eigenvalues",
			"Determinants",
		],
	},
	{
		name: "Organic Chemistry",
		category: "University subjects",
		description:
			"Understand chemical reactions, syntheses, molecular geometry, functional groups, and spectroscopy analysis.",
		popularTopics: [
			"Reaction Mechanisms",
			"Stereochemistry",
			"Spectroscopy (NMR/IR)",
		],
	},
	{
		name: "Microeconomics & Macroeconomics",
		category: "University subjects",
		description:
			"Analyze market structures, supply and demand, fiscal policy, monetary theory, inflation, and global trade dynamics.",
		popularTopics: [
			"Supply & Demand",
			"Market Structures",
			"Monetary Policy",
			"GDP & Inflation",
		],
	},
	{
		name: "Psychology",
		category: "University subjects",
		description:
			"Understand cognitive processes, behavioral psychology, research methodologies, developmental milestones, and social dynamics.",
		popularTopics: [
			"Cognitive Science",
			"Behavioral Psychology",
			"Research Methods",
		],
	},
];

const CATEGORIES = [
	"All",
	"Languages",
	"School subjects",
	"Programming",
	"University subjects",
] as const;

export default function SubjectsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] =
		useState<(typeof CATEGORIES)[number]>("All");

	const filteredSubjects = useMemo(() => {
		return SUBJECTS_DATA.filter((subject) => {
			const matchesCategory =
				activeCategory === "All" || subject.category === activeCategory;
			const matchesSearch =
				subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				subject.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				subject.popularTopics.some((topic) =>
					topic.toLowerCase().includes(searchQuery.toLowerCase()),
				);
			return matchesCategory && matchesSearch;
		});
	}, [searchQuery, activeCategory]);

	return (
		<main className="flex-1 bg-background">
			{/* Page Header */}
			<section className="bg-white border-b border-border py-16 sm:py-20">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col gap-6">
					<span className="inline-flex max-w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary mx-auto">
						🎓 SkillNest Curriculum
					</span>
					<h1 className="text-4xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-5xl">
						Subjects We Teach
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						Explore our comprehensive list of academic disciplines, languages,
						and technical skills. Book one-on-one virtual lessons to learn them
						on your own terms.
					</p>

					{/* Search Bar Input */}
					<div className="mx-auto max-w-lg w-full flex items-center rounded-full border border-border bg-white p-1.5 shadow-sm mt-4">
						<div className="flex flex-1 items-center gap-2 pl-4">
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="shrink-0 text-muted-foreground"
								aria-hidden="true"
							>
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.3-4.3" />
							</svg>
							<input
								type="text"
								placeholder="Search subjects or topics..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Subjects Catalog */}
			<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
				{/* Categories filter tabs */}
				<div className="flex flex-wrap gap-2 justify-center mb-10">
					{CATEGORIES.map((category) => (
						<button
							key={category}
							type="button"
							onClick={() => setActiveCategory(category)}
							className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
								activeCategory === category
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-white border border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
							}`}
						>
							{category === "Programming" ? "Programming & Tech" : category}
						</button>
					))}
				</div>

				{/* Subjects list */}
				{filteredSubjects.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredSubjects.map((subject) => (
							<div
								key={subject.name}
								className="flex flex-col rounded-3xl border border-border bg-white p-6 sm:p-8 hover:shadow-xs transition-shadow duration-200"
							>
								<div className="flex items-center justify-between gap-3 mb-4">
									<h2 className="text-xl font-bold text-foreground">
										{subject.name}
									</h2>
									<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-3xs font-semibold text-muted-foreground capitalize">
										{subject.category === "Programming"
											? "Tech"
											: subject.category}
									</span>
								</div>
								<p className="text-sm leading-relaxed text-muted-foreground flex-1">
									{subject.description}
								</p>

								{/* Topics tags */}
								<div className="mt-6">
									<h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
										Popular Topics
									</h3>
									<div className="flex flex-wrap gap-1.5">
										{subject.popularTopics.map((topic) => (
											<span
												key={topic}
												className="inline-flex items-center rounded-lg bg-muted border border-border/60 px-2 py-0.5 text-2xs text-foreground font-medium"
											>
												{topic}
											</span>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center max-w-md mx-auto">
						<p className="text-base text-muted-foreground">
							No subjects found matching your filters. Try searching something
							else!
						</p>
					</div>
				)}
			</section>

			{/* Blocked Tutor Search Banner */}
			<section className="bg-white border-t border-border py-16 sm:py-20 text-center">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6 items-center">
					<h2 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-foreground sm:text-3xl">
						Ready to learn with a private tutor?
					</h2>
					<p className="max-w-xl text-base text-muted-foreground">
						To view individual tutor bios, search available hourly rates, or
						book a live virtual classroom session, sign up for a student
						account.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Link
							href="/sign-up"
							className={buttonVariants({
								variant: "default",
								size: "lg",
								className: "rounded-full px-8",
							})}
						>
							Register a Student Account
						</Link>
						<Link
							href="/sign-in"
							className={buttonVariants({
								variant: "outline",
								size: "lg",
								className:
									"rounded-full px-8 border-primary text-primary hover:bg-primary/5",
							})}
						>
							Sign In
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
