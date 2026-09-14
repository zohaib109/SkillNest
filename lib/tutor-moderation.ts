import type { TutorStatus } from "@/lib/types";

interface TutorModerationState {
	status: TutorStatus;
	isApproved: boolean;
	approvedAt?: Date | null;
	approvedBy: string;
	rejectionReason: string;
}

/** Reset moderated content to a private draft after any tutor-owned edit. */
export function resetTutorModeration(profile: TutorModerationState): boolean {
	if (profile.status === "draft") return false;

	profile.status = "draft";
	profile.isApproved = false;
	profile.approvedAt = null;
	profile.approvedBy = "";
	profile.rejectionReason = "";
	return true;
}
