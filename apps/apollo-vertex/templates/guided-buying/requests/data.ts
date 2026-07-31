// The requester's own queue (Marcus Webb) — the mirror image of the buyer's
// Workbench, same list template. REQ-2051 and REQ-2053 are the same objects the
// Workbench holds, shown here from the requester's side; the rest are
// requester-only texture. All scripted/mocked.

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
  /** Vendor / supplier the request is with. */
  supplier: string;
  /** Cost center, "Dept : Sub-department". */
  department: string;
  /** Pre-formatted amount for the table cell, e.g. "$3,698.00". */
  amount: string;
  /** Annual-equivalent value (drives the Total Value metric). */
  amountValue: number;
  status: RequestStatus;
  /** DD MMM YYYY, e.g. "28 May 2026". */
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
    supplier: "Lenovo",
    department: "Design : Brand Studio",
    amount: "$3,698.00",
    amountValue: 3698,
    status: "ordered",
    submitted: "28 May 2026",
    updated: "01 Jun 2026",
  },
  {
    id: "REQ-2051",
    request: "12 mobile lines · Denver team",
    requester: "Marcus Webb",
    supplier: "T-Mobile",
    department: "IT : Denver",
    amount: "$660.00/mo",
    amountValue: 7920,
    status: "pending-approval",
    submitted: "03 Jun 2026",
    updated: "08 Jun 2026",
  },
  {
    id: "REQ-2053",
    request: "Q3 rebrand · 2 contract designers",
    requester: "Marcus Webb",
    supplier: "Multiple (RFQ)",
    department: "Design : Brand Ops",
    amount: "~$58,000.00",
    amountValue: 58000,
    status: "sourcing",
    submitted: "05 Jun 2026",
    updated: "09 Jun 2026",
  },
  {
    id: "REQ-2039",
    request: "Adobe CC team licenses",
    requester: "Marcus Webb",
    supplier: "Adobe",
    department: "Design : Brand Studio",
    amount: "$4,800.00",
    amountValue: 4800,
    status: "approved",
    submitted: "20 May 2026",
    updated: "22 May 2026",
  },
  {
    id: "REQ-2031",
    request: "Standing desk converters ×4",
    requester: "Marcus Webb",
    supplier: "Ergotron",
    department: "IT : Denver",
    amount: "$980.00",
    amountValue: 980,
    status: "delivered",
    submitted: "24 May 2026",
    updated: "27 May 2026",
  },
  {
    id: "REQ-2025",
    request: "Zoom Rooms renewal",
    requester: "Marcus Webb",
    supplier: "Zoom",
    department: "IT : Denver",
    amount: "$2,400.00",
    amountValue: 2400,
    status: "pending-approval",
    submitted: "07 Jun 2026",
    updated: "07 Jun 2026",
  },
  // J1-09 / J1-11 — the catalog submission the Buy flow produces
  {
    id: "REQ-2052",
    request: "15 laptops for Fusion Event contractors",
    requester: "Marcus Webb",
    supplier: "Lenovo",
    department: "Design : Brand Studio",
    amount: "$27,735.00",
    amountValue: 27735,
    status: "pending-approval",
    submitted: "21 Jul 2026",
    updated: "23 Jul 2026",
  },
];

export interface RequestStep {
  label: string;
  desc?: string;
  state: "done" | "current";
}

// Journey bar stages — horizontal tracker on the Request Window page.
export type JourneyStepState =
  | "done"
  | "active"
  | "active-warning"
  | "upcoming";
export interface JourneyStep {
  label: string;
  state: JourneyStepState;
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
  journeyStages?: JourneyStep[];
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
  };
  /** Approver name for the "Full details" expand. */
  approver?: string;
  /** Cost center for the "Full details" expand. */
  costCenter?: string;
  /** Ship-to destination for the sidebar's record fields. */
  shipTo?: string;
  /** Header badge label override (e.g. "Pending · 2 days" instead of status). */
  statusLabel?: string;
  /** Pre-seeded first message shown in the thread bubble. */
  threadSeedMessage?: string;
  /** P2 nudge capsule — system event shown in the thread. No leading emoji — icon added by caller. */
  nudgeText?: string;
  /** Prototype nav — if true, the last journey stage links to /close/{id}. */
  hasClose?: boolean;
  /** Approver sent it back for changes — the header's other owed-action
   * state ("Respond"). No seed scenario sets this yet; implemented
   * generically so the branch exists once one does. */
  sentBack?: boolean;
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
      { label: "Submitted", state: "done" },
      { label: "Approved", state: "done" },
      { label: "Ordered", state: "done" },
    ],
    summary: { items: "2 × X1 Carbon", total: "$3,698" },
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
      { label: "Submitted", state: "done" },
      { label: "Approved", state: "done" },
      { label: "Ordered", state: "done" },
      { label: "Received · 27 May", state: "done" },
    ],
    summary: { items: "4 × Ergotron converter", total: "$980" },
    hasClose: true,
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
      { label: "Submitted · Jul 21", state: "done" },
      { label: "Approval · 2 days with Alex", state: "active-warning" },
      { label: "PO sent", state: "upcoming" },
      { label: "Received", state: "upcoming" },
    ],
    journeyOwnerNote:
      "Waiting on Alex Chen · Design Director. Usually decides within a day.",
    turnaround: "a day",
    pricingNote: "under EPP pricing",
    summary: {
      items: "15 × X1 Carbon",
      total: "$27,735",
      needBy: "Aug 28",
      // $2,138 list vs. $1,849 EPP unit price (see PO_DETAILS), × 15.
      savings: "$4,335",
    },
    approver: "Alex Chen · Design Director",
    costCenter: "Design Operations · CC-4421",
    // Same canonical value the Bridge's envelope infers for this scenario.
    shipTo: "Amsterdam office · Herengracht 124",
    statusLabel: "Pending · 2 days",
    threadSeedMessage:
      "Hi Alex — these are for the Fusion contractors starting Aug 3. Happy to answer anything.",
    nudgeText:
      "Pending 2 days — a reminder went to Alex this morning. You won't need to chase.",
    hasClose: true,
  },
};

export function getRequestDetail(id: string): RequestDetail | undefined {
  return REQUEST_DETAILS[id];
}

export function getRequestRow(id: string): RequestRow | undefined {
  return REQUEST_ROWS.find((r) => r.id === id);
}

// ── Decision Window ───────────────────────────────────────────────────────────

export interface DecisionLineItem {
  description: string;
  amount: string;
}

export interface DecisionPacket {
  budget: {
    label: string;
    /** "XX%" — also used as the inline progress bar width. */
    pct: string;
    detail: string;
  };
  itReview: { title: string; detail: string };
}

export interface DecisionDetail {
  id: string;
  request: string;
  /** "Requester · Department · Supplier · needed by Date" */
  meta: string;
  /** Short date for the breadcrumb, e.g. "Jul 21". */
  submittedDate: string;
  lineItems: DecisionLineItem[];
  total: string;
  noteAuthor: string;
  note: string;
  packet: DecisionPacket;
}

export const DECISION_DETAILS: Record<string, DecisionDetail> = {
  "REQ-2052": {
    id: "REQ-2052",
    request: "15 laptops for Fusion Event contractors",
    meta: "Marcus Webb · Design Operations · Lenovo · needed by Aug 28",
    submittedDate: "Jul 21",
    lineItems: [
      {
        description: "ThinkPad X1 Carbon Gen 12 × 15 · EPP price $1,849",
        amount: "$27,735",
      },
    ],
    total: "$27,735",
    noteAuthor: "Marcus",
    note: "Hi Alex — these are for the Fusion contractors starting Aug 3. Happy to answer anything.",
    packet: {
      budget: {
        label: "Hardware budget · Design Operations FY27",
        pct: "31%",
        detail: "$27,735 of $89,000 remaining this quarter",
      },
      itReview: {
        title: "Device management · Ready",
        detail:
          "Enrollment pre-queued for 15 units — standard contractor image · IT Ops, today 09:14",
      },
    },
  },
};

export function getDecisionDetail(id: string): DecisionDetail | undefined {
  return DECISION_DETAILS[id];
}

// ── Close Window ──────────────────────────────────────────────────────────────

export interface CloseDetail {
  id: string;
  request: string;
  /** Short date for the breadcrumb, e.g. "Aug 3". */
  receivedDate: string;
  stages: JourneyStep[];
  /** Record chip labels rendered below the journey bar. */
  recordChips: string[];
  summary: { heading: string; detail: string };
  action: string;
  banner: string;
}

export const CLOSE_DETAILS: Record<string, CloseDetail> = {
  "REQ-2052": {
    id: "REQ-2052",
    request: "15 laptops for Fusion Event contractors",
    receivedDate: "Aug 3",
    stages: [
      { label: "Submitted · Jul 21", state: "done" },
      { label: "Approved", state: "done" },
      { label: "PO sent", state: "done" },
      { label: "Received · Aug 3", state: "done" },
    ],
    recordChips: ["PO-88421", "PR-2052"],
    summary: {
      heading: "Delivery complete · 15 units received Aug 3",
      detail:
        "15 × ThinkPad X1 Carbon Gen 12 · device enrollment confirmed · handed off to Fusion Event contractors · Lenovo",
    },
    action: "Confirm receipt",
    banner:
      "Request complete — 15 ThinkPads received, enrolled, and in contractors' hands.",
  },
  "REQ-2031": {
    id: "REQ-2031",
    request: "Standing desk converters ×4",
    receivedDate: "27 May",
    stages: [
      { label: "Submitted", state: "done" },
      { label: "Approved", state: "done" },
      { label: "Ordered", state: "done" },
      { label: "Received · 27 May", state: "done" },
    ],
    // No PO line-item data seeded for this scenario — PR only, no PO chip.
    recordChips: ["PR-2031"],
    summary: {
      heading: "Delivery complete · 4 units received May 27",
      detail:
        "4 × Ergotron standing desk converters · delivered to the Denver office.",
    },
    action: "Confirm receipt",
    banner: "Request complete — 4 converters received and in place.",
  },
};

export function getCloseDetail(id: string): CloseDetail | undefined {
  return CLOSE_DETAILS[id];
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

/** Format a Date as "DD MMM YYYY", e.g. "13 Jul 2026". */
export function formatDateDisplay(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mmm = MONTHS_SHORT[date.getMonth()];
  return `${dd} ${mmm} ${date.getFullYear()}`;
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
