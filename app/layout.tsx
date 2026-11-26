import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

const bricolage = Bricolage_Grotesque({
	subsets: ["latin"],
	variable: "--font-heading",
	weight: ["800"],
	display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-body",
	weight: ["400", "500"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "SkillNest — One-to-one university tutoring",
	description:
		"Browse reviewed tutor profiles, compare lesson totals and find help with introductory programming and university subjects.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(
				"h-full antialiased",
				bricolage.variable,
				plusJakarta.variable,
			)}
		>
			<head>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: inline script is required to prevent layout flash on dark mode load
					dangerouslySetInnerHTML={{
						__html: `
							try {
								if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
									document.documentElement.classList.add('dark');
								} else {
									document.documentElement.classList.remove('dark');
								}
							} catch (_) {}
						`,
					}}
				/>
			</head>
			<body className="min-h-full flex flex-col font-[var(--font-body)]">
				<Navbar />
				{children}
			</body>
		</html>
	);
}
