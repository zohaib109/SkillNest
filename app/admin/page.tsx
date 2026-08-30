import { redirect } from "next/navigation";

/** The review queue moved into the dashboard shell. Kept for old bookmarks. */
export default function LegacyAdminPage() {
	redirect("/dashboard/admin/tutors");
}
