/**
 * EXAMPLE ADAPTER. Not shipped in any registry item: it shows how a solution
 * maps its own data (a denied health insurance claim under appeal) into the neutral progress view model. The
 * occupants never import it.
 */
import {
  deriveStages,
  type ProgressEvent,
  type ProgressViewModel,
} from "../progress-view-model";

type ClaimStep =
  | "submitted"
  | "coverage-checked"
  | "denied"
  | "appeal-filed"
  | "appeal-flagged"
  | "appeal-review";

interface ClaimEntry {
  id: string;
  step: ClaimStep;
  summary: string;
  note: string;
  at: string;
  /** A person on the provider or payer side; agent steps have none. */
  by?: { name: string; initials: string };
}

interface Claim {
  claimId: string;
  appealReviewer: { name: string; initials: string };
  history: ClaimEntry[];
}

const STAGE_OF: Record<ClaimStep, string> = {
  submitted: "received",
  "coverage-checked": "adjudication",
  denied: "denial",
  "appeal-filed": "appeal",
  "appeal-flagged": "appeal",
  "appeal-review": "appeal",
};

const STATUS_OF: Record<ClaimStep, ProgressEvent["status"]> = {
  submitted: "done",
  "coverage-checked": "done",
  denied: "done",
  "appeal-filed": "done",
  "appeal-flagged": "needs-attention",
  "appeal-review": "in-progress",
};

export function claimToProgress(claim: Claim): ProgressViewModel {
  const events = claim.history.map(
    (entry): ProgressEvent => ({
      id: entry.id,
      actor: entry.by
        ? { kind: "person", ...entry.by }
        : { kind: "agent", name: "Claims agent" },
      status: STATUS_OF[entry.step],
      title: entry.summary,
      detail: entry.note,
      time: entry.at,
      stageId: STAGE_OF[entry.step],
    }),
  );
  const stages = [
    { id: "received", label: "Received" },
    { id: "adjudication", label: "Adjudication" },
    { id: "denial", label: "Denial" },
    { id: "appeal", label: "Appeal" },
    {
      id: "decision",
      label: "Decision",
      owner: { kind: "person" as const, ...claim.appealReviewer },
    },
  ];
  return {
    subject: claim.claimId,
    events,
    stages: deriveStages(stages, events),
  };
}

/** Sample data: a denied claim, appealed by the provider. */
export const SAMPLE_CLAIM: Claim = {
  claimId: "CLM-20931",
  appealReviewer: { name: "Sam Patel", initials: "SP" },
  history: [
    {
      id: "c1",
      step: "submitted",
      summary: "Claim received",
      note: "CLM-20931 from Riverside Clinic, for an outpatient MRI.",
      at: "Sep 3, 8:14",
    },
    {
      id: "c2",
      step: "coverage-checked",
      summary: "Agent checked coverage",
      note: "The plan requires prior authorization for imaging.",
      at: "Sep 3, 8:15",
    },
    {
      id: "c3",
      step: "denied",
      summary: "Claim denied",
      note: "No prior authorization on file (CO-197).",
      at: "Sep 3, 8:15",
    },
    {
      id: "c4",
      step: "appeal-filed",
      by: { name: "Dana Ortiz", initials: "DO" },
      summary: "Dana Ortiz filed an appeal",
      note: "Riverside Clinic sent the referral letter.",
      at: "Sep 10, 14:02",
    },
    {
      id: "c5",
      step: "appeal-flagged",
      summary: "Agent flagged the appeal",
      note: "The authorization is dated after the service date.",
      at: "Sep 10, 14:05",
    },
    {
      id: "c6",
      step: "appeal-review",
      by: { name: "Sam Patel", initials: "SP" },
      summary: "Sam Patel is reviewing",
      note: "Assigned from the appeals queue.",
      at: "Sep 11, 9:30",
    },
  ],
};

/** The sample, mapped. */
export const CLAIM_PROGRESS = claimToProgress(SAMPLE_CLAIM);
