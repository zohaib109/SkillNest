export type Participant = { id: string; role: "student" | "tutor" };

export function participantScope(id: string, actor: Participant) {
	return {
		_id: id,
		...(actor.role === "student"
			? { studentId: actor.id }
			: { tutorId: actor.id }),
		confirmedAt: { $exists: true },
	};
}
