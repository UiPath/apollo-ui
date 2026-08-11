import type { ActivityStage } from "./ActivityTrack";
import type { RequestDetail } from "./data";
import type { ReceiptRecord } from "./requests-context";

/** Which stages are a genuine agent/system action (placing the order) vs a
 * person's — the label beneath each node already names the person
 * directly, so the node itself doesn't need to know who; it only needs to
 * know whether to keep the agent's ✦ mark. Submitted/Received are always a
 * person's actions, Approved is the approver's call whenever one is named —
 * every other stage keeps the mark. Shared by both viewers, since the
 * underlying stage data is the same record either way. */
export function buildTrackStages(detail: RequestDetail): ActivityStage[] {
  return (detail.journeyStages ?? []).map((stage) => {
    if (stage.label === "Submitted" || stage.label === "Received") {
      return { ...stage };
    }
    if (stage.label === "Approved" && detail.approver != null) {
      return { ...stage };
    }
    return { ...stage, isAgent: true };
  });
}

/** A partial or damaged receipt means the request isn't fully closed even
 * though the goods physically arrived — say so right on the Received
 * stage's own date line. No-op when there's no receipt, or it's neither
 * partial nor damaged. */
export function applyReceiptFlags(
  stages: ActivityStage[],
  receipt: ReceiptRecord | undefined,
): ActivityStage[] {
  if (receipt == null) return stages;
  const isPartialOrDamaged =
    receipt.qtyReceived < receipt.qtyOrdered || receipt.damaged;
  if (!isPartialOrDamaged) return stages;
  const receivedIndex = stages.findIndex((s) => /received/i.test(s.label));
  if (receivedIndex === -1) return stages;
  const stage = stages[receivedIndex]!;
  const flags: string[] = [];
  if (receipt.qtyReceived < receipt.qtyOrdered) {
    flags.push(`${receipt.qtyReceived} of ${receipt.qtyOrdered} received`);
  }
  if (receipt.damaged) flags.push("issue opened");
  return stages.map((s, i) =>
    i === receivedIndex
      ? {
          ...stage,
          date:
            stage.date != null
              ? `${stage.date} · ${flags.join(" · ")}`
              : flags.join(" · "),
        }
      : s,
  );
}

/** Marks every stage up to and including `throughLabel` done, and the one
 * right after it active — the same vocabulary the seed data itself uses for
 * a stage in progress (see REQ-2051/REQ-2053's own "active" stages), not a
 * new state. */
export function advanceStagesThrough(
  stages: ActivityStage[],
  throughLabel: string,
): ActivityStage[] {
  const throughIndex = stages.findIndex((s) => s.label === throughLabel);
  if (throughIndex === -1) return stages;
  return stages.map((stage, i) => {
    if (i <= throughIndex) return { ...stage, state: "done" as const };
    if (i === throughIndex + 1) return { ...stage, state: "active" as const };
    return stage;
  });
}

// Verb form per stage state: past tense with the actual date once done,
// present tense with the expected date while active, base verb with no date
// while upcoming. "Submitted" needs none of this — it's always done, and
// already past tense — so it's absent here and passes through unchanged.
const STAGE_VERB_FORMS: Record<
  string,
  { done: string; active: string; upcoming: string }
> = {
  Approved: {
    // Fallback only — toDisplayStages names the viewer-relative party
    // directly whenever one is known, since the current stage should say
    // who it's waiting on, not just that it's waiting.
    done: "Approved",
    active: "Waiting for approval",
    upcoming: "Approve",
  },
  Ordered: { done: "Ordered", active: "Ordering", upcoming: "Order" },
  Received: { done: "Received", active: "Receiving", upcoming: "Receive" },
};

// Ordered and Received never carry a projected calendar date — there's no
// real basis for one. An upcoming stage can still state a duration fact
// (the supplier's own stocking lead time) or the requester's own deadline
// instead of a blank line — see toDisplayStages' `context` param.
const STAGES_WITH_NO_DATE = new Set(["Ordered", "Received"]);

export interface StageDisplayContext {
  approverFullName?: string;
  shippingEstimate?: string;
  needBy?: string;
}

/** Applies the verb-form rule above and layers in the two data-derived
 * sub-labels (current stage names who it waits on; Ordered/Received's
 * otherwise-blank date carries the supplier lead time / need-by date
 * instead), without touching the canonical labels the rest of this app
 * matches stages by (advanceStagesThrough, attribution, the receipt-flag
 * patch) — this only ever runs as the last step, right before handing
 * stages to ActivityTrack.
 *
 * `viewer` is the one thing that differs between the requester's and the
 * approver's screen: the same "Approved, active" stage reads as "Waiting on
 * {approver}" to the requester and as the approver's own stage to the
 * approver — one function, one label set, branching on who's looking rather
 * than authoring two copies. */
export function toDisplayStages(
  stages: ActivityStage[],
  context: StageDisplayContext,
  viewer: "requester" | "approver" = "requester",
): ActivityStage[] {
  return stages.map((stage) => {
    const forms = STAGE_VERB_FORMS[stage.label];
    const verbKey =
      stage.state === "done"
        ? "done"
        : stage.state === "upcoming"
          ? "upcoming"
          : "active";
    const isCurrent = verbKey === "active";
    const isCurrentApproval = stage.label === "Approved" && isCurrent;
    const label = isCurrentApproval
      ? viewer === "approver"
        ? // ESCALATE: wording for the approver's own current stage.
          "With you now"
        : context.approverFullName
          ? `Waiting on ${context.approverFullName}`
          : forms!.active
      : forms
        ? forms[verbKey]
        : stage.label;

    if (!STAGES_WITH_NO_DATE.has(stage.label)) {
      // The elapsed-days clause is dropped here — the tracker states when a
      // decision was expected, not how overdue it is; that count now lives
      // once, in the header status pill. State stays untouched, so the
      // warning color on this date text (ActivityTrack's own dateClass)
      // still applies — including on the approver's own screen, where it's
      // the same fact stated the same way: his decision is past its
      // expected date.
      return { ...stage, label, overdueDays: undefined };
    }
    if (
      stage.label === "Ordered" &&
      stage.state === "upcoming" &&
      context.shippingEstimate
    ) {
      return {
        ...stage,
        label,
        date: context.shippingEstimate,
        overdueDays: undefined,
      };
    }
    if (
      stage.label === "Received" &&
      stage.state === "upcoming" &&
      context.needBy
    ) {
      return {
        ...stage,
        label,
        date: `By ${context.needBy}`,
        overdueDays: undefined,
      };
    }
    return { ...stage, label, date: undefined, overdueDays: undefined };
  });
}

/** Approver-only: sub-labels render only where they're decision-relevant —
 * the current stage's own expectation date (kept as computed, warning
 * styling included when it's passed), and the final stage's need-by date
 * (also already what `toDisplayStages` computes there). Every other
 * stage's date is dropped. Call this after `toDisplayStages`, on its
 * output — the required rewriting rules haven't changed, this only decides
 * which of the results are decision-relevant enough to show.
 *
 * The requester's own tracker never runs through this — all four
 * sub-labels stay, since each answers when the goods arrive, not just
 * what's relevant to a decision. */
export function simplifyApproverDates(
  stages: ActivityStage[],
): ActivityStage[] {
  const lastIndex = stages.length - 1;
  return stages.map((stage, i) => {
    const isCurrent =
      stage.state === "active" || stage.state === "active-warning";
    const isFinal = i === lastIndex;
    if (isCurrent || isFinal) return stage;
    return { ...stage, date: undefined, overdueDays: undefined };
  });
}
