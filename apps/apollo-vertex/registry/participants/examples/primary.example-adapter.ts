/**
 * EXAMPLE ADAPTER (primary). Not shipped: it shows how a solution (hiring)
 * maps its own data into the participants view model. Adapters belong to
 * solutions.
 */
import type { ParticipantsViewModel } from "../participants.view-model";

interface InterviewPanel {
  requisitionId: string;
  panelists: {
    employeeId: string;
    fullName: string;
    stage: "recruiter_screen" | "technical" | "hiring_manager";
    feedbackSubmittedAt?: Date;
  }[];
}

const STAGE_ROLE: Record<InterviewPanel["panelists"][number]["stage"], string> =
  {
    recruiter_screen: "Recruiter screen",
    technical: "Technical interviewer",
    hiring_manager: "Hiring manager",
  };

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function panelToParticipants(
  panel: InterviewPanel,
): ParticipantsViewModel {
  return {
    subject: panel.requisitionId,
    participants: panel.panelists.map((panelist) => ({
      id: panelist.employeeId,
      name: panelist.fullName,
      role: STAGE_ROLE[panelist.stage],
      ...(panelist.feedbackSubmittedAt && {
        lastActive: `Feedback ${shortDate.format(panelist.feedbackSubmittedAt)}`,
      }),
    })),
  };
}

export const PRIMARY = panelToParticipants({
  requisitionId: "REQ-2231",
  panelists: [
    {
      employeeId: "e-104",
      fullName: "Priya Raman",
      stage: "recruiter_screen",
      feedbackSubmittedAt: new Date(2026, 8, 18),
    },
    {
      employeeId: "e-233",
      fullName: "Tomás Ortega",
      stage: "technical",
      feedbackSubmittedAt: new Date(2026, 8, 22),
    },
    { employeeId: "e-310", fullName: "Grace Liu", stage: "technical" },
    { employeeId: "e-057", fullName: "Daniel Okafor", stage: "hiring_manager" },
  ],
});
