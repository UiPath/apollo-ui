// oxlint-disable max-lines -- seed data + scripted detail content for the Workbench

// The buyer's escalation queue: off-catalog Buy requests fork here for a human
// to decide. Quote = amber, Contract = red. All scripted/mocked.

export type ForkType = "quote" | "contract";

export type WorkbenchStatus =
  | "awaiting"
  | "approved"
  | "countered"
  | "rejected"
  | "auto-cleared";

export interface WorkbenchRow {
  id: string;
  request: string;
  requester: string;
  /** Pre-formatted value, e.g. "€2,450". */
  value: string;
  needBy: string;
  type: ForkType;
  status: WorkbenchStatus;
  assignee: string;
  /** Queue bucket for the detail's left nav. */
  dueGroup: "today" | "tomorrow" | "later";
}

export interface TimelineEntry {
  id: string;
  label: string;
  time?: string;
  desc?: string;
  indicator: "pending" | "user" | "ai-warn" | "ai-pass" | "event";
}

export interface DetailMetric {
  label: string;
  value: string;
  /** Optional value color class (e.g. text-success / text-destructive). */
  cls?: string;
}

export interface DetailLine {
  description: string;
  qty: number;
  unitPrice: string;
  amount: string;
}

export interface DetailField {
  label: string;
  value: string;
}

/** The outcome a decision button commits to. */
export type Decision = "approved" | "countered" | "rejected";

export interface ActionSpec {
  label: string;
  decision: Decision;
}

export interface WorkbenchDetail {
  id: string;
  request: string;
  requester: string;
  value: string;
  needBy: string;
  /** Header timing line — traces to what the flow set (need-by or activation). */
  timing: string;
  type: ForkType;
  finding: {
    tag: string;
    headline: string;
    metrics: DetailMetric[];
    body: string;
  };
  /** Decision buttons — primary is the agent's recommendation. */
  actions: { primary: ActionSpec; secondary: ActionSpec; reject: ActionSpec };
  /** First-person Autopilot confirmation per decision (Activity + resolved card). */
  confirmations: Record<Decision, string>;
  suggestions: string[];
  composerPlaceholder: string;
  lines: DetailLine[];
  linesTotal: string;
  source: { filename: string; lines: string[] };
  activity: TimelineEntry[];
  details: DetailField[];
}

export const FORK_LABEL: Record<ForkType, string> = {
  quote: "Quote",
  contract: "Contract",
};

// Fork colors: Quote = amber (warning), Contract = red (error).
export const FORK_BADGE_STATUS: Record<ForkType, "warning" | "error"> = {
  quote: "warning",
  contract: "error",
};

export const FORK_DOT: Record<ForkType, string> = {
  quote: "bg-warning",
  contract: "bg-destructive",
};

export const STATUS_LABEL: Record<WorkbenchStatus, string> = {
  awaiting: "Awaiting your review",
  approved: "Approved",
  countered: "Countered",
  rejected: "Rejected",
  "auto-cleared": "Auto-cleared",
};

export const STATUS_BADGE: Record<
  WorkbenchStatus,
  "warning" | "success" | "error" | "info"
> = {
  awaiting: "warning",
  approved: "success",
  countered: "info",
  rejected: "error",
  "auto-cleared": "info",
};

// ── Queue / list rows ─────────────────────────────────────────────────────────
// The two scenarios (tied to the off-catalog Intake starters) + texture rows.

export const WORKBENCH_ROWS: WorkbenchRow[] = [
  {
    id: "REQ-2048",
    request: "5 standing desks for the Berlin office",
    requester: "Lena Fischer",
    value: "€2,450",
    needBy: "Jun 18",
    type: "quote",
    status: "awaiting",
    assignee: "You",
    dueGroup: "today",
  },
  {
    id: "REQ-2051",
    request: "12 mobile lines for Denver",
    requester: "Marcus Webb",
    value: "$660/mo",
    needBy: "Next cycle",
    type: "contract",
    status: "awaiting",
    assignee: "You",
    dueGroup: "today",
  },
  {
    id: "REQ-2039",
    request: "Standing desk converters ×8",
    requester: "Priya Nair",
    value: "$1,920",
    needBy: "Jun 19",
    type: "quote",
    status: "awaiting",
    assignee: "You",
    dueGroup: "tomorrow",
  },
  {
    id: "REQ-2044",
    request: "Annual Figma Enterprise renewal",
    requester: "Tom Alvarez",
    value: "$54,000",
    needBy: "Jun 30",
    type: "contract",
    status: "awaiting",
    assignee: "Dana Lopez",
    dueGroup: "tomorrow",
  },
  {
    id: "REQ-2031",
    request: "Catering for the design offsite",
    requester: "Sofia Marin",
    value: "$2,100",
    needBy: "Jun 17",
    type: "quote",
    status: "countered",
    assignee: "You",
    dueGroup: "later",
  },
  {
    id: "REQ-2025",
    request: "Conference room AV upgrade",
    requester: "Will Chen",
    value: "$12,800",
    needBy: "Jul 2",
    type: "quote",
    status: "approved",
    assignee: "You",
    dueGroup: "later",
  },
];

// ── Detail content (deep on the quote, lighter on the contract) ──────────────

export const WORKBENCH_DETAILS: Record<string, WorkbenchDetail> = {
  "REQ-2048": {
    id: "REQ-2048",
    request: "5 standing desks for the Berlin office",
    requester: "Lena Fischer",
    value: "€2,450",
    needBy: "Jun 18, 2026",
    timing: "Need by Jun 18, 2026",
    type: "quote",
    finding: {
      tag: "Off-catalog · Quote",
      headline: "Off-catalog request — vendor quote ready for review",
      metrics: [
        { label: "Quoted total", value: "€2,450" },
        { label: "Budget", value: "€3,000" },
        { label: "Under budget", value: "€550", cls: "text-success" },
      ],
      body: "These desks aren't in the catalog, so I sourced 3 vendors and selected the best quote. WorkSpace GmbH came in lowest at €490/unit — height-adjustable, 5-year warranty, delivered to Berlin in 10 business days. That's €550 under the team's €3,000 budget for this request.",
    },
    actions: {
      primary: { label: "Approve quote", decision: "approved" },
      secondary: { label: "Counter", decision: "countered" },
      reject: { label: "Reject", decision: "rejected" },
    },
    confirmations: {
      approved: "Approved — PO issued to WorkSpace GmbH.",
      countered: "Counter drafted and sent to WorkSpace GmbH.",
      rejected: "Rejected — Lena has been notified.",
    },
    suggestions: ["Why this vendor?", "Negotiate with agent", "Budget check"],
    composerPlaceholder: "Ask about this quote…",
    lines: [
      {
        description: "Height-adjustable standing desk, white (Berlin)",
        qty: 5,
        unitPrice: "€490.00",
        amount: "€2,450.00",
      },
    ],
    linesTotal: "€2,450.00",
    source: {
      filename: "WorkSpace-GmbH-Quote-Q-4821.pdf",
      lines: [
        "Quote Q-4821",
        "WorkSpace GmbH — Office Furniture",
        "5× Height-adjustable desk, white — €490.00 / unit",
        "Warranty: 5 years",
        "Delivery: Berlin, 10 business days",
        "Total: €2,450.00 (excl. VAT)",
        "Valid until: Jun 30, 2026",
      ],
    },
    activity: [
      { id: "a0", label: "Awaiting your decision", indicator: "pending" },
      {
        id: "a1",
        label: "Escalated to you",
        time: "9:12 AM",
        desc: "Off-catalog — needs buyer approval",
        indicator: "ai-warn",
      },
      {
        id: "a2",
        label: "Selected best quote",
        time: "9:10 AM",
        desc: "WorkSpace GmbH · €490/unit · 10-day lead",
        indicator: "ai-pass",
      },
      {
        id: "a3",
        label: "Sourced 3 vendors",
        time: "9:06 AM",
        desc: "Compared price, warranty, and lead time",
        indicator: "ai-pass",
      },
      {
        id: "a4",
        label: "Request received",
        time: "9:04 AM",
        desc: "From Lena Fischer · Intake",
        indicator: "event",
      },
    ],
    details: [
      { label: "Request ID", value: "REQ-2048" },
      { label: "Requester", value: "Lena Fischer · Design, Berlin" },
      { label: "Estimated value", value: "€2,450" },
      { label: "Need by", value: "Jun 18, 2026" },
      { label: "Type", value: "Quote · off-catalog" },
      { label: "Route", value: "Direct to you · no procurement review" },
      { label: "Cost center", value: "Design Operations · CC-4421" },
    ],
  },

  "REQ-2051": {
    id: "REQ-2051",
    request: "12 mobile lines for Denver",
    requester: "Marcus Webb",
    value: "$660/mo",
    needBy: "Jun 24, 2026",
    timing: "Activation · next billing cycle",
    type: "contract",
    finding: {
      tag: "Configured · Contract",
      headline: "Configured under your T-Mobile MSA — ready to approve",
      metrics: [
        { label: "Per line", value: "$55/mo" },
        { label: "Monthly", value: "$660/mo" },
        { label: "Annual", value: "$7,920/yr" },
      ],
      body: "Configured under your active T-Mobile MSA — 12 Business Pro lines for the Denver team at $55/line/mo (MSA tier 2), bring-your-own-device ($0, no subsidy). That's $660/mo, $7,920/yr. MDM, activation, and billing are set to recommended defaults — review and approve.",
    },
    actions: {
      primary: { label: "Approve", decision: "approved" },
      secondary: { label: "Counter", decision: "countered" },
      reject: { label: "Reject", decision: "rejected" },
    },
    confirmations: {
      approved: "Approved — provisioning 12 Business Pro lines with T-Mobile.",
      countered: "Counter sent to T-Mobile.",
      rejected: "Rejected — Marcus has been notified.",
    },
    suggestions: [
      "Why Business Pro?",
      "Show the MSA terms",
      "Adjust the configuration",
    ],
    composerPlaceholder: "Ask about this configuration…",
    lines: [
      {
        description: "Mobile line · Business Pro (Denver)",
        qty: 12,
        unitPrice: "$55.00/mo",
        amount: "$660.00/mo",
      },
    ],
    linesTotal: "$660.00/mo · $7,920.00/yr",
    source: {
      filename: "T-Mobile-MSA-2024.pdf",
      lines: [
        "Master Service Agreement",
        "T-Mobile for Business",
        "Tier 2 (Business Pro): $55.00 / line / mo",
        "Includes: 50 GB hotspot · 5 GB intl roaming · priority data",
        "Term: 24 months",
        "Effective: Jan 1, 2024",
      ],
    },
    activity: [
      { id: "a0", label: "Awaiting your decision", indicator: "pending" },
      {
        id: "a1",
        label: "Escalated to you",
        time: "8:52 AM",
        desc: "Configured — ready to approve",
        indicator: "ai-warn",
      },
      {
        id: "a2",
        label: "Configured devices + defaults",
        time: "8:50 AM",
        desc: "BYOD ($0) · Intune · next billing cycle",
        indicator: "ai-pass",
      },
      {
        id: "a3",
        label: "Configured 12 Business Pro lines",
        time: "8:48 AM",
        desc: "$55/line · MSA tier 2",
        indicator: "ai-pass",
      },
      {
        id: "a4",
        label: "Matched to active T-Mobile MSA",
        time: "8:45 AM",
        desc: "No new contract needed",
        indicator: "ai-pass",
      },
      {
        id: "a5",
        label: "Request received",
        time: "8:42 AM",
        desc: "From Marcus Webb · Configure with agent",
        indicator: "event",
      },
    ],
    details: [
      { label: "Request ID", value: "REQ-2051" },
      { label: "Requester", value: "Marcus Webb · IT, Denver" },
      { label: "Estimated value", value: "$660/mo · $7,920/yr" },
      { label: "Activation", value: "Next billing cycle" },
      { label: "Type", value: "Contract · under MSA" },
      { label: "Plan", value: "Business Pro · MSA tier 2" },
      { label: "Devices", value: "Bring your own · $0/line" },
      { label: "Agreement", value: "T-Mobile MSA · 2024" },
    ],
  },
};

// Stat-card counts derived from the seed rows.
export function workbenchStats() {
  const awaiting = WORKBENCH_ROWS.filter(
    (r) => r.status === "awaiting" && r.assignee === "You",
  ).length;
  const quotes = WORKBENCH_ROWS.filter(
    (r) => r.type === "quote" && r.status === "awaiting",
  ).length;
  const contracts = WORKBENCH_ROWS.filter(
    (r) => r.type === "contract" && r.status === "awaiting",
  ).length;
  return { awaiting, quotes, contracts, autoCleared: 38 };
}
