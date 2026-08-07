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
export type JourneyStepState =
  | "done"
  | "active"
  | "active-warning"
  | "upcoming";
export interface JourneyStep {
  label: string;
  state: JourneyStepState;
  /** Second-line date on the Request Window's stage track: the actual date
   * once done, an expected/projected date otherwise. Omit rather than
   * derive a placeholder when there's nothing to base it on. */
  date?: string;
  /** Days since `date` passed without this stage completing (active-warning
   * only) — renders as "· N day(s) ago" next to the date. */
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
  /** Pre-seeded first message shown in the thread bubble. */
  threadSeedMessage?: string;
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
      // "Today" in this scenario is ~23 Jul, so 22 Jul was 1 day ago.
      {
        label: "Approved",
        state: "active-warning",
        date: "Jul 22, 2026",
        overdueDays: 1,
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
      // "Today" in this scenario is ~23 Jul (2 days after the 21 Jul
      // submission, per the "Approval · 2 days with Alex" story). 23 Jul →
      // 31 Jul is 8 days, + 1 to reach 1 Aug = 9. Still comfortably past the
      // 3-day threshold, so no header chip renders.
      needByDaysLeft: 9,
    },
    approver: "Alex Chen · Design Director",
    costCenter: "Design Operations · CC-4421",
    // Same canonical value the Bridge's envelope infers for this scenario.
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    statusLabel: "Pending · 2 days",
    threadSeedMessage:
      "Hi Alex, these are for the Fusion contractors starting Aug 3. Happy to answer anything.",
    nudgeText:
      "Pending 2 days. A reminder went to Alex this morning. You won't need to chase.",
    recordChips: ["PR-2052", "PO · created on approval"],
  },
};

// The date Alex actually approved REQ-2052 — a real record, not the pending
// stage bar's own expected date (Jul 22), which is a projection of when a
// decision was due, not what happened. RequestWindow's stage bar and
// DecisionWindow's own header/body both read this one value once approved,
// rather than each keeping its own copy.
export const REQ_2052_APPROVED_DATE = "Jul 23, 2026";

// This scenario's fixed "today" — REQ-2052 submitted Jul 21 is already "2
// days pending" as of this date, matching REQ_2052_APPROVED_DATE and the
// rest of the narrative clock. The Approvals queue's day-count math reads
// from this instead of the real wall clock, which would drift out of sync
// with every other seeded date in this scenario.
export const APPROVALS_TODAY = "Jul 23, 2026";

/** Whole days from `date` (e.g. "Jul 21, 2026") to APPROVALS_TODAY. */
export function daysSince(date: string): number {
  const ms = new Date(APPROVALS_TODAY).getTime() - new Date(date).getTime();
  return Math.round(ms / 86_400_000);
}

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
  requester: string;
  /** "Name · Title" — folded into the header band, not a separate identity line. */
  approver: string;
  supplier: string;
  /** "Department · Cost centre code". */
  costCenter: string;
  /** "Location · Street, postcode city". */
  shipTo: string;
  needBy: string;
  /** "MMM D, YYYY" — drives the queue's pending-days and longest-waiting math. */
  submitted: string;
  lineItems: DecisionLineItem[];
  total: string;
  /** Numeric total, parallel to RequestRow's amountValue — drives the
   * queue's "Awaiting your decision" sum without parsing the display string. */
  totalValue: number;
  /** The requester's note on the request, shown as a Communication entry. */
  note: string;
  packet: DecisionPacket;
  /** The PO this approval triggers — matches PO_DETAILS below. Only
   * surfaced once approved; pre-decision the sidebar's PO chip stays a
   * plain "created on approval" placeholder instead. */
  poNumber: string;
  /** Projected delivery once the PO ships. The requester's own journey
   * stages carry no equivalent date (see REQUEST_DETAILS above) since there
   * is no real basis to project one, this field has the same gap. */
  expectedDelivery: string;
}

// Every entry bills to Design Operations · CC-4421 and exceeds $5,000 —
// COST_TO_APPROVER routes that cost center to Alex Chen, and the Approver
// provenance popover states the $5,000 policy threshold. A row here that
// violated either would contradict a rule the app itself displays.
export const DECISION_DETAILS: Record<string, DecisionDetail> = {
  "REQ-2052": {
    id: "REQ-2052",
    request: "15 laptops for Fusion Event contractors",
    requester: "Marcus Webb",
    approver: "Alex Chen · Design Director",
    supplier: "Lenovo",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    // Contractors start Aug 3 (see note below) — matches RequestDetail's
    // own summary.needBy in REQUEST_DETAILS above.
    needBy: "Aug 1, 2026",
    submitted: "Jul 21, 2026",
    lineItems: [
      {
        description: "ThinkPad X1 Carbon Gen 12 × 15 · EPP price $1,849",
        amount: "$27,735",
      },
    ],
    total: "$27,735",
    totalValue: 27735,
    note: "Hi Alex, these are for the Fusion contractors starting Aug 3. Happy to answer anything.",
    packet: {
      budget: {
        label: "Hardware budget · Design Operations FY27",
        pct: "31%",
        detail: "$27,735 of $89,000 remaining this quarter",
      },
      itReview: {
        title: "Device management · Ready",
        detail:
          "Enrollment pre-queued for 15 units. Standard contractor image · IT Ops, today 09:14.",
      },
    },
    poNumber: "PO-88421",
    expectedDelivery: "Jul 30, 2026",
  },
  // Light record — populates the queue row and its inline Approve/Deny
  // actions only. No detail page reads this one (see Approvals.tsx), so it
  // carries no line-item breakdown or policy analysis beyond what the row
  // itself shows.
  "REQ-2054": {
    id: "REQ-2054",
    request: "Adobe Creative Cloud, 12 seats",
    requester: "Lena Fischer",
    approver: "Alex Chen · Design Director",
    supplier: "Adobe",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Berlin office · Torstraße 100, 10119 Berlin",
    needBy: "Aug 15, 2026",
    submitted: "Jul 22, 2026",
    lineItems: [
      { description: "Adobe Creative Cloud · 12 seats", amount: "$8,940" },
    ],
    total: "$8,940",
    totalValue: 8940,
    note: "12 seats for the design team's Creative Cloud renewal.",
    packet: {
      budget: {
        label: "Software budget · Design Operations FY27",
        pct: "18%",
        detail: "$8,940 of $50,000 remaining this quarter",
      },
      itReview: {
        title: "License provisioning · Ready",
        detail: "12 seats queued for the design team roster.",
      },
    },
    poNumber: "PO-88422",
    expectedDelivery: "Aug 10, 2026",
  },
  "REQ-2055": {
    id: "REQ-2055",
    request: "Dell UltraSharp monitors ×8",
    requester: "Tom Alvarez",
    approver: "Alex Chen · Design Director",
    supplier: "Dell",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    needBy: "Aug 20, 2026",
    submitted: "Jul 22, 2026",
    lineItems: [
      { description: "Dell UltraSharp U2723QE × 8", amount: "$6,392" },
    ],
    total: "$6,392",
    totalValue: 6392,
    note: "8 monitors to replace units flagged in the equipment audit.",
    packet: {
      budget: {
        label: "Hardware budget · Design Operations FY27",
        pct: "7%",
        detail: "$6,392 of $89,000 remaining this quarter",
      },
      itReview: {
        title: "Device management · Ready",
        detail: "Standard imaging queued for 8 units.",
      },
    },
    poNumber: "PO-88423",
    expectedDelivery: "Aug 15, 2026",
  },
  "REQ-2056": {
    id: "REQ-2056",
    request: "Figma Organization, 25 seats",
    requester: "Will Chen",
    approver: "Alex Chen · Design Director",
    supplier: "Figma",
    costCenter: "Design Operations · CC-4421",
    shipTo: "Amsterdam office · Herengracht 124, 1015 BS Amsterdam",
    needBy: "Sep 1, 2026",
    submitted: "Jul 23, 2026",
    lineItems: [
      { description: "Figma Organization · 25 seats", amount: "$11,250" },
    ],
    total: "$11,250",
    totalValue: 11250,
    note: "25 seats for the design and product teams.",
    packet: {
      budget: {
        label: "Software budget · Design Operations FY27",
        pct: "23%",
        detail: "$11,250 of $50,000 remaining this quarter",
      },
      itReview: {
        title: "License provisioning · Ready",
        detail: "25 seats queued across design and product.",
      },
    },
    poNumber: "PO-88424",
    expectedDelivery: "Aug 25, 2026",
  },
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

/** Format a Date as "MMM D, YYYY", e.g. "Jul 13, 2026". */
export function formatDateDisplay(date: Date): string {
  const mmm = MONTHS_SHORT[date.getMonth()];
  return `${mmm} ${date.getDate()}, ${date.getFullYear()}`;
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
