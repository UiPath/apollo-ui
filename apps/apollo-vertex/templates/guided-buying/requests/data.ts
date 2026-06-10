// The requester's own queue (Marcus Webb) — the mirror image of the buyer's
// Workbench, same list template. REQ-2051 and REQ-2053 are the same objects the
// Workbench holds, shown here from the requester's side; the rest are
// requester-only texture. All scripted/mocked.

export type RequestStatus =
  | "ordered"
  | "approved"
  | "pending-approval"
  | "sourcing";

export interface RequestRow {
  id: string;
  request: string;
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
  /** MM/DD/YYYY. */
  submitted: string;
  updated: string;
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  ordered: "Ordered",
  approved: "Approved",
  "pending-approval": "Pending Approval",
  sourcing: "Sourcing",
};

export const STATUS_BADGE: Record<
  RequestStatus,
  "success" | "warning" | "info"
> = {
  ordered: "success",
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
    submitted: "05/28/2026",
    updated: "06/01/2026",
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
    submitted: "06/03/2026",
    updated: "06/08/2026",
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
    submitted: "06/05/2026",
    updated: "06/09/2026",
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
    submitted: "05/20/2026",
    updated: "05/22/2026",
  },
  {
    id: "REQ-2031",
    request: "Standing desk converters ×4",
    requester: "Marcus Webb",
    supplier: "Ergotron",
    department: "IT : Denver",
    amount: "$980.00",
    amountValue: 980,
    status: "approved",
    submitted: "05/24/2026",
    updated: "05/27/2026",
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
    submitted: "06/07/2026",
    updated: "06/07/2026",
  },
];

export interface RequestStep {
  label: string;
  desc?: string;
  state: "done" | "current";
}

export interface RequestDetail {
  id: string;
  request: string;
  /** Subtitle in the detail header. */
  meta: string;
  /** Detail outcome line (e.g. "Routed to procurement", "Ordered"). */
  headline: string;
  /** First-person agent line under the headline. */
  agentLine: string;
  /** In-flight (still with procurement) → offer follow-up actions. */
  inFlight: boolean;
  timeline: RequestStep[];
}

// Deep details exist only for the three requests that came through the flow.
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
  },
};

export function getRequestDetail(id: string): RequestDetail | undefined {
  return REQUEST_DETAILS[id];
}

export function getRequestRow(id: string): RequestRow | undefined {
  return REQUEST_ROWS.find((r) => r.id === id);
}

// Stat-card counts derived from the rows. Awaiting + approved reconcile to total:
// everything still with procurement (pending approval or sourcing) vs cleared.
export function requestStats() {
  const total = REQUEST_ROWS.length;
  const awaitingDecision = REQUEST_ROWS.filter(
    (r) => r.status === "pending-approval" || r.status === "sourcing",
  ).length;
  const approved = REQUEST_ROWS.filter(
    (r) => r.status === "approved" || r.status === "ordered",
  ).length;
  const totalValue = REQUEST_ROWS.reduce((sum, r) => sum + r.amountValue, 0);
  return { total, awaitingDecision, approved, totalValue };
}
