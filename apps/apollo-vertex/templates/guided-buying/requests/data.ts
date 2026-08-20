// oxlint-disable max-lines -- seed data + scripted detail content for My
// Requests, the same size exemption workbench/data.ts already carries.

// The requester's own queue (Marcus Webb) — the mirror image of the buyer's
// Workbench, same list template. REQ-2051 and REQ-2053 are the same objects the
// Workbench holds, shown here from the requester's side; the rest are
// requester-only texture. All scripted/mocked.

import {
  BASE_TIER_REFERENCE_VALUE,
  DEVIATION_PCT_SIGNED,
  REQ_10482_EXCEPTIONS,
  UNIT_PRICE_UNIT,
  UNIT_PRICE_VALUE,
} from "../data/cockpit-10482";
import type { Exception } from "../data/exceptions";
import { getPerson } from "../data/people";
import {
  formatAnchoredDate,
  formatAnchoredTime,
  ph,
} from "../data/placeholders";
import {
  ANNUAL_VALUE,
  BUDGET_REMAINING_AFTER_APPROVAL,
  DOCUMENTS,
  type DocumentState,
  DOWNSTREAM_RECORDS,
  IDENTITY,
  QUANTITY,
  type RequestDocument,
  TERM_YEARS,
  TIMELINE,
  TOTAL_CONTRACT_VALUE,
  VENDOR_OPTIONS,
} from "../data/req-10482";
import type { PersonaId } from "../personas";

export type RequestStatus =
  | "ordered"
  | "delivered"
  | "approved"
  | "pending-approval"
  | "sourcing";

export interface RequestRow {
  id: string;
  /** Short generated title — chrome, shown in the list and every header. */
  request: string;
  /** Verbatim prompt, captured at submission (live Buy flow only) — shown in
   * full in the detail sidebar's "Your request" field. Never truncated. */
  prompt?: string;
  requester: string;
  /** Whose queue this row belongs to (requester parity): /requests and
   * Home's own mini-list both scope to the active persona, the same
   * pattern Approvals.tsx already uses for approverPersonaId. */
  requesterPersonaId: PersonaId;
  /** Vendor / supplier the request is with. */
  supplier: string;
  /** Cost center, "Dept : Sub-department". */
  department: string;
  /** Pre-formatted amount for the table cell, e.g. "$3,698.00". */
  amount: string;
  /** Annual-equivalent value (drives the Total Value metric). */
  amountValue: number;
  status: RequestStatus;
  /** "MMM D, YYYY", e.g. "May 28, 2026". */
  submitted: string;
  updated: string;
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  ordered: "Ordered",
  delivered: "Delivered",
  approved: "Approved",
  "pending-approval": "Pending Approval",
  sourcing: "Sourcing",
};

export const STATUS_BADGE: Record<
  RequestStatus,
  "success" | "warning" | "info"
> = {
  ordered: "success",
  delivered: "success",
  approved: "success",
  "pending-approval": "warning",
  sourcing: "info",
};

export const REQUEST_ROWS: RequestRow[] = [
  {
    id: "REQ-2042",
    request: "2 ThinkPad X1 laptops",
    requester: "Marcus Webb",
    requesterPersonaId: "requester",
    supplier: "Lenovo",
    department: "Design : Brand Studio",
    amount: "$3,698.00",
    amountValue: 3698,
    status: "ordered",
    submitted: "May 28, 2026",
    updated: "Jun 1, 2026",
  },
  {
    id: "REQ-2051",
    request: "12 mobile lines · Denver team",
    requester: "Marcus Webb",
    requesterPersonaId: "requester",
    supplier: "T-Mobile",
    department: "IT : Denver",
    amount: "$660.00/mo",
    amountValue: 7920,
    status: "pending-approval",
    submitted: "Jun 3, 2026",
    updated: "Jun 8, 2026",
  },
  {
    id: "REQ-2053",
    request: "Q3 rebrand · 2 contract designers",
    requester: "Marcus Webb",
    requesterPersonaId: "requester",
    supplier: "Multiple (RFQ)",
    department: "Design : Brand Ops",
    amount: "~$58,000.00",
    amountValue: 58000,
    status: "sourcing",
    submitted: "Jun 5, 2026",
    updated: "Jun 9, 2026",
  },
  {
    id: "REQ-2039",
    request: "Adobe CC team licenses",
    requester: "Marcus Webb",
    requesterPersonaId: "requester",
    supplier: "Adobe",
    department: "Design : Brand Studio",
    amount: "$4,800.00",
    amountValue: 4800,
    status: "approved",
    submitted: "May 20, 2026",
    updated: "May 22, 2026",
  },
  {
    id: "REQ-2031",
    request: "Standing desk converters ×4",
    requester: "Marcus Webb",
    requesterPersonaId: "requester",
    supplier: "Ergotron",
    department: "IT : Denver",
    amount: "$980.00",
    amountValue: 980,
    status: "delivered",
    submitted: "May 24, 2026",
    updated: "May 27, 2026",
  },
  {
    id: "REQ-2025",
    request: "Zoom Rooms renewal",
    requester: "Marcus Webb",
    requesterPersonaId: "requester",
    supplier: "Zoom",
    department: "IT : Denver",
    amount: "$2,400.00",
    amountValue: 2400,
    status: "pending-approval",
    submitted: "Jun 7, 2026",
    updated: "Jun 7, 2026",
  },
  // J1-09 / J1-11 — the catalog submission the Buy flow produces
  {
    id: "REQ-2052",
    request: "15 laptops for Fusion Event contractors",
    requester: "Marcus Webb",
    requesterPersonaId: "requester",
    supplier: "Lenovo",
    department: "Design : Brand Studio",
    amount: "$27,735.00",
    amountValue: 27735,
    status: "pending-approval",
    submitted: "Jul 21, 2026",
    updated: "Jul 23, 2026",
  },
];

export interface RequestStep {
  label: string;
  desc?: string;
  state: "done" | "current";
}

// Journey bar stages — horizontal tracker on the Request Window page.
// Named TrackerStage (not JourneyStep) since it holds a specific request's
// runtime state on a stage, not the journey model's own definition of which
// steps exist and why (see data/journeys.ts's JourneyStep, a different type
// that used to share this name).
export type TrackerStageState =
  | "done"
  | "active"
  | "active-warning"
  | "upcoming";
export interface TrackerStage {
  label: string;
  state: TrackerStageState;
  /** Second-line date on the Request Window's stage track: the actual date
   * once done, an expected/projected date otherwise. Omit rather than
   * derive a placeholder when there's nothing to base it on. */
  date?: string;
  /** Days since `date` passed without this stage completing (active-warning
   * only): renders as "· N day(s) ago" next to the date. */
  overdueDays?: number;
}

export interface RequestDetail {
  id: string;
  /** Short generated title — chrome, shown in the header and everywhere else. */
  request: string;
  /** Verbatim prompt for the detail sidebar's "Your request" field, when it
   * differs from the generated title. Falls back to `request` when unset —
   * these hand-seeded scenarios don't have a distinct recorded prompt. */
  prompt?: string;
  /** Subtitle in the detail header. */
  meta: string;
  /** Detail outcome line (e.g. "Routed to procurement", "Ordered"). */
  headline: string;
  /** First-person agent line under the headline. */
  agentLine: string;
  /** In-flight (still with procurement) → offer follow-up actions. */
  inFlight: boolean;
  timeline: RequestStep[];
  // ── Request Window (full-page route) ─────────────────────────────────────
  /** Stages for the horizontal JourneyBar. */
  journeyStages?: TrackerStage[];
  /** Context note below the journey label row (e.g. owner + ETA). No leading emoji — icon added by caller. */
  journeyOwnerNote?: string;
  /** Approver's usual decision turnaround, e.g. "a day" — the status card's
   * bolded turnaround figure while pending. */
  turnaround?: string;
  /** Pricing program called out in the status card's summary sentence, e.g.
   * "under EPP pricing". Scenario-specific — most requests have none. */
  pricingNote?: string;
  /** Summary strip fields. */
  summary?: {
    items: string;
    total: string;
    needBy?: string;
    /** Savings vs. list price, called out in the status card's lead sentence. */
    savings?: string;
    /** Days relative to `needBy`, signed: positive = days remaining,
     * negative = days overdue. Drives the header's proximity chip — only
     * set this when the date is close enough to warrant one. */
    needByDaysLeft?: number;
    /** Ordered quantity — drives the delivery-receipt modal's stepper
     * default and line-item row. Only set for scenarios that reach the
     * Received stage. */
    qty?: number;
  };
  /** Approver name for the "Full details" expand. */
  approver?: string;
  /** Cost center for the "Full details" expand. */
  costCenter?: string;
  /** Ship-to destination for the sidebar's record fields. */
  shipTo?: string;
  /** Header badge label override (e.g. "Pending · 2 days" instead of status). */
  statusLabel?: string;
  /** Pre-seeded first message shown in the thread bubble. Omit once the
   * same message is folded into `threads` (see RequestsProvider) instead —
   * REQ-2052 does this; requests without a decision-side counterpart still
   * use this field. */
  threadSeedMessage?: string;
  // PLACEHOLDER [Teams channel name] — same bracket as DecisionDetail's,
  // reused rather than duplicated. Only set where a Teams provenance demo
  // needs it.
  teamsChannel?: string;
  /** P2 nudge capsule — system event shown in the thread. No leading emoji — icon added by caller. */
  nudgeText?: string;
  /** Approver sent it back for changes — the header's other owed-action
   * state ("Respond"). No seed scenario sets this yet; implemented
   * generically so the branch exists once one does. */
  sentBack?: boolean;
  /** Sidebar "Linked records" chips (PR/PO references). The first chip
   * renders in the tinted "link" treatment, any others plain — same
   * visual split as the hand-authored chips this replaces. */
  recordChips?: string[];
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a Date as "MMM D, YYYY", e.g. "Jul 13, 2026". Moved above the
 * REQ-10482 block below (Chunk C1), which calls this at module load time:
 * as a `const`, MONTHS_SHORT has no hoisting past its own declaration the
 * way a `function` does, so calling this before that line had run threw
 * "Cannot access 'MONTHS_SHORT' before initialization" when this lived
 * below DECISION_DETAILS instead. */
export function formatDateDisplay(date: Date): string {
  const mmm = MONTHS_SHORT[date.getMonth()];
  return `${mmm} ${date.getDate()}, ${date.getFullYear()}`;
}

// ── REQ-10482 (Chunk C1): Dana Kim's own decision ───────────────────────────
// A software licence renewal, not a one-time hardware purchase like every
// other decision record here. shipTo/poNumber/expectedDelivery (Chunk C1
// cleanup) are now optional on the shared interface and simply absent here,
// rather than filled with a borrowed fact and rendered anyway — the
// remaining gap is itReview, still a device-enrollment check with no branch
// for a software validation scenario; its detail sentence is filled with
// the closest real facts rather than forking buildChecks, and its label is
// bracketed (PH-50) rather than left reading "Device management". See the
// report. Shared between REQUEST_DETAILS' and DECISION_DETAILS' own
// REQ-10482 entries below, computed once here rather than twice.

const dana = getPerson("dana-kim");
const samRivera = getPerson("sam-rivera");

const orderFormV2 = DOCUMENTS.find((d) => d.version === "v2");
if (!orderFormV2) {
  throw new Error("REQ-10482 decision record: no v2 order form in DOCUMENTS");
}

// Chunk C2 fix: DOWNSTREAM_RECORDS (req-10482.ts) was never read by this
// file until now, which is why the C1 cleanup assumed no PO existed for
// this record at all and suppressed its Linked records chip entirely — a
// real PO id was there the whole time, just created by PR conversion, not
// by Dana's approval, so it has no PO_DETAILS entry to open. See
// linkedPoId on the interface above and the report.
const linkedPoRecord = DOWNSTREAM_RECORDS.find((r) => r.type === "po");
if (!linkedPoRecord) {
  throw new Error(
    "REQ-10482 decision record: no po-type DOWNSTREAM_RECORDS entry",
  );
}

const validationEvent = TIMELINE.find(
  (e) => e.id === "procurement-validation-complete",
);
if (!validationEvent) {
  throw new Error(
    "REQ-10482 decision record: no procurement-validation-complete timeline event",
  );
}
const validationInstant = new Date(validationEvent.when);
// Chunk C2: both date and time now render through the shared
// formatAnchoredDate/formatAnchoredTime pair (data/placeholders.ts) — "one
// formatter, one zone" — rather than the date staying on local formatting
// the way the C1 cleanup deliberately left it. See the report on why that
// carve-out existed (APPROVALS_TODAY hadn't moved past D1 yet) and why
// moving the anchor is what let this close instead of staying a tradeoff.
const validationDate = formatAnchoredDate(validationInstant);
const validationTime = formatAnchoredTime(validationInstant);

const submittedEvent = TIMELINE.find((e) => e.id === "submitted");
if (!submittedEvent) {
  throw new Error("REQ-10482 decision record: no submitted timeline event");
}
const submittedInstant = new Date(submittedEvent.when);
// Chunk C2: date now derived too (see validationDate above); exported for
// RequestWindow/DecisionWindow's own "Date requested" and "Submitted"
// header fields (escalation carried from C1) and for RequestsProvider.tsx's
// seeded thread message (escalation 6), all reading the same instant
// through the same one formatter rather than each deriving it separately.
export const submittedDate = formatAnchoredDate(submittedInstant);
export const submittedTime = formatAnchoredTime(submittedInstant);

// Requester parity: Priya's own rows for /requests and Home's mini-list.
// Pushed here rather than declared inline with Marcus's own rows above,
// since every field below depends on constants (submittedDate,
// validationDate) that aren't computed until this point in the module.
//
// REQ-10482 is entirely real, derived from the same constants its own
// REQUEST_DETAILS/DECISION_DETAILS entries already use — no bracket:
// requester/supplier/department/amount all come from req-10482.ts and
// cockpit-10482.ts, and its status ("pending-approval") matches what
// Dana's decision page currently shows (no requestStatusOverrides entry
// for it this session, so it resolves to "pending" there too).
REQUEST_ROWS.push({
  id: "REQ-10482",
  request: IDENTITY.shortTitle,
  requester: getPerson(IDENTITY.requester).name,
  requesterPersonaId: "priya",
  supplier: VENDOR_OPTIONS[0].vendor,
  department: IDENTITY.costCentre.split(" · ")[0],
  amount: `$${ANNUAL_VALUE.toLocaleString("en-US")}`,
  amountValue: ANNUAL_VALUE,
  status: "pending-approval",
  submitted: submittedDate,
  updated: validationDate,
});

// Two further seeded rows, for list parity against Marcus's own count —
// REQ-10482 alone would read as a one-row list. Unlike REQ-10482, these
// two have no real underlying record: title, supplier, and amount are
// genuinely invented, so each is bracketed (PH-58/PH-59) rather than
// authored as if it were real. department is not bracketed: "IT : Denver"
// is Priya's own real department (data/people.ts's org field for her,
// in the same "Dept : Sub" shape Marcus's own rows already use), not
// invented. amountValue is 0 for both: there's no bracket convention in
// this codebase for a numeric field (every other bracketed value here is
// a string), and 0 keeps the KPI "Total Value" sum honestly under-counted
// rather than standing in a fabricated figure. Neither gets a
// REQUEST_DETAILS entry (that would mean inventing a full timeline for a
// fictional record) — MyRequestsList's own existing `openable` check
// already omits the chevron for a row with no detail entry, and Home's
// own mini-list is fed only the openable subset (see HomeRoute.tsx), so
// neither row ever renders as a dead affordance.
REQUEST_ROWS.push(
  {
    id: "REQ-10483",
    request: ph("PH-58", "Request title"),
    requester: "Priya Nair",
    requesterPersonaId: "priya",
    supplier: ph("PH-58", "Supplier"),
    department: "IT : Denver",
    amount: ph("PH-58", "Amount"),
    amountValue: 0,
    status: "sourcing",
    submitted: "Jun 12, 2026",
    updated: "Jun 16, 2026",
  },
  {
    id: "REQ-10484",
    request: ph("PH-59", "Request title"),
    requester: "Priya Nair",
    requesterPersonaId: "priya",
    supplier: ph("PH-59", "Supplier"),
    department: "IT : Denver",
    amount: ph("PH-59", "Amount"),
    amountValue: 0,
    status: "delivered",
    submitted: "May 30, 2026",
    updated: "Jun 3, 2026",
  },
);

// Same "X of Y remaining" grammar REQ-2052's own budget callout uses,
// scoped to this cost centre's software budget rather than a hardware one.
// BUDGET_REMAINING_AFTER_APPROVAL (req-10482.ts) is what's left once this
// commitment draws from the pool; the pool itself is that figure plus the
// commitment, not a second invented total.
const softwareBudgetPool = ANNUAL_VALUE + BUDGET_REMAINING_AFTER_APPROVAL;
const softwareBudgetPct = Math.round((ANNUAL_VALUE / softwareBudgetPool) * 100);

// This scenario's fixed "today" (Chunk C2: moved ahead of REQUEST_DETAILS,
// which now derives some of its own seeded figures from it rather than
// hardcoding them — see daysSince/daysUntil below and the report). Every
// seeded record's own submitted date must fall strictly before this, or
// a "days waiting"/"days pending" figure built from it reads zero or
// negative — REQ-10482's own submitted date (req-10482.ts's D1, Jul 24)
// is the latest of any seed record, so this sits one day after it. The
// Approvals queue's day-count math reads from this instead of the real
// wall clock, which would drift out of sync with every other seeded date
// in this scenario. Provisional (PH-01: the absolute calendar J3's own
// timeline lands on is itself unresolved) — moves again if that's ruled
// on differently.
export const APPROVALS_TODAY = "Jul 25, 2026";

/** Whole days from `date` (e.g. "Jul 21, 2026") to APPROVALS_TODAY —
 * positive means `date` is in the past, i.e. how long something has been
 * pending/overdue. */
export function daysSince(date: string): number {
  const ms = new Date(APPROVALS_TODAY).getTime() - new Date(date).getTime();
  return Math.round(ms / 86_400_000);
}

/** Whole days from APPROVALS_TODAY to `date` — positive means `date` is
 * still ahead, i.e. how long is left until a deadline. The forward-looking
 * complement to daysSince above, not a second derivation: same anchor,
 * opposite sign. */
export function daysUntil(date: string): number {
  return -daysSince(date);
}

// Deep details exist only for requests that came through the flow.
export const REQUEST_DETAILS: Record<string, RequestDetail> = {
  "REQ-2042": {
    id: "REQ-2042",
    request: "2 ThinkPad X1 laptops",
    meta: "Ordered · 2 ThinkPad X1 Carbon · EPP pricing",
    headline: "Ordered",
    agentLine:
      "Approved by Alex Chen, ordered. EPP pricing applied, no procurement review needed.",
    inFlight: false,
    timeline: [
      { label: "Submitted", state: "done" },
      { label: "Approved", desc: "Alex Chen · Design Director", state: "done" },
      { label: "Ordered", desc: "EPP pricing applied", state: "done" },
    ],
    journeyStages: [
      { label: "Submitted", state: "done", date: "May 28, 2026" },
      // Same-day approval — a small, pre-approved catalog buy.
      { label: "Approved", state: "done", date: "May 29, 2026" },
      { label: "Ordered", state: "done", date: "Jun 1, 2026" },
    ],
    summary: { items: "2 × X1 Carbon", total: "$3,698" },
    // Matches the "Approved" timeline step's own `desc` above.
    approver: "Alex Chen · Design Director",
  },
  "REQ-2031": {
    id: "REQ-2031",
    request: "Standing desk converters ×4",
    meta: "Delivered · 4 Ergotron converters",
    headline: "Delivered",
    agentLine:
      "Approved and ordered from Ergotron. All 4 converters arrived and delivery is confirmed.",
    inFlight: false,
    timeline: [
      { label: "Submitted", state: "done" },
      { label: "Approved", state: "done" },
      { label: "Delivered", desc: "4 units received", state: "done" },
    ],
    journeyStages: [
      { label: "Submitted", state: "done", date: "May 24, 2026" },
      // Same-day approval — a small, low-value purchase.
      { label: "Approved", state: "done", date: "May 24, 2026" },
      { label: "Ordered", state: "done", date: "May 25, 2026" },
      { label: "Received", state: "done", date: "May 27, 2026" },
    ],
    summary: { items: "4 × Ergotron converter", total: "$980", qty: 4 },
    // "delivered to the Denver office" per the request's own department
    // (IT : Denver) — no separate street address was ever seeded for this
    // scenario, so this stays a location name rather than a fabricated one.
    shipTo: "Denver office",
    // No PO line-item data seeded for this scenario — PR only, no PO chip.
    recordChips: ["PR-2031"],
  },
  "REQ-2051": {
    id: "REQ-2051",
    request: "12 mobile lines · Denver team",
    meta: "With procurement · $660/mo · $7,920/yr",
    headline: "Routed to procurement",
    agentLine:
      "I configured the 12 lines under your T-Mobile MSA and sent it to procurement for approval. You'll get an update here once it's decided.",
    inFlight: true,
    timeline: [
      { label: "Submitted", state: "done" },
      {
        label: "Configured under the T-Mobile MSA",
        desc: "12 Business Pro lines · bring your own device",
        state: "done",
      },
      { label: "With procurement, awaiting approval", state: "current" },
    ],
    journeyStages: [
      { label: "Submitted", state: "done" },
      { label: "MSA configured", state: "done" },
      { label: "Pending approval", state: "active" },
    ],
    journeyOwnerNote: "With procurement · awaiting T-Mobile approval",
    summary: { items: "12 mobile lines", total: "$660/mo" },
    approver: "Procurement Team",
  },
  "REQ-2053": {
    id: "REQ-2053",
    request: "Q3 rebrand · 2 contract designers",
    meta: "With procurement · ~$58,000 · ~Q3 (3 months)",
    headline: "Routed to procurement",
    agentLine:
      "I drafted the RFQ, shortlisted vendors, and sent it to procurement to source. You'll get an update here once it's sourced.",
    inFlight: true,
    timeline: [
      { label: "Submitted", state: "done" },
      {
        label: "RFQ drafted",
        desc: "Scope, duration, deliverables",
        state: "done",
      },
      { label: "3 vendors shortlisted", state: "done" },
      { label: "With procurement, awaiting decision", state: "current" },
    ],
    journeyStages: [
      { label: "Submitted", state: "done" },
      { label: "RFQ drafted", state: "done" },
      { label: "Vendors shortlisted", state: "done" },
      { label: "Sourcing decision", state: "active" },
    ],
    journeyOwnerNote: "With procurement · decision expected this week",
    summary: { items: "2 contract designers", total: "~$58,000" },
  },
  // J1-11 / J1-12 — catalog purchase, day 2 pending approval
  "REQ-2052": {
    id: "REQ-2052",
    request: "15 laptops for Fusion Event contractors",
    meta: "Pending approval · 15 × X1 Carbon · EPP pricing",
    headline: "Pending approval",
    agentLine:
      "I configured 15 X1 Carbons under EPP pricing and sent it to Alex Chen for approval. You'll get an update here once it's decided.",
    inFlight: true,
    timeline: [
      { label: "Submitted", state: "done" },
      { label: "With Alex Chen, awaiting approval", state: "current" },
    ],
    journeyStages: [
      { label: "Submitted", state: "done", date: "Jul 21, 2026" },
      // 21 Jul submitted + Alex's "a day" turnaround — already past, hence
      // active-warning (the date text goes amber; the node does not).
      // Derived from APPROVALS_TODAY (Chunk C2), not hardcoded: this used
      // to read "1 day ago" as a literal, matching "today" of the time,
      // and silently went stale the one time that moved.
      {
        label: "Approved",
        state: "active-warning",
        date: "Jul 22, 2026",
        overdueDays: daysSince("Jul 22, 2026"),
      },
      // No date on Ordered or Received — there's no real basis to project
      // when either will happen, and a chained-off-the-previous-stage guess
      // is exactly the kind of unfounded projection this scenario dropped.
      { label: "Ordered", state: "upcoming" },
      { label: "Received", state: "upcoming" },
    ],
    journeyOwnerNote:
      "Waiting on Alex Chen · Design Director. Usually decides within a day.",
    turnaround: "a day",
    pricingNote: "under EPP pricing",
    summary: {
      items: "15 × X1 Carbon",
      total: "$27,735",
      // Contractors start Aug 3 (see threadSeedMessage) — Aug 1 has the
      // laptops in hand before then, not the 28 Aug date that used to leave
      // 25 days of dead time after the start date.
      needBy: "Aug 1, 2026",
      // $2,138 list vs. $1,849 EPP unit price (see PO_DETAILS), × 15.
      savings: "$4,335",
      // Derived from APPROVALS_TODAY (Chunk C2), not hardcoded — still
      // comfortably past the 3-day threshold either way, so no header
      // chip renders, but the stored figure no longer goes stale if the
      // anchor moves again.
      needByDaysLeft: daysUntil("Aug 1, 2026"),
    },
    approver: "Alex Chen · Design Director",
    costCenter: "Design Operations · CC-4421",
    // Same canonical value the Bridge's envelope infers for this scenario.
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    statusLabel: `Pending · ${daysSince("Jul 21, 2026")} days`,
    // No threadSeedMessage here — that same message is now a real entry in
    // threads["REQ-2052"] (see RequestsProvider), read by both this page
    // and the approver's Decision Window instead of being authored twice.
    teamsChannel: "[Teams channel name]",
    // Derived (Chunk C2): the day count used to be hardcoded here and on
    // statusLabel above, independently, both matching the same submitted
    // date only by construction. One derivation, read twice, can't drift
    // the two apart the way two separate literals already had once.
    nudgeText: `Pending ${daysSince("Jul 21, 2026")} days. A reminder went to Alex this morning. You won't need to chase.`,
    recordChips: ["PR-2052", "PO · created on approval"],
  },
  // Chunk C1: journeyStages reuses the canonical "Approved" label for the
  // current, with-Dana stage rather than inventing a new one, so
  // stage-display.ts's own existing "Waiting on {name}" / "With you now"
  // derivation applies to it unchanged (see DecisionWindow's own context
  // param). "Procurement validation" has no equivalent case in
  // buildTrackStages, so it falls through to that function's own default
  // (isAgent: true), correctly, since it's a system action, not a person's.
  "REQ-10482": {
    id: "REQ-10482",
    request: IDENTITY.shortTitle,
    meta: `Pending approval · ${QUANTITY.toLocaleString("en-US")} licenses · ${TERM_YEARS}-year term`,
    headline: "Pending approval",
    agentLine: `Procurement completed validation and sent it to ${dana.name} for approval. You'll get an update here once it's decided.`,
    inFlight: true,
    timeline: [
      { label: "Submitted", state: "done" },
      { label: "Procurement validation completed", state: "done" },
      { label: `With ${dana.name}, awaiting approval`, state: "current" },
    ],
    journeyStages: [
      { label: "Submitted", state: "done", date: submittedDate },
      {
        label: "Procurement validation",
        state: "done",
        date: `${validationDate} · ${validationTime}`,
      },
      { label: "Approved", state: "active" },
      // Chunk C2: a minimal downstream stub so Dana's decision doesn't
      // read as the end of the track — REQ-2052's own tracker ends on
      // future stages too (Ordered, Received), so stopping here would
      // break that shared grammar for this record alone. Deliberately
      // generic and bracketed (PH-52): the real downstream sequence
      // includes a parallel legal and security review (J3-21), which is
      // P2 and belongs to a later chunk — this label must not name or
      // imply it, and doesn't. No date: there's no real basis yet for
      // one, the same reason Ordered/Received carry none for REQ-2052
      // until context supplies one. advanceStagesThrough's own generic
      // logic (unchanged) promotes this to "active" once Dana approves,
      // the same way it already does for any record's next stage.
      { label: ph("PH-52", "Next step"), state: "upcoming" },
    ],
    summary: {
      items: `${QUANTITY.toLocaleString("en-US")} × license`,
      total: `$${ANNUAL_VALUE.toLocaleString("en-US")}/yr`,
      needBy: IDENTITY.neededFrom,
    },
    approver: `${dana.name} · ${dana.role}`,
    costCenter: IDENTITY.costCentre,
    // No shipTo (Chunk C1 cleanup): already optional here (see the
    // interface above), a software licence has nowhere to ship, so this
    // simply doesn't render rather than borrowing the buying entity as a
    // stand-in address the way this used to on both sides of this record.
    teamsChannel: "[Teams channel name]",
  },
};

// The date Alex actually approved REQ-2052 — a real record, not the pending
// stage bar's own expected date (Jul 22), which is a projection of when a
// decision was due, not what happened. RequestWindow's stage bar and
// DecisionWindow's own header/body both read this one value once approved,
// rather than each keeping its own copy.
// REQ-2052's own approval date, once it happens live in this session, is
// "today" in this scenario's narrative clock — the same value as
// APPROVALS_TODAY, not a second literal that can drift out of sync with
// it (Chunk C2: this used to be independently authored). RequestWindow's
// stage bar and DecisionWindow's own header/body both read this one value
// once approved, rather than each keeping its own copy. The name is
// REQ-2052's own, but the same generic post-approval code path in
// DecisionWindow.tsx already applies it to any record, REQ-10482
// included — a pre-existing shape this fix doesn't change, see the report.
export const REQ_2052_APPROVED_DATE = APPROVALS_TODAY;

export function getRequestDetail(id: string): RequestDetail | undefined {
  return REQUEST_DETAILS[id];
}

export function getRequestRow(id: string): RequestRow | undefined {
  return REQUEST_ROWS.find((r) => r.id === id);
}

// ── Decision Window ───────────────────────────────────────────────────────────

export interface DecisionLineItem {
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

/** Keys for the request rail's fields — shared with the AI summary's marks
 * so a mark can reference the exact field it's about. */
export type RailFieldKey =
  | "items"
  | "total"
  | "supplier"
  | "shipTo"
  | "chargedTo"
  | "budget"
  | "linkedRecords"
  // Chunk C1: a recurring line's own related group (annual commitment,
  // total contract value, term), and the order form attachment, neither
  // of which REQ-2052's one-time purchase has a field for.
  | "commitment"
  | "attachment";

/** One run of the AI summary sentence. Plain text when `targetField` is
 * absent; when present, the run becomes an interactive reference to that
 * request rail field (hover/click highlights it). */
export interface SummaryMark {
  text: string;
  targetField?: RailFieldKey;
}

/** The three decision outcomes, in the order the AI's own recommendation
 * ranks them. `null`/absent means no recommendation — the action group
 * falls back to a fixed default order. */
export type RecommendationValue = "approve" | "send-back" | "reject";

/** Every status a decision can carry, pending included. Shared by the
 * Approvals queue and the decision page so the label/badge pairing for
 * each status is defined once. */
export type DecisionStatus = "pending" | "approved" | "denied" | "sent-back";

// PLACEHOLDER [Status label] — "Needs info" is the working title used
// throughout this spec, not a confirmed label. Gabriel Chitic owns the
// final copy; keeping it unbracketed in the rendered badge (fallback value
// below) but tagged here so it still surfaces in a grep for open questions.
export const DECISION_STATUS_META: Record<
  DecisionStatus,
  { label: string; status: "warning" | "success" | "error" | "info" }
> = {
  pending: { label: "Pending", status: "warning" },
  approved: { label: "Approved", status: "success" },
  denied: { label: "Denied", status: "error" },
  "sent-back": { label: "Needs info", status: "info" },
};

// Sentence-cased display for RequestDocument's own state values (Chunk C1),
// the same kind of enum-to-label mapping DECISION_STATUS_META does above.
// Shared by RequestRecordRail (the rail's own attachment field) and
// DecisionWindow (the Preview overlay naming the same document state).
export const ATTACHMENT_STATE_LABEL: Record<DocumentState, string> = {
  current: "Current",
  superseded: "Superseded",
};

/** A single check's outcome — `pass` or `exception`, never a third state. */
export type CheckStatus = "pass" | "exception";

export interface DecisionPacket {
  budget: {
    label: string;
    /** "XX%" — also used as the inline progress bar width. */
    pct: string;
    detail: string;
  };
  /** Feeds the device management check's detail line — structured so
   * "today" can be computed from `checkedAt` rather than stored as a word.
   * Optional (Chunk C2): only read by buildChecks' own default 4-check
   * hardware set, below. A record that supplies its own `checks` array
   * (DecisionDetail.checks) never reads this, so it has no reason to carry
   * a hardware-shaped it-review fact at all. Retires the C1 cleanup's
   * narrower `checkLabel` override on this field — see the report. */
  itReview?: {
    status: CheckStatus;
    qty: number;
    imageName: string;
    source: string;
    /** Parseable date+time, e.g. "Jul 23, 2026 09:14". */
    checkedAt: string;
  };
}

/** One row in the decision card's checks list. `label` isn't stored here —
 * it's a fixed authored constant per `key` (see CHECK_LABEL), since it
 * never varies by request; `detail` is always derived. */
export interface DecisionCheck {
  key: string;
  status: CheckStatus;
  detail: string;
}

export const CHECK_LABEL: Record<DecisionCheck["key"], string> = {
  deviceManagement: "Device management",
  supplier: "Supplier",
  costCenter: "Cost center",
  approvalRouting: "Approval routing",
  // REQ-10482's own check set (Chunk C2): procurement validation facts, a
  // different composition and length than the four above, not a fork of
  // this map — new entries in the same one. Content ruling, bracketed
  // short labels, the way PH-50 already worked before it was retired.
  priceBenchmark: ph("PH-53", "Price benchmark"),
  contractTerms: ph("PH-54", "Contract terms"),
  exceptionsCleared: ph("PH-55", "Exceptions cleared"),
};

export interface DecisionDetail {
  id: string;
  request: string;
  requester: string;
  /** "Name · Title" — folded into the header band, not a separate identity line. */
  approver: string;
  supplier: string;
  /** "Department · Cost centre code". */
  costCenter: string;
  /** "Location · Street, postcode city". Absent for a request with no
   * physical fulfilment (Chunk C1 cleanup) — a software licence has
   * nowhere to ship, so the rail's own "Ship to" field doesn't render
   * rather than showing an invented or borrowed address. */
  shipTo?: string;
  needBy: string;
  /** "MMM D, YYYY" — drives the queue's pending-days and longest-waiting math. */
  submitted: string;
  lineItems: DecisionLineItem[];
  total: string;
  /** Numeric total, parallel to RequestRow's amountValue — drives the
   * queue's "Awaiting your decision" sum without parsing the display string. */
  totalValue: number;
  packet: DecisionPacket;
  /** The record's own check set (Chunk C2): length, order, and keys all
   * come from here when present — `buildChecks` returns this directly
   * rather than building the default 4. Absent, every record renders
   * through that original hardware-shaped builder unchanged (REQ-2052
   * through REQ-2056). `DecisionChecks` needed no change to accept
   * whatever length this array happens to be; it never assumed four. */
  checks?: DecisionCheck[];
  /** The PO this approval triggers — matches PO_DETAILS below, which has
   * full drill-down content for it. Only surfaced once approved;
   * pre-decision the sidebar's PO chip stays a plain "created on approval"
   * placeholder instead. Absent for a request whose PO (if any) isn't
   * approval-triggered and has no PO_DETAILS entry to open — see
   * `linkedPoId` below for that case, which the C1 cleanup conflated with
   * this field before finding req-10482.ts's own DOWNSTREAM_RECORDS (Chunk
   * C2 fix, see the report). */
  poNumber?: string;
  /** A linked PO this record already has, independent of this decision
   * (Chunk C2): REQ-10482's own PO-90214 exists via PR conversion, not
   * Dana's approval, and has no PO_DETAILS entry to open — decoupled from
   * `poNumber` above so the rail's chip can state the real id without
   * either promising an approval-triggered creation that already happened
   * a different way, or opening a "not found" drill-down. Absent wherever
   * `poNumber` is set; the two are never both present on the same record. */
  linkedPoId?: string;
  /** Projected delivery once the PO ships. The requester's own journey
   * stages carry no equivalent date (see REQUEST_DETAILS above) since there
   * is no real basis to project one, this field has the same gap. Absent
   * (Chunk C1 cleanup) alongside `poNumber` for the same no-fulfilment
   * requests — nothing ships, so there's nothing to project a date for. */
  expectedDelivery?: string;
  /** The AI's recommended outcome, when it has one. Absent/null for every
   * seed record today — the action group's default order applies. */
  recommendation?: RecommendationValue | null;
  /** Feeds the supplier check. Not every request has an established
   * program — REQ-2052's "EPP" is real (matches its requester-side
   * pricingNote); absent elsewhere rather than guessed. */
  pricingProgram?: string;
  // PLACEHOLDER [Contract end date] — invented, no real contract data
  // exists for any seed record. Always this bracket text.
  contractEnd: string;
  /** Feeds the cost center check's pass sentence. Real for REQ-2052 (see
   * your own worked example); absent elsewhere rather than guessed. */
  spendCategory?: string;
  /** Present only when the cost center check should report `exception`
   * instead of deriving its usual pass sentence — the one branch in
   * `buildChecks`, driven by data rather than a request id. */
  costCenterException?: { code: string; detail: string };
  // PLACEHOLDER [Teams channel name] — invented, drives the destination
  // line and the open-in-Teams affordance. Always this bracket text.
  teamsChannel: string;
  /** Which approver seat this decision belongs to (Chunk C1): the
   * Approvals list filters on this, not on `approver`'s own display
   * string, so a persona's list can't drift out of sync with a
   * free-text name match. Required, not optional: every decision record
   * has exactly one approver seat, REQ-2052 through REQ-2056 all
   * "approver" (Alex), REQ-10482 "budget-owner" (Dana). */
  approverPersonaId: PersonaId;
  /** A recurring line's own related figures (Chunk C1): REQ-2052's
   * one-time purchase has no term or ongoing commitment, so this is
   * absent there and the rail's existing Total field renders alone.
   * Present, it renders as an added group beneath Total rather than a
   * bespoke rail block, the same "related figures under the value they
   * modify" grammar the existing budget callout already uses. */
  recurringCommitment?: {
    /** e.g. "$198,000/yr". */
    annual: string;
    /** e.g. "$594,000" — the term's own full value, not restated from
     * annual × term at render time, so it can't drift from the seed's own
     * derivation of it. */
    total: string;
    /** e.g. "3 year" — singular always, the rail appends " term" after it
     * (Chunk C1 cleanup: "3 year term" is the correct compound-modifier
     * grammar, the same reason "a 5-year plan" isn't "a 5-years plan";
     * this isn't conditional on the number the way "1 unit"/"15 units"
     * is, since the noun it modifies here is always singular before it). */
    term: string;
  };
  /** The order form on file (Chunk C1), reusing req-10482.ts's own
   * RequestDocument shape rather than a parallel one — REQ-2052 has no
   * document in its rail, so this is absent there. */
  attachment?: RequestDocument;
  // PLACEHOLDER — escalation 7, registered as PH-48 rather than a plain
  // bracket like contractEnd/teamsChannel above, since rule 6 names this
  // one specifically. Extra context beyond RequestDocument's own `state`
  // (e.g. "corrected and validated"), wording unresolved. Only set
  // alongside `attachment`.
  attachmentStateNote?: string;
  /** The governing agreement this decision is under (Chunk C1), e.g.
   * "MSA-VC-01". Absent where there's no standing agreement to cite. */
  contractReference?: string;
  /** Overrides the AI summary's own conclusion sentence (Chunk C1): the
   * hardcoded two-branch sentence below this interface is REQ-2052
   * shaped (device management, a delivery date) and doesn't generalize
   * to every request type, e.g. a software renewal has no device
   * management check and nothing to deliver. Absent, DecisionWindow
   * falls back to that existing sentence exactly as before; present, its
   * own pending/approved text renders instead. Plain strings, not marks,
   * since only REQ-2052's own fields (budget, delivery) had marks wired
   * to them; nothing here requires the same interactivity yet. */
  summaryConclusion?: { pending: string; approved: string };
  /** Exceptions procurement already found and resolved before this reached
   * the approver (Chunk C1), reusing exceptions.ts's own Exception model
   * (Chunk B) rather than re-authoring the content. Absent for every
   * record with no such history; drives the P2-only exceptions-resolved
   * module, not rendered anywhere in P1. */
  exceptions?: Exception[];
  // PLACEHOLDER [Exceptions module heading] — escalation 4, wording
  // unresolved. Only set alongside `exceptions`.
  exceptionsHeading?: string;
  // PLACEHOLDER [Evidence drill-through link label] — escalation 5,
  // wording unresolved, and there's no evidence view on this surface for
  // it to link to yet (see the report). Only set alongside `exceptions`.
  evidenceLinkLabel?: string;
}

/** Names to notify on a decision, derived from the request's own requester
 * and approver fields rather than authored — "Alex Chen · Design Director"
 * becomes "Alex Chen", matching how the header already shortens it. */
export function notificationRecipients(detail: DecisionDetail): string[] {
  const approverName = detail.approver.split(" · ")[0] ?? detail.approver;
  return [detail.requester, approverName];
}

/** "today {HH:MM}" when `checkedAt` falls on the narrative clock's current
 * date, a dated fallback otherwise — "today" is computed, never stored. */
export function formatCheckTimestamp(checkedAt: string): string {
  const date = new Date(checkedAt);
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const isToday =
    date.toDateString() === new Date(APPROVALS_TODAY).toDateString();
  return isToday ? `today ${time}` : `${formatDateDisplay(date)} ${time}`;
}

/**
 * A record's own check set (Chunk C2), when it has one: `detail.checks`
 * returns directly, unbuilt, so its length, order, and keys are entirely
 * the record's own (see the interface and the report). REQ-2052..2056 have
 * none, so they fall through to the four checks below, always in this
 * order, derived from the decision's own data exactly as before — device
 * management, supplier, and approval routing always derive normally; cost
 * center is the one that can report `exception`, and only when
 * `costCenterException` is set, the same function handling both the
 * all-pass case and the exception case, no per-request branch.
 */
export function buildChecks(detail: DecisionDetail): DecisionCheck[] {
  if (detail.checks) return detail.checks;

  const [department, code] = detail.costCenter.split(" · ");
  const { itReview } = detail.packet;
  if (!itReview) {
    throw new Error(
      `${detail.id}: buildChecks needs either detail.checks or packet.itReview`,
    );
  }

  const deviceManagement: DecisionCheck = {
    key: "deviceManagement",
    status: itReview.status,
    detail: `Enrollment pre-queued for ${itReview.qty} units. ${itReview.imageName}. ${itReview.source}, ${formatCheckTimestamp(itReview.checkedAt)}`,
  };

  const supplier: DecisionCheck = {
    key: "supplier",
    status: "pass",
    detail: `${detail.supplier} ${detail.pricingProgram ?? "[Pricing program]"} pricing applied. Contract current through ${detail.contractEnd}`,
  };

  const costCenter: DecisionCheck = detail.costCenterException
    ? {
        key: "costCenter",
        status: "exception",
        detail: detail.costCenterException.detail,
      }
    : {
        key: "costCenter",
        status: "pass",
        detail: `${code} covers ${detail.spendCategory ?? "[Spend category]"} for ${department}`,
      };

  const approvalRouting: DecisionCheck = {
    key: "approvalRouting",
    status: "pass",
    detail: `${department} sits within your authority. No further approval needed`,
  };

  return [deviceManagement, supplier, costCenter, approvalRouting];
}

const REQ_10482_DECISION_DETAIL: DecisionDetail = {
  id: "REQ-10482",
  request: IDENTITY.shortTitle,
  requester: getPerson(IDENTITY.requester).name,
  approver: `${dana.name} · ${dana.role}`,
  approverPersonaId: "budget-owner",
  supplier: VENDOR_OPTIONS[0].vendor,
  costCenter: IDENTITY.costCentre,
  // No shipTo (Chunk C1 cleanup): a software licence has no physical
  // ship-to destination. shipTo is optional on the shared interface now
  // (see there), so the rail's own "Ship to" field simply doesn't render
  // for this record, rather than borrowing the buying entity as a
  // stand-in address the way this used to.
  needBy: IDENTITY.neededFrom,
  submitted: submittedDate,
  lineItems: [
    {
      description: `${VENDOR_OPTIONS[0].vendor} license`,
      quantity: QUANTITY,
      unitPrice: `${UNIT_PRICE_VALUE}${UNIT_PRICE_UNIT}`,
      amount: `$${ANNUAL_VALUE.toLocaleString("en-US")}`,
    },
  ],
  total: `$${ANNUAL_VALUE.toLocaleString("en-US")}`,
  totalValue: ANNUAL_VALUE,
  packet: {
    budget: {
      label: `Software budget · ${IDENTITY.costCentre.split(" · ")[0]}`,
      pct: `${softwareBudgetPct}%`,
      // Bracketed (Chunk C1 cleanup, escalation): this "$X of $Y remaining"
      // grammar is copied from REQ-2052's own budget callout, which reads
      // as X being what remains rather than what this request draws down
      // — true there too, but REQ-2052's own committed total ($27,735) is
      // small next to its pool, where here the misread number ($198,000)
      // is the one the reader is likeliest to act on. Not corrected here:
      // it's the same literal grammar REQ-2052 uses, not a shared
      // function, so silently rewriting it here without also rewriting
      // REQ-2052's own line would leave the two inconsistent for no
      // documented reason; ruling it once, for both, isn't this fix's
      // call to make. See the report (PH-49).
      detail: ph(
        "PH-49",
        `${ANNUAL_VALUE.toLocaleString("en-US")} committed, ${BUDGET_REMAINING_AFTER_APPROVAL.toLocaleString("en-US")} remaining`,
      ),
    },
    // No itReview (Chunk C2): buildChecks' default 4-check hardware set
    // (device enrollment, supplier, cost center, approval routing) doesn't
    // fit a software procurement-validation scenario at all — escalation 8
    // asked for a check label override on that set, but the actual fix is
    // this record's own check set below, not a hardware fact it has no
    // real value for. See the report.
  },
  // REQ-10482's own check set (Chunk C2), a different composition and
  // length than the 4-check hardware default: a price benchmark, contract
  // terms against the MSA, and the exceptions procurement already raised
  // and cleared — the actual facts procurement validated for a software
  // licence renewal, not a device-enrollment stand-in. Every detail
  // sentence reads from data already established elsewhere (Chunk B's own
  // cockpit-10482.ts, IDENTITY, REQ_10482_EXCEPTIONS); only the chip
  // labels are bracketed (PH-53/54/55), the same content-ruling shape
  // PH-50 used before this replaced it.
  checks: [
    {
      key: "priceBenchmark",
      status: "pass",
      detail: `${VENDOR_OPTIONS[0].vendor} priced ${DEVIATION_PCT_SIGNED} above the ${BASE_TIER_REFERENCE_VALUE}${UNIT_PRICE_UNIT} base tier reference, accepted by ${samRivera.name}`,
    },
    {
      key: "contractTerms",
      status: "pass",
      detail: `Payment terms corrected to match ${IDENTITY.agreement}, revalidated on the supplier's updated order form`,
    },
    {
      key: "exceptionsCleared",
      status: "pass",
      detail: `${REQ_10482_EXCEPTIONS.length} exceptions raised and cleared before this reached you`,
    },
  ],
  // No poNumber (Chunk C2 fix): its own real PO exists already, via PR
  // conversion, not this approval, so it renders through linkedPoId
  // instead (see the interface and the report), not the approval-gated
  // poNumber chip REQ-2052's own hardware PO uses.
  linkedPoId: linkedPoRecord.id,
  // No expectedDelivery: a software licence renewal has nothing shipped,
  // so there's no delivery date to quote. Optional on the shared
  // interface (Chunk C1 cleanup); simply absent here.
  recommendation: "approve",
  contractEnd: "[Contract end date]",
  teamsChannel: "[Teams channel name]",
  recurringCommitment: {
    annual: `$${ANNUAL_VALUE.toLocaleString("en-US")}/yr`,
    total: `$${TOTAL_CONTRACT_VALUE.toLocaleString("en-US")}`,
    // Singular "year", always — see the interface's own doc comment on
    // why this isn't conditional on TERM_YEARS the way a plain count is.
    term: `${TERM_YEARS} year`,
  },
  attachment: orderFormV2,
  attachmentStateNote: ph("PH-48", "Status note"),
  contractReference: IDENTITY.agreement,
  summaryConclusion: {
    // Bracketed (Chunk C1 cleanup, escalation): the wording itself is a
    // content ruling — "cleared" and "closed by" describe the same act
    // twice, the count reads as a bare numeral with no established
    // spelled-out convention checked against, and the sentence is purely
    // retrospective where Dana's equivalent should orient her toward the
    // decision in front of her, not just recap the past. Not rewritten
    // here; the derived facts it would need (actor, count, time) are kept
    // reading from data inside the bracket rather than dropped. See the
    // report (PH-51).
    pending: ph(
      "PH-51",
      `${samRivera.name} · ${REQ_10482_EXCEPTIONS.length} exceptions cleared · ${validationTime}`,
    ),
    approved: `Approved. This now moves to the next step in the journey.`,
  },
  exceptions: REQ_10482_EXCEPTIONS,
  exceptionsHeading: ph("PH-46", "Exceptions resolved"),
  // Short label, not the bare id: this renders inside a `shrink-0` link
  // button (see ExceptionsResolvedModule), so the full ruling description
  // ph() renders with no label would overflow the card. Per ph()'s own
  // doc comment, an affordance-shaped placeholder should pass a label.
  evidenceLinkLabel: ph("PH-47", "View evidence"),
};

// Every REQ-2052..REQ-2056 entry bills to Design Operations · CC-4421 and
// exceeds $5,000 — COST_TO_APPROVER routes that cost center to Alex Chen,
// and the Approver provenance popover states the $5,000 policy threshold. A
// row here that violated either would contradict a rule the app itself
// displays. REQ-10482 bills to a different cost centre entirely, since it's
// Dana's own seat, not Alex's — see approverPersonaId on each entry below.
export const DECISION_DETAILS: Record<string, DecisionDetail> = {
  "REQ-2052": {
    id: "REQ-2052",
    request: "15 laptops for Fusion Event contractors",
    requester: "Marcus Webb",
    approver: "Alex Chen · Design Director",
    approverPersonaId: "approver",
    supplier: "Lenovo",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    // Contractors start Aug 3 (see note below) — matches RequestDetail's
    // own summary.needBy in REQUEST_DETAILS above.
    needBy: "Aug 1, 2026",
    submitted: "Jul 21, 2026",
    lineItems: [
      {
        description: "ThinkPad X1 Carbon Gen 12",
        quantity: 15,
        unitPrice: "$1,849",
        amount: "$27,735",
      },
    ],
    total: "$27,735",
    totalValue: 27735,
    packet: {
      budget: {
        label: "Hardware budget · Design Operations FY27",
        pct: "31%",
        detail: "$27,735 of $89,000 remaining this quarter",
      },
      itReview: {
        status: "pass",
        qty: 15,
        imageName: "Standard contractor image",
        source: "IT Ops",
        checkedAt: "Jul 23, 2026 09:14",
      },
    },
    poNumber: "PO-88421",
    expectedDelivery: "Jul 30, 2026",
    // All four checks pass — null would read as "no view," not "cleared."
    // A clean record recommends approve rather than saying nothing.
    recommendation: "approve",
    // Matches the requester-side pricingNote for this same request — real,
    // not invented.
    pricingProgram: "EPP",
    contractEnd: "[Contract end date]",
    spendCategory: "contractor hardware",
    teamsChannel: "[Teams channel name]",
  },
  // Full packet — the exception scenario. Its cost center check reports
  // `exception` (costCenterException below) rather than the usual pass
  // sentence, recommendation is "send-back", and the action group/band/
  // border all follow from that data, not a special case for this id.
  "REQ-2054": {
    id: "REQ-2054",
    request: "Adobe Creative Cloud, 12 seats",
    requester: "Lena Fischer",
    approver: "Alex Chen · Design Director",
    approverPersonaId: "approver",
    supplier: "Adobe",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Berlin office · Torstraße 100, 10119 Berlin",
    needBy: "Aug 15, 2026",
    submitted: "Jul 22, 2026",
    lineItems: [
      {
        description: "Adobe Creative Cloud",
        quantity: 12,
        unitPrice: "$745",
        amount: "$8,940",
      },
    ],
    total: "$8,940",
    totalValue: 8940,
    packet: {
      budget: {
        label: "Software budget · Design Operations FY27",
        pct: "18%",
        detail: "$8,940 of $50,000 remaining this quarter",
      },
      itReview: {
        status: "pass",
        qty: 12,
        imageName: "Standard seat provisioning",
        source: "IT Ops",
        checkedAt: "Jul 24, 2026 10:02",
      },
    },
    poNumber: "PO-88422",
    expectedDelivery: "Aug 10, 2026",
    recommendation: "send-back",
    contractEnd: "[Contract end date]",
    // PLACEHOLDER — the exception itself. Both fields are invented: a real
    // scenario would name the actual mismatch and the code it should have
    // billed to instead.
    costCenterException: {
      code: "[Cost center code]",
      detail: "[Cost center exception detail]",
    },
    teamsChannel: "[Teams channel name]",
  },
  "REQ-2055": {
    id: "REQ-2055",
    request: "Dell UltraSharp monitors ×8",
    requester: "Tom Alvarez",
    approver: "Alex Chen · Design Director",
    approverPersonaId: "approver",
    supplier: "Dell",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    needBy: "Aug 20, 2026",
    submitted: "Jul 22, 2026",
    lineItems: [
      {
        description: "Dell UltraSharp U2723QE",
        quantity: 8,
        unitPrice: "$799",
        amount: "$6,392",
      },
    ],
    total: "$6,392",
    totalValue: 6392,
    packet: {
      budget: {
        label: "Hardware budget · Design Operations FY27",
        pct: "7%",
        detail: "$6,392 of $89,000 remaining this quarter",
      },
      itReview: {
        status: "pass",
        qty: 8,
        imageName: "Standard imaging",
        source: "IT Ops",
        checkedAt: "Jul 24, 2026 11:30",
      },
    },
    poNumber: "PO-88423",
    expectedDelivery: "Aug 15, 2026",
    // All four checks pass — see the same note on REQ-2052.
    recommendation: "approve",
    contractEnd: "[Contract end date]",
    teamsChannel: "[Teams channel name]",
  },
  "REQ-2056": {
    id: "REQ-2056",
    request: "Figma Organization, 25 seats",
    requester: "Will Chen",
    approver: "Alex Chen · Design Director",
    approverPersonaId: "approver",
    supplier: "Figma",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    needBy: "Sep 1, 2026",
    submitted: "Jul 23, 2026",
    lineItems: [
      {
        description: "Figma Organization",
        quantity: 25,
        unitPrice: "$450",
        amount: "$11,250",
      },
    ],
    total: "$11,250",
    totalValue: 11250,
    packet: {
      budget: {
        label: "Software budget · Design Operations FY27",
        pct: "23%",
        detail: "$11,250 of $50,000 remaining this quarter",
      },
      itReview: {
        status: "pass",
        qty: 25,
        imageName: "Standard seat provisioning",
        source: "IT Ops",
        checkedAt: "Jul 25, 2026 08:45",
      },
    },
    poNumber: "PO-88424",
    expectedDelivery: "Aug 25, 2026",
    // All four checks pass — see the same note on REQ-2052.
    recommendation: "approve",
    contractEnd: "[Contract end date]",
    teamsChannel: "[Teams channel name]",
  },
  "REQ-10482": REQ_10482_DECISION_DETAIL,
};

export function getDecisionDetail(id: string): DecisionDetail | undefined {
  return DECISION_DETAILS[id];
}

// ─── PO Record ────────────────────────────────────────────────────────────────

export interface PoLineItem {
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
}

export interface PoDetail {
  poNumber: string;
  vendor: string;
  vendorAddress: string;
  shipTo: string;
  poDate: string;
  lineItems: PoLineItem[];
  subtotal: string;
  tax: string;
  total: string;
}

export const PO_DETAILS: Record<string, PoDetail> = {
  "PO-88421": {
    poNumber: "PO-88421",
    vendor: "Lenovo Group Ltd.",
    vendorAddress: "1009 Think Place, Morrisville, NC 27560",
    shipTo: "Marcus Webb · Design Operations · 1600 17th St, Denver, CO 80202",
    poDate: "Jul 22, 2026",
    lineItems: [
      {
        description: "ThinkPad X1 Carbon Gen 12 · EPP · SKU LNV-X1C-G12-EP",
        qty: 15,
        unitPrice: "$1,849.00",
        total: "$27,735.00",
      },
    ],
    subtotal: "$27,735.00",
    tax: "$0.00",
    total: "$27,735.00",
  },
};

export function getPoDetail(id: string): PoDetail | undefined {
  return PO_DETAILS[id];
}

// Stat-card counts derived from the rows. Awaiting + approved reconcile to total:
// everything pending approval or in sourcing vs cleared.
export function requestStats(rows: RequestRow[] = REQUEST_ROWS) {
  const total = rows.length;
  const awaitingDecision = rows.filter(
    (r) => r.status === "pending-approval" || r.status === "sourcing",
  ).length;
  const approved = rows.filter(
    (r) =>
      r.status === "approved" ||
      r.status === "ordered" ||
      r.status === "delivered",
  ).length;
  const totalValue = rows.reduce((sum, r) => sum + r.amountValue, 0);
  return { total, awaitingDecision, approved, totalValue };
}
