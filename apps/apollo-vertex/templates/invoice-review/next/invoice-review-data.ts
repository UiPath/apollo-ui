// Single source of truth for the invoice-review surfaces (queue rail, invoices
// table, and the workspace). Every surface derives from these InvoiceReview
// records so an invoice is never described differently in two places.
//
// An invoice can surface MULTIPLE exceptions at once (invoice-level and
// line-level). Exactly one is "live" (the anchor); the rest are compact
// read-only waiting rows. After each fix, validation re-runs
// (revalidateException) and may clear items or surface new ones.
//
// Agent behavior is fully stubbed (see the stubs at the bottom).

// --- Canonical exception dictionary ----------------------------------------
// One label and one tone per exception type, used verbatim on every surface.
// Tone is the Badge status; every surface renders variant="secondary".

export type ExceptionType =
  | "missing-po"
  | "price-mismatch"
  | "total-mismatch"
  | "billing-account"
  | "vat-mismatch"
  | "duplicate"
  | "high-value"
  | "outside-po-period"
  | "qty-mismatch"
  | "tax-mismatch"
  | "new-vendor"
  | "no-exchange-rate";

export type ExceptionTone = "error" | "warning" | "info";

export const EXCEPTION_META: Record<
  ExceptionType,
  { label: string; tone: ExceptionTone }
> = {
  "missing-po": { label: "Missing PO", tone: "error" },
  "price-mismatch": { label: "Price mismatch", tone: "error" },
  "total-mismatch": { label: "Total mismatch", tone: "error" },
  "billing-account": { label: "Billing account not found", tone: "error" },
  "vat-mismatch": { label: "VAT mismatch", tone: "warning" },
  duplicate: { label: "Duplicate", tone: "warning" },
  "high-value": { label: "High value", tone: "warning" },
  "outside-po-period": { label: "Outside PO period", tone: "warning" },
  "qty-mismatch": { label: "Qty mismatch", tone: "warning" },
  "tax-mismatch": { label: "Tax mismatch", tone: "warning" },
  "new-vendor": { label: "New vendor", tone: "info" },
  "no-exchange-rate": { label: "No exchange rate", tone: "info" },
};

// --- Invoice status --------------------------------------------------------

export type InvoiceStatus =
  | "pending-review"
  | "in-review"
  | "sent-for-approval"
  | "approved"
  | "rejected"
  | "auto-approved";

export const STATUS_META: Record<
  InvoiceStatus,
  { label: string; tone: "warning" | "info" | "success" | "error" | undefined }
> = {
  "pending-review": { label: "Pending review", tone: "warning" },
  "in-review": { label: "In review", tone: "info" },
  "sent-for-approval": { label: "Sent for approval", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
  "auto-approved": { label: "Auto-approved", tone: undefined },
};

export type ExceptionScope =
  | { level: "invoice" }
  | { level: "line"; line: number };

/** initial = present at escalation; revalidation = surfaced by a re-check. */
export type ExceptionOrigin = "initial" | "revalidation";

export type ExceptionStatus = "open" | "active" | "resolved";

export interface ExceptionResolution {
  label: string;
  sub: string;
  time?: string;
  /** lowercase fragment for the completion summary, e.g. "PO-5123 linked" */
  shortLabel?: string;
  /** invoice-data changes to apply to the shared record on commit */
  dataPatch?: Partial<InvoiceReview>;
}

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
  /** canonical type; label + tone come from EXCEPTION_META */
  type: ExceptionType;
  headline: string;
  finding: Finding;
  /** [0] = primary resolution; empty = judgment call (no fix, resolve via header) */
  suggestions: Suggestion[];
  /** shown instead of a fix card for judgment calls */
  reasoning?: string;
  scope: ExceptionScope;
  origin: ExceptionOrigin;
  status: ExceptionStatus;
  /** confirmation copy once resolved; a sensible default is derived if absent */
  resolution?: ExceptionResolution;
}

export interface AgentStep {
  title: string;
  sub: string;
  time: string;
  /** the escalation handoff to the reviewer */
  handoff?: boolean;
}

export interface InvoiceAssignee {
  name: string;
  initials: string;
}

export interface InvoiceReview {
  id: string;
  supplier: string;
  amount: string;
  due: string;
  poPill: { label: string; tone: "red" | "neutral" };
  /** linked purchase order, if any (shown in the header + Details panel) */
  purchaseOrder?: string;
  assignee: InvoiceAssignee;
  status: InvoiceStatus;
  agentHistory: AgentStep[];
  /** ordered: invoice-level first, then by line, then loop-surfaced (append) */
  exceptions: InvoiceException[];
  /** what a re-check reports for this invoice; consumed once, then deduped */
  revalidation?: { cleared: string[]; surfaced: InvoiceException[] };
}

/** Runtime loop state for one invoice, shared across surfaces (see the store). */
export interface InvoiceRuntime {
  resolvedIds: string[];
  surfaced: InvoiceException[];
  /** invoice-data changes applied by resolutions (e.g. a linked PO) */
  dataPatch?: Partial<InvoiceReview>;
}

export function exceptionMeta(e: InvoiceException): {
  label: string;
  tone: ExceptionTone;
} {
  return EXCEPTION_META[e.type];
}

/** Current open exceptions: fixtures + surfaced, minus resolved, in order. */
export function openExceptions(
  review: InvoiceReview,
  runtime?: InvoiceRuntime,
): InvoiceException[] {
  const all = [...review.exceptions, ...(runtime?.surfaced ?? [])];
  const resolved = new Set(runtime?.resolvedIds ?? []);
  return all.filter((e) => !resolved.has(e.id));
}

/**
 * The one place that answers "which exception do I show, and how many more".
 * lead = first open exception by the ordering rule; null when all resolved.
 */
export function getExceptionSummary(
  review: InvoiceReview,
  runtime?: InvoiceRuntime,
): { lead: InvoiceException | null; openCount: number; extraCount: number } {
  const open = openExceptions(review, runtime);
  return {
    lead: open[0] ?? null,
    openCount: open.length,
    extraCount: Math.max(0, open.length - 1),
  };
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

const REVIEWER: InvoiceAssignee = { name: "Peter Vachon", initials: "PV" };

// --- Resolution helpers ----------------------------------------------------
// Which resolutions clear the path vs. end on an external hold. A hold means the
// timeline waits on an outside reply.
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
      return (s.data.label as string) ?? "Set GL account";
    case "suggest_tax_code":
      return "Apply tax code";
    case "suggest_email":
      return "Draft to supplier";
    case "suggest_supplier":
      return "Ask supplier";
    case "verify":
      return (s.data.label as string) ?? "Mark verified";
    case "route":
      return (s.data.label as string) ?? "Route to data owner";
    case "retry":
      return "Retry extraction";
    case "wait":
      return "Hold for rate";
    default:
      return "Resolve";
  }
}

export function scopeLabel(scope: ExceptionScope): string {
  return scope.level === "invoice" ? "Invoice level" : `Line ${scope.line}`;
}

// A high-value review reason is a judgment call, not a data fix: it belongs in
// exceptions[] (warning tone) with review actions, not as a mere property.
function highValueException(
  idSuffix: string,
  amount: string,
): InvoiceException {
  return {
    id: `exc-${idSuffix}-high-value`,
    type: "high-value",
    headline: "High-value invoice flagged for a second look",
    scope: { level: "invoice" },
    origin: "initial",
    status: "open",
    finding: {
      type: "single",
      items: [
        {
          label: "Invoice total",
          value: amount,
          tone: "warn",
          provenance: "This invoice",
        },
      ],
    },
    suggestions: [
      {
        type: "verify",
        data: { label: "Mark reviewed" },
        reasoning:
          "The amount is above the auto-approve threshold, so it needs a human sign-off.",
      },
      {
        type: "route",
        data: { owner: "Approver", label: "Route to approver" },
      },
    ],
    resolution: {
      label: "Marked reviewed",
      sub: "High value, resolved by you",
      shortLabel: "high value reviewed",
    },
  };
}

// --- Fixtures --------------------------------------------------------------
// One InvoiceReview per queue invoice. Most stay single so the stack reads as
// the exception, not the norm. INV-84471 is the loop hero; INV-60118 is the
// multi-open hero.

// Surfaced by INV-84471's re-check after the PO is linked.
const ACME_PRICE_LINE2: InvoiceException = {
  id: "exc-acme-price-l2",
  type: "price-mismatch",
  headline: "Unit price is 12% above PO-5123 on line 2",
  scope: { level: "line", line: 2 },
  origin: "revalidation",
  status: "open",
  finding: {
    type: "compare",
    sides: [
      {
        label: "Invoiced",
        value: "$1,344.00",
        provenance: "INV-84471 line 2",
        tone: "warn",
        inspectable: true,
      },
      { label: "PO-5123", value: "$1,200.00", provenance: "Coupa" },
    ],
  },
  suggestions: [
    {
      type: "suggest_correction",
      data: { label: "Accept amended price" },
      reasoning:
        "The PO was amended on May 2. The new unit price matches this invoice.",
    },
    { type: "suggest_supplier", data: {} },
  ],
  resolution: {
    label: "Accepted amended price",
    sub: "Price mismatch on line 2, resolved by you",
    shortLabel: "amended price accepted",
  },
};

const ACME_TAX: InvoiceException = {
  id: "exc-acme-tax",
  type: "tax-mismatch",
  headline: "Tax on the invoice doesn't match the PO tax code",
  scope: { level: "invoice" },
  origin: "revalidation",
  status: "open",
  finding: {
    type: "compare",
    sides: [
      {
        label: "On invoice",
        value: "$734.40",
        provenance: "INV-84471",
        tone: "warn",
        inspectable: true,
      },
      { label: "PO tax code", value: "$612.00", provenance: "PO-5123" },
    ],
  },
  suggestions: [
    {
      type: "verify",
      data: {},
      reasoning: "The invoice applies 6% tax; PO-5123 uses tax code E1 at 5%.",
    },
    { type: "route", data: { owner: "Tax data owner" } },
  ],
  resolution: {
    label: "Marked verified",
    sub: "Tax mismatch, resolved by you",
    shortLabel: "tax verified",
  },
};

const invoiceReviewMap: Record<string, InvoiceReview> = {
  // 1. Loop hero: one Missing PO -> Link PO -> re-check surfaces 2 new issues.
  "INV-84471": {
    id: "INV-84471",
    supplier: "Acme Supply Co.",
    amount: "$12,240.00 USD",
    due: "May 28, 2026",
    poPill: { label: "No PO", tone: "red" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-missing-po",
        type: "missing-po",
        headline: "Facility supplies submitted without a purchase order",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
        resolution: {
          label: "Linked PO-5123",
          sub: "Missing PO, resolved by you",
          shortLabel: "PO-5123 linked",
          dataPatch: {
            poPill: { label: "PO-5123", tone: "neutral" },
            purchaseOrder: "PO-5123",
          },
        },
      },
    ],
    revalidation: { cleared: [], surfaced: [ACME_PRICE_LINE2, ACME_TAX] },
  },

  // 2. Outside PO period (lead) + High value (waiting).
  "INV-55832": {
    id: "INV-55832",
    supplier: "Meridian Group",
    amount: "€22,500.00 EUR",
    due: "May 29, 2026",
    poPill: { label: "PO-558120044", tone: "neutral" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-po-period",
        type: "outside-po-period",
        headline: "Invoice date falls outside the PO's valid window",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
      highValueException("55832", "€22,500.00"),
    ],
  },

  // 3. VAT mismatch (lead) + High value (waiting).
  "INV-66216": {
    id: "INV-66216",
    supplier: "Prime Office Solutions",
    amount: "$65,800.00 USD",
    due: "May 28, 2026",
    poPill: { label: "PO-820044712", tone: "neutral" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-vat",
        type: "vat-mismatch",
        headline: "VAT number does not match the supplier record",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
      highValueException("66216", "$65,800.00"),
    ],
  },

  // 4. Multi-open hero: 3 exceptions at once; first fix re-checks clean.
  "INV-60118": {
    id: "INV-60118",
    supplier: "Crestwood Co.",
    amount: "$940.00 USD",
    due: "May 29, 2026",
    poPill: { label: "No PO", tone: "red" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-billing-account",
        type: "billing-account",
        headline: "Billing account on this invoice doesn't exist in NetSuite",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
        finding: {
          type: "single",
          items: [
            {
              label: "Billing account",
              value: "Not found",
              tone: "warn",
              provenance: "NetSuite",
            },
          ],
        },
        suggestions: [
          {
            type: "suggest_account",
            data: { label: "Use account 4020", account: "4020" },
            reasoning:
              "Account 4020, Facilities, received the last 6 invoices from this vendor.",
          },
          { type: "route", data: { owner: "Data owner" } },
        ],
        resolution: {
          label: "Account 4020 applied",
          sub: "Billing account not found, resolved by you",
          shortLabel: "account 4020 applied",
        },
      },
      {
        id: "exc-60118-missing-po",
        type: "missing-po",
        headline: "No purchase order linked to this invoice",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
            type: "suggest_supplier",
            data: {},
            reasoning:
              "No PO matches this vendor and amount. The supplier can confirm which PO to bill against.",
          },
          { type: "route", data: { owner: "Procurement" } },
        ],
        resolution: {
          label: "Sent to procurement",
          sub: "Missing PO, resolved by you",
          shortLabel: "sent to procurement",
        },
      },
      {
        id: "exc-60118-qty",
        type: "qty-mismatch",
        headline: "Quantity billed exceeds goods received on line 5",
        scope: { level: "line", line: 5 },
        origin: "initial",
        status: "open",
        finding: {
          type: "compare",
          sides: [
            {
              label: "Billed",
              value: "48 units",
              provenance: "INV-60118 line 5",
              tone: "warn",
              inspectable: true,
            },
            { label: "Received", value: "40 units", provenance: "GRN" },
          ],
        },
        suggestions: [
          {
            type: "verify",
            data: {},
            reasoning:
              "A partial receipt is expected; the balance ships next week.",
          },
          { type: "route", data: { owner: "Receiving" } },
        ],
        resolution: {
          label: "Marked verified",
          sub: "Quantity mismatch on line 5, resolved by you",
          shortLabel: "quantity verified",
        },
      },
    ],
    // Calm path: the first fix re-checks clean.
    revalidation: { cleared: [], surfaced: [] },
  },

  // 5. No exchange rate (lead) + High value (waiting).
  "INV-91003": {
    id: "INV-91003",
    supplier: "NorthStar LLC",
    amount: "£8,750.00 GBP",
    due: "May 28, 2026",
    poPill: { label: "PO-NL-20250093", tone: "neutral" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-fx",
        type: "no-exchange-rate",
        headline: "No GBP to USD rate available for the invoice date",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
      highValueException("91003", "£8,750.00"),
    ],
  },

  // --- Simple singles for the remaining queue rows -------------------------
  "INV-GRN-001": {
    id: "INV-GRN-001",
    supplier: "ACME Industrial",
    amount: "$694.39 USD",
    due: "May 28, 2026",
    poPill: { label: "PO-460035919", tone: "neutral" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-price",
        type: "price-mismatch",
        headline: "USB hub invoiced above the agreed price",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
            {
              label: "PO agreed",
              value: "$689.55",
              provenance: "PO-460035919",
            },
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
    ],
  },

  "INV-77294": {
    id: "INV-77294",
    supplier: "Vertex Supplies Inc.",
    amount: "$3,180.00 USD",
    due: "May 29, 2026",
    poPill: { label: "PO-771140082", tone: "neutral" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-dup",
        type: "duplicate",
        headline: "Invoice number was already paid",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
    ],
  },

  "INV-48209": {
    id: "INV-48209",
    supplier: "Folio Systems",
    amount: "$7,620.00 USD",
    due: "May 29, 2026",
    poPill: { label: "PO-820044891", tone: "neutral" },
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-newvendor",
        type: "new-vendor",
        headline: "First invoice from an unverified vendor",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
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
    ],
  },
};

/** All review records, queue order. Queue/table/workspace all read from here. */
export const invoiceReviews: InvoiceReview[] = Object.values(invoiceReviewMap);

export function getReview(invoiceId: string): InvoiceReview {
  return invoiceReviewMap[invoiceId] ?? invoiceReviewMap["INV-84471"];
}

/** Membership lookup: undefined for ids that aren't real review records. */
export function findReview(invoiceId: string): InvoiceReview | undefined {
  return invoiceReviewMap[invoiceId];
}

// --- Stubs (backend out of scope) ------------------------------------------

export function getSuggestions(exception: InvoiceException): Suggestion[] {
  return exception.suggestions;
}

/**
 * Stubbed re-validation after a fix. Resolves after ~1.2s with the invoice's
 * revalidation result. The caller dedupes surfaced items by id, so calling this
 * again after everything is already surfaced reports nothing new.
 */
export function revalidateException(
  invoiceId: string,
): Promise<{ cleared: string[]; surfaced: InvoiceException[] }> {
  const reval = invoiceReviewMap[invoiceId]?.revalidation;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        cleared: reval?.cleared ?? [],
        surfaced: reval?.surfaced ?? [],
      });
    }, 1200);
  });
}

/** Value-level "show me in the source" affordance. No-op stub for now. */
export function highlightInSource(ref: string): void {
  // eslint-disable-next-line no-console
  console.info(`[highlightInSource] ${ref}`);
}
