import Link from "next/link";
import { notFound } from "next/navigation";
import { acknowledgeMessages } from "@/actions/booking-messages";
import {
	ReportMessage,
	ThreadControls,
} from "@/components/dashboard/booking-thread";
import { LocalTime } from "@/components/tutors/local-time";
import { getSession } from "@/lib/auth-server";
import { readThread } from "@/lib/booking-messages";
import { bookingIdSchema } from "@/lib/validators/booking";

export default async function BookingMessages({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ before?: string }>;
}) {
	const { id } = await params;
	const session = await getSession();
	const role = session?.user.role;
	if (
		!session?.user.emailVerified ||
		(role !== "student" && role !== "tutor") ||
		!bookingIdSchema.safeParse(id).success
	)
		notFound();
	const { before: cursor } = await searchParams;
	const before = cursor === undefined ? undefined : Number(cursor);
	if (
		before !== undefined &&
		(!Number.isInteger(before) || before < 1 || before > 120)
	)
		notFound();
	const thread = await readThread(id, { id: session.user.id, role }, before);
	if (!thread) notFound();
	const path = `/dashboard/messages/${id}`;
	return (
		<div className="mx-auto max-w-2xl space-y-5">
			<Link
				className="text-primary underline"
				href={role === "student" ? "/dashboard/bookings" : "/dashboard/lessons"}
			>
				Back to my lessons
			</Link>
			<header>
				<h1 className="text-3xl">Lesson messages</h1>
				<p className="mt-1 text-muted-foreground">
					{thread.tutorName} ·{" "}
					<LocalTime value={thread.startsAt.toISOString()} />
				</p>
			</header>
			{thread.older > 0 && (
				<Link
					href={`${path}?before=${thread.older}`}
					className="inline-block text-primary underline"
				>
					Older messages
				</Link>
			)}
			{before && (
				<Link href={path} className="block text-primary underline">
					Latest messages
				</Link>
			)}
			{thread.messages.length ? (
				<ol className="space-y-3">
					{thread.messages.map((message) => (
						<li
							key={message.key}
							className="rounded-xl border border-border bg-card p-4"
						>
							<p className="text-xs text-muted-foreground">
								{message.sender === role
									? "You"
									: message.sender === "tutor"
										? "Tutor"
										: "Student"}{" "}
								· <LocalTime value={message.sentAt.toISOString()} />
							</p>
							<p className="mt-2 wrap-anywhere whitespace-pre-wrap">
								{message.body}
							</p>
							{message.sender !== role && (
								<ReportMessage id={id} messageKey={message.key} />
							)}
						</li>
					))}
				</ol>
			) : (
				<p>No messages yet.</p>
			)}
			{!before && thread.unread > 0 && (
				<form action={acknowledgeMessages.bind(null, id, thread.peerCount)}>
					<button
						className="cursor-pointer text-sm text-primary underline"
						type="submit"
					>
						Mark messages as read ({thread.unread})
					</button>
				</form>
			)}
			<ThreadControls
				id={id}
				canSend={thread.canSend && !before}
				latest={!before}
			/>
		</div>
	);
}
