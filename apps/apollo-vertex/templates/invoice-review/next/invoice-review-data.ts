// Data contract for the next-version invoice-review workspace timeline.
// "single" vs "cascade" is not a mode: it is `downstream === null` (single) vs
// populated (cascade). One InvoiceReview drives the whole center timeline.
//
// Agent behavior is fully stubbed (see the stubs at the bottom). Agent history
// is mock and mirrors the current Activity feed.

export type Severity = "red" | "amber" | "gray";

export interface FindingSide {
  label: string;
  value: string;
  tone?: "warn" | "muted";
  provenance: string;
  /** value came from the invoice and is flagged, so it can be highlighted in Source */
  inspectable?: boolean;
}

export interface Finding {
  type: "compare" | "single";
  /** compare: two (or more) values side by side */
  sides?: FindingSide[];
  /** single: one fact */
  items?: FindingSide[];
}

export type SuggestionType =
  | "suggest_po"
  | "suggest_correction"
  | "suggest_email"
  | "suggest_supplier"
  | "suggest_account"
  | "suggest_tax_code"
  | "verify"
  | "route"
  | "retry"
  | "wait";

export interface Suggestion {
  type: SuggestionType;
  data: Record<string, unknown>;
  reasoning?: string;
}

export interface InvoiceException {
  id: string;
  severity: Severity;
  chip: string;
  headline: string;
  finding: Finding;
  /** [0] = primary resolution; empty = judgment call (no fix, resolve via header) */
  suggestions: Suggestion[];
  /** shown instead of a fix card for judgment calls */
  reasoning?: string;
}

export interface AgentStep {
  title: string;
  sub: string;
  time: string;
  /** the escalation handoff to the reviewer */
  handoff?: boolean;
}

export interface DownstreamChecks {
  total: number;
  passed: number;
  /** exceptions revealed once the gating exception is resolved */
  surfaced: InvoiceException[];
  gateMain: string;
  gateSub: string;
  revalSub: string;
}

export interface InvoiceReview {
  id: string;
  supplier: string;
  amount: string;
  due: string;
  poPill: { label: string; tone: "red" | "neutral" };
  agentHistory: AgentStep[];
  exception: InvoiceException;
  /** null = single exception; populated = cascade gated behind this one */
  downstream: DownstreamChecks | null;
}

// The automated checks that ran before escalation. Named by action, not actor
// (the mark on the history node already signals these were automated).
const DEFAULT_AGENT_HISTORY: AgentStep[] = [
  {
    title: "Extracted",
    sub: "18 fields read from the invoice PDF",
    time: "9:08 AM",
  },
  {
    title: "Validated",
    sub: "Checked against Coupa: vendor, terms, totals",
    time: "9:10 AM",
  },
  {
    title: "Escalated",
    sub: "Needs a human decision",
    time: "9:12 AM",
    handoff: true,
  },
];

// --- Resolution helpers ----------------------------------------------------
// Which resolutions clear the path vs. end on an external hold. A hold means the
// timeline waits on an outside reply and the header Approve stays locked.
const HOLD_TYPES: ReadonlySet<SuggestionType> = new Set([
  "suggest_email",
  "suggest_supplier",
  "route",
  "wait",
]);

export function isHoldSuggestion(s: Suggestion): boolean {
  return HOLD_TYPES.has(s.type);
}

export function suggestionLabel(s: Suggestion): string {
  switch (s.type) {
    case "suggest_po":
      return `Link ${(s.data.po as string) ?? "PO"}`;
    case "suggest_correction":
      return (s.data.label as string) ?? "Apply correction";
    case "suggest_account":
      return "Set GL account";
    case "suggest_tax_code":
      return "Apply tax code";
    case "suggest_email":
      return "Draft to supplier";
    case "suggest_supplier":
      return "Ask supplier";
    case "verify":
      return "Mark verified";
    case "route":
      return "Route to data owner";
    case "retry":
      return "Retry extraction";
    case "wait":
      return "Hold for rate";
    default:
      return "Resolve";
  }
}

// --- Fixtures --------------------------------------------------------------
// One InvoiceReview per queue invoice. Hero cases mirror the prototype content.

const TOTAL_MISMATCH: InvoiceException = {
  id: "exc-total-mismatch",
  severity: "amber",
  chip: "Total mismatch",
  headline: "Invoice total is higher than the linked PO",
  finding: {
    type: "compare",
    sides: [
      {
        label: "Invoice",
        value: "$12,240.00",
        provenance: "INV-84471",
        tone: "warn",
        inspectable: true,
      },
      { label: "PO-5123", value: "$11,800.00", provenance: "Coupa" },
    ],
  },
  suggestions: [
    {
      type: "suggest_correction",
      data: { label: "Accept +$440 freight" },
      reasoning:
        "The $440 difference matches the freight line on PO-5123, which allows a freight variance.",
    },
    { type: "suggest_supplier", data: {} },
  ],
};

const invoiceReviewMap: Record<string, InvoiceReview> = {
  // 1. Hero cascade: Missing PO -> link PO -> re-validate -> Total mismatch surfaces.
  "INV-84471": {
    id: "INV-84471",
    supplier: "Acme Supply Co.",
    amount: "$12,240.00 USD",
    due: "May 28, 2026",
    poPill: { label: "No PO", tone: "red" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-missing-po",
      severity: "red",
      chip: "Missing PO",
      headline: "Facility supplies submitted without a purchase order",
      finding: {
        type: "single",
        items: [
          {
            label: "Matched PO",
            value: "None",
            tone: "warn",
            provenance: "searched Coupa",
          },
        ],
      },
      suggestions: [
        {
          type: "suggest_po",
          data: { po: "PO-5123" },
          reasoning:
            "PO-5123 (Acme Supply Co., facility supplies) matches the vendor, amount, and date on this invoice.",
        },
        { type: "suggest_supplier", data: {} },
      ],
    },
    downstream: {
      total: 3,
      passed: 2,
      surfaced: [TOTAL_MISMATCH],
      gateMain: "3 more checks can't run until a PO is linked.",
      gateSub: "Total, tax, and receipt checks are gated behind the PO.",
      revalSub: "Re-validating against PO-5123",
    },
  },

  // 2. Outside PO period (compare date vs window; correct-to-date).
  "INV-55832": {
    id: "INV-55832",
    supplier: "Meridian Group",
    amount: "€22,500.00 EUR",
    due: "May 29, 2026",
    poPill: { label: "PO-558120044", tone: "neutral" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-po-period",
      severity: "amber",
      chip: "Outside PO period",
      headline: "Invoice date falls outside the PO's valid window",
      finding: {
        type: "compare",
        sides: [
          {
            label: "Invoice date",
            value: "May 3, 2026",
            provenance: "INV-55832",
            tone: "warn",
            inspectable: true,
          },
          {
            label: "PO window",
            value: "Jan 1 - Apr 30, 2026",
            provenance: "PO-558120044",
          },
        ],
      },
      suggestions: [
        {
          type: "suggest_correction",
          data: { label: "Correct to Apr 30, 2026" },
          reasoning:
            "The service period ends Apr 30; the invoice date looks like a billing lag.",
        },
        { type: "suggest_supplier", data: {} },
      ],
    },
    downstream: null,
  },

  // 3. VAT mismatch (compare invoice VAT vs on-file; verify / route = hold).
  // NOTE: brief calls this INV-66031, which isn't in the queue; mapped to 66216.
  "INV-66216": {
    id: "INV-66216",
    supplier: "Prime Office Solutions",
    amount: "$65,800.00 USD",
    due: "May 28, 2026",
    poPill: { label: "PO-820044712", tone: "neutral" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-vat",
      severity: "amber",
      chip: "VAT mismatch",
      headline: "VAT number does not match the supplier record",
      finding: {
        type: "compare",
        sides: [
          {
            label: "On invoice",
            value: "US-82-4471200",
            provenance: "INV-66216",
            tone: "warn",
            inspectable: true,
          },
          {
            label: "On file",
            value: "US-82-4470911",
            provenance: "Vendor master",
          },
        ],
      },
      suggestions: [
        {
          type: "verify",
          data: {},
          reasoning:
            "The invoice VAT is one digit off the record; likely a typo on the invoice.",
        },
        { type: "route", data: { owner: "Vendor data owner" } },
      ],
    },
    downstream: null,
  },

  // 4. Line items don't match (compare descriptions; judgment call, no suggestion).
  "INV-60118": {
    id: "INV-60118",
    supplier: "Crestwood Co.",
    amount: "$940.00 USD",
    due: "May 29, 2026",
    poPill: { label: "No PO", tone: "red" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-lines",
      severity: "amber",
      chip: "Line items don't match",
      headline: "Line descriptions don't match the request",
      finding: {
        type: "compare",
        sides: [
          {
            label: "Invoiced",
            value: "Premium onsite install",
            provenance: "INV-60118",
            tone: "warn",
            inspectable: true,
          },
          {
            label: "Requested",
            value: "Standard delivery",
            provenance: "Intake note",
          },
        ],
      },
      suggestions: [],
      reasoning:
        "The invoiced work is broader than what was requested. There's no clean automated fix; a reviewer should decide whether the expanded scope was authorized.",
    },
    downstream: null,
  },

  // 5. No exchange rate (single; hold-for-rate / retry).
  "INV-91003": {
    id: "INV-91003",
    supplier: "NorthStar LLC",
    amount: "£8,750.00 GBP",
    due: "May 28, 2026",
    poPill: { label: "PO-NL-20250093", tone: "neutral" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-fx",
      severity: "gray",
      chip: "No exchange rate",
      headline: "No GBP to USD rate available for the invoice date",
      finding: {
        type: "single",
        items: [
          {
            label: "Rate on May 28, 2026",
            value: "Not published yet",
            tone: "muted",
            provenance: "Treasury feed",
          },
        ],
      },
      suggestions: [
        {
          type: "wait",
          data: {},
          reasoning: "The daily rate posts by 6pm ET.",
        },
        { type: "retry", data: {} },
      ],
    },
    downstream: null,
  },

  // --- Simple singles for the remaining queue rows -------------------------
  "INV-GRN-001": {
    id: "INV-GRN-001",
    supplier: "ACME Industrial",
    amount: "$694.39 USD",
    due: "May 28, 2026",
    poPill: { label: "PO-460035919", tone: "neutral" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-price",
      severity: "amber",
      chip: "Price mismatch",
      headline: "USB hub invoiced above the agreed price",
      finding: {
        type: "compare",
        sides: [
          {
            label: "Invoiced",
            value: "$694.39",
            provenance: "INV-GRN-001",
            tone: "warn",
            inspectable: true,
          },
          { label: "PO agreed", value: "$689.55", provenance: "PO-460035919" },
        ],
      },
      suggestions: [
        {
          type: "suggest_correction",
          data: { label: "Adjust to $689.55" },
          reasoning:
            "The PO note records a discounted price the invoice didn't apply.",
        },
        { type: "suggest_supplier", data: {} },
      ],
    },
    downstream: null,
  },

  "INV-77294": {
    id: "INV-77294",
    supplier: "Vertex Supplies Inc.",
    amount: "$3,180.00 USD",
    due: "May 29, 2026",
    poPill: { label: "PO-771140082", tone: "neutral" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-dup",
      severity: "amber",
      chip: "Possible duplicate",
      headline: "Invoice number was already paid",
      finding: {
        type: "single",
        items: [
          {
            label: "Prior payment",
            value: "Paid Apr 2, 2026",
            tone: "warn",
            provenance: "Payments ledger",
          },
        ],
      },
      suggestions: [
        {
          type: "verify",
          data: {},
          reasoning: "Amounts and dates differ from the prior run.",
        },
        { type: "route", data: { owner: "AP lead" } },
      ],
    },
    downstream: null,
  },

  "INV-48209": {
    id: "INV-48209",
    supplier: "Folio Systems",
    amount: "$7,620.00 USD",
    due: "May 29, 2026",
    poPill: { label: "PO-820044891", tone: "neutral" },
    agentHistory: DEFAULT_AGENT_HISTORY,
    exception: {
      id: "exc-newvendor",
      severity: "gray",
      chip: "New vendor",
      headline: "First invoice from an unverified vendor",
      finding: {
        type: "single",
        items: [
          {
            label: "Vendor record",
            value: "Not yet verified",
            tone: "muted",
            provenance: "Vendor master",
          },
        ],
      },
      suggestions: [
        {
          type: "verify",
          data: {},
          reasoning: "Banking details match the W-9 on file.",
        },
        { type: "route", data: { owner: "Vendor onboarding" } },
      ],
    },
    downstream: null,
  },
};

export function getReview(invoiceId: string): InvoiceReview {
  return invoiceReviewMap[invoiceId] ?? invoiceReviewMap["INV-84471"];
}

// --- Stubs (backend out of scope) ------------------------------------------

export function getSuggestions(exception: InvoiceException): Suggestion[] {
  return exception.suggestions;
}

/**
 * Stubbed re-validation after a gating exception is resolved. Resolves after a
 * short delay with the fixture's downstream result.
 */
export function revalidateException(
  invoiceId: string,
): Promise<{ cleared: number; surfaced: InvoiceException[] }> {
  const review = invoiceReviewMap[invoiceId];
  const downstream = review?.downstream;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        cleared: downstream?.passed ?? 0,
        surfaced: downstream?.surfaced ?? [],
      });
    }, 1600);
  });
}

/** Value-level "show me in the source" affordance. No-op stub for now. */
export function highlightInSource(ref: string): void {
  // eslint-disable-next-line no-console
  console.info(`[highlightInSource] ${ref}`);
}
