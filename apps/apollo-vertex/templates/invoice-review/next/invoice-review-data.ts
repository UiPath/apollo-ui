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

export type ExceptionStatus = "open" | "active" | "resolved" | "waiting";

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
  /**
   * fix = corrects the invoice/data and resolves the exception. route = hands off
   * to a supplier or data owner; it does not resolve, it parks the exception in a
   * waiting state until the corrected invoice/data returns. Derived from `type`
   * via isRouteSuggestion when absent, so fixtures need not set it.
   */
  kind?: "fix" | "route";
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
  /** recipient for a supplier correction email (prefills the draft modal) */
  vendorEmail: string;
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

/** A supplier email drafted and sent as the confirmation step of a supplier
 *  route. The snapshot is frozen at send and never re-derived (audit artifact). */
export interface SupplierEmailDraft {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  /** set at send; the recipient/subject/body above are frozen alongside it */
  sentTime?: string;
}

/** An exception parked by a routing action, awaiting a corrected invoice/data. */
export interface WaitingRef {
  id: string;
  /** who we are waiting on, e.g. "supplier", "procurement", "data owner" */
  waitingOn: string;
  /** the routing event title, e.g. "Asked supplier", "Routed to procurement" */
  label: string;
  /** the sent supplier email, when the route went through the draft modal */
  draft?: SupplierEmailDraft;
}

/**
 * Reviewer disposition of the whole invoice. Approved is a hard commit; held is
 * a reversible overlay (it never mutates the exception/waiting state beneath, so
 * Resume just clears it and the derived terminal returns). In v2/v3 this is the
 * SINGLE source for approve/hold; the template's completionMap/parkedMap are not
 * consulted for those (reject/flag stay legacy).
 */
export type InvoiceDisposition =
  | { type: "approved"; time: string }
  | { type: "held"; reason?: string; time: string };

/**
 * The unified timeline event log lives in the runtime store, so the whole
 * history survives remounts (freeze/restore leans on this). `RunEventInput` is a
 * variant without its key; the store assigns the key on append. Kinds:
 * - resolved: a fixed exception (reviewer or auto-cleared)
 * - waiting: a routed exception parked on an outside reply
 * - revalidated: a re-check result row
 * - followed-up: a reminder sent on a still-parked exception
 * - received: a corrected invoice/data arrival (return seam)
 * - disposition: an approve / hold / resume of the whole invoice
 */
export type RunEventInput =
  | {
      kind: "resolved";
      label: string;
      sub: string;
      time: string;
      shortLabel?: string;
      /** auto = cleared by a re-check, not resolved by the reviewer */
      auto?: boolean;
      /** the source exception (status resolved), for lossless row expansion */
      exception?: InvoiceException;
    }
  | {
      kind: "waiting";
      label: string;
      sub: string;
      time: string;
      shortLabel?: string;
      /** who we are waiting on, for the stamp line */
      waitingOn: string;
      /** the source exception (status waiting), for lossless row expansion */
      exception: InvoiceException;
      /** the sent supplier email, when the route went through the draft modal */
      draft?: SupplierEmailDraft;
    }
  | {
      kind: "revalidated";
      label: string;
      sub: string;
      time: string;
      pending: boolean;
    }
  | {
      /** a follow-up reminder sent for a still-parked exception (waiting unchanged) */
      kind: "followed-up";
      label: string;
      sub: string;
      time: string;
      exception: InvoiceException;
      draft: SupplierEmailDraft;
    }
  | {
      /** the return seam: a corrected invoice/data arrived for a parked exception */
      kind: "received";
      label: string;
      sub: string;
      time: string;
    }
  | {
      /** an approve / hold / resume of the whole invoice */
      kind: "disposition";
      label: string;
      sub: string;
      time: string;
    };

/** A logged event: an input plus the store-assigned key (intersection over the
 *  union distributes the key onto every variant, preserving the discriminant). */
export type RunEvent = RunEventInput & { key: string };

/** Runtime loop state for one invoice, shared across surfaces (see the store). */
export interface InvoiceRuntime {
  resolvedIds: string[];
  surfaced: InvoiceException[];
  /** exceptions parked in a waiting state by a routing action (not resolved) */
  waiting: WaitingRef[];
  /** invoice-data changes applied by resolutions (e.g. a linked PO) */
  dataPatch?: Partial<InvoiceReview>;
  /** reviewer disposition of the whole invoice (approve/hold); undefined = none */
  disposition?: InvoiceDisposition;
  /** the whole timeline event log, appended atomically inside the mutations */
  events: RunEvent[];
}

export function exceptionMeta(e: InvoiceException): {
  label: string;
  tone: ExceptionTone;
} {
  return EXCEPTION_META[e.type];
}

/**
 * Current open exceptions: fixtures + surfaced, minus resolved AND waiting, in
 * order. Waiting (routed) exceptions are neither resolved nor actionable, so
 * they drop out of the open set on every surface.
 */
export function openExceptions(
  review: InvoiceReview,
  runtime?: InvoiceRuntime,
): InvoiceException[] {
  const all = [...review.exceptions, ...(runtime?.surfaced ?? [])];
  const resolved = new Set(runtime?.resolvedIds ?? []);
  const waiting = new Set((runtime?.waiting ?? []).map((w) => w.id));
  return all.filter((e) => !resolved.has(e.id) && !waiting.has(e.id));
}

/**
 * The one place that answers "which exception do I show, how many more, and how
 * many are parked waiting". lead = first open exception by the ordering rule;
 * null when nothing is open. Waiting is reported separately so surfaces can show
 * a waiting state without ever counting it as resolved.
 */
export function getExceptionSummary(
  review: InvoiceReview,
  runtime?: InvoiceRuntime,
): {
  lead: InvoiceException | null;
  openCount: number;
  extraCount: number;
  waitingCount: number;
  waitingOn: string | null;
} {
  const open = openExceptions(review, runtime);
  const waiting = runtime?.waiting ?? [];
  return {
    lead: open[0] ?? null,
    openCount: open.length,
    extraCount: Math.max(0, open.length - 1),
    waitingCount: waiting.length,
    waitingOn: waiting[0]?.waitingOn ?? null,
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

// Routing actions hand off to a supplier or data owner. They change no data, so
// they do not resolve the exception: they park it in a waiting state until the
// corrected invoice/data returns. Kind is fully determined by type, so fixtures
// need not tag each suggestion (mirrors HOLD_TYPES / isHoldSuggestion).
const ROUTE_TYPES: ReadonlySet<SuggestionType> = new Set([
  "suggest_supplier",
  "suggest_email",
  "route",
]);

export function isRouteSuggestion(s: Suggestion): boolean {
  return (
    s.kind === "route" || (s.kind === undefined && ROUTE_TYPES.has(s.type))
  );
}

// Supplier-type routes go through the email draft modal (the message to the
// supplier IS the confirmation). Internal routes (route -> data owner, etc.)
// park directly with no modal.
const SUPPLIER_ROUTE_TYPES: ReadonlySet<SuggestionType> = new Set([
  "suggest_supplier",
  "suggest_email",
]);

export function isSupplierRoute(s: Suggestion): boolean {
  return SUPPLIER_ROUTE_TYPES.has(s.type);
}

/**
 * Body-generation seam for the supplier email draft (ported from v1's
 * generateDraftBody, sourced from the exception context instead of the legacy
 * detail model). Stubbed template; replace with a real drafting call.
 */
export function generateSupplierEmailBody(
  review: InvoiceReview,
  exception: InvoiceException,
): string {
  return [
    "Dear Accounts team,",
    "",
    `We are writing regarding Invoice ${review.id}. On review we flagged an issue: ${exception.headline.toLowerCase()}.`,
    "",
    "Could you review and send a corrected invoice so we can complete processing? Please reference the invoice number above in your reply.",
    "",
    "Thank you for your prompt attention to this matter.",
    "",
    "Kind regards,",
    review.assignee.name,
  ].join("\n");
}

/**
 * Body seam for a follow-up nudge on an already-sent supplier request. Short,
 * references the original request, asks for status, same tone as the draft.
 */
export function generateFollowUpBody(
  review: InvoiceReview,
  original: SupplierEmailDraft,
): string {
  return [
    "Dear Accounts team,",
    "",
    `Following up on our request regarding Invoice ${review.id} ("${original.subject}"). We have not yet received the corrected invoice.`,
    "",
    "Could you share a status update, or send the corrected invoice at your earliest convenience?",
    "",
    "Thank you,",
    review.assignee.name,
  ].join("\n");
}

/**
 * The weekday a follow-up becomes socially appropriate: the send date plus two
 * business days, as a weekday name. Fixture copy. LANDING SLOT for real vendor
 * SLA data (replace with the supplier's actual response window).
 */
export function followUpWeekday(): string {
  const d = new Date();
  let added = 0;
  while (added < 2) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Waiting-state copy for a routing action: the row title ("Asked supplier" /
 * "Routed to procurement"), the sub, who we wait on, and a lowercase fragment
 * for the completion summary. Derived from the exception + chosen suggestion.
 */
export function routeMeta(
  exception: InvoiceException,
  suggestion: Suggestion,
): { title: string; sub: string; waitingOn: string; shortLabel: string } {
  const meta = EXCEPTION_META[exception.type];
  if (
    suggestion.type === "suggest_supplier" ||
    suggestion.type === "suggest_email"
  ) {
    return {
      title: "Asked supplier",
      sub: `${meta.label}, waiting on supplier`,
      waitingOn: "supplier",
      shortLabel: "asked supplier",
    };
  }
  const owner = (
    (suggestion.data.owner as string) ?? "data owner"
  ).toLowerCase();
  return {
    title: `Routed to ${owner}`,
    sub: `${meta.label}, waiting on ${owner}`,
    waitingOn: owner,
    shortLabel: `routed to ${owner}`,
  };
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
    vendorEmail: "accounts@acmesupply.co",
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
    vendorEmail: "ap@meridiangroup.com",
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
        resolution: {
          label: "Corrected to Apr 30, 2026",
          sub: "Outside PO period, resolved by you",
          shortLabel: "date corrected",
        },
      },
      highValueException("55832", "€22,500.00"),
    ],
  },

  // 3. VAT mismatch (lead) + High value (waiting).
  "INV-66216": {
    id: "INV-66216",
    supplier: "Prime Office Solutions",
    vendorEmail: "billing@primeoffice.com",
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
    vendorEmail: "hello@crestwood.co",
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
    vendorEmail: "accounts@northstar.com",
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
    vendorEmail: "accounts@acmeindustrial.com",
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
    vendorEmail: "ap@vertexsupplies.com",
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
    vendorEmail: "billing@foliosystems.com",
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

// --- Disposition seams (backend contract points) + event builders -----------
// The seams are where a real backend commit would happen; local state flows
// through the runtime store's setDisposition. The builders produce the matching
// disposition + timeline event so both Approve entry points (terminal + header)
// stay identical.

/** SEAM: hard-commit an approval (no undo in this prototype). */
export function approveInvoice(invoiceId: string): void {
  // eslint-disable-next-line no-console
  console.info(`[approveInvoice] ${invoiceId}`);
}

/** SEAM: park the invoice on a reviewer hold (reversible). */
export function holdInvoice(invoiceId: string, reason?: string): void {
  // eslint-disable-next-line no-console
  console.info(`[holdInvoice] ${invoiceId}${reason ? ` — ${reason}` : ""}`);
}

/** SEAM: lift a hold and return the invoice to its prior state. */
export function resumeInvoice(invoiceId: string): void {
  // eslint-disable-next-line no-console
  console.info(`[resumeInvoice] ${invoiceId}`);
}

export function buildApproval(review: InvoiceReview): {
  disposition: InvoiceDisposition;
  event: RunEventInput;
} {
  const time = "Just now";
  return {
    disposition: { type: "approved", time },
    event: {
      kind: "disposition",
      label: "Invoice approved",
      sub: `${review.amount} to ${review.supplier}`,
      time,
    },
  };
}

export function buildHold(
  review: InvoiceReview,
  reason?: string,
): { disposition: InvoiceDisposition; event: RunEventInput } {
  const time = "Just now";
  const trimmed = reason?.trim() || undefined;
  return {
    disposition: { type: "held", reason: trimmed, time },
    event: {
      kind: "disposition",
      label: "Put on hold",
      sub: trimmed ?? `${review.supplier} invoice`,
      time,
    },
  };
}

export function buildResume(): {
  disposition: null;
  event: RunEventInput;
} {
  return {
    disposition: null,
    event: {
      kind: "disposition",
      label: "Resumed review",
      sub: "",
      time: "Just now",
    },
  };
}

/**
 * SEAM CONTRACT (exception-resolution-loop workstream). The OUTBOUND leg: send
 * the drafted correction request to the supplier. Pairs with the inbound
 * receiveCorrectedInvoice below (the return leg).
 *
 * Input: invoice id, the parked exception id, and the drafted email (recipient,
 *   subject, and the body snapshot as reviewed).
 * Output: a send receipt (message id + send time). The caller freezes the draft
 *   onto the waiting record so the sent message stays the audit artifact.
 *
 * Stubbed: resolves after ~600ms with a synthetic receipt.
 */
export function sendSupplierEmail(
  invoiceId: string,
  exceptionId: string,
  draft: SupplierEmailDraft,
): Promise<{ id: string; sentTime: string }> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          id: `${invoiceId}-${exceptionId}-msg`,
          sentTime: "just now",
        }),
      600,
    );
  });
}

/**
 * SEAM CONTRACT (exception-resolution-loop workstream, owner: Thomas).
 *
 * The return path for a parked (waiting) exception: the point where a supplier
 * or data owner sends back the corrected invoice/data.
 *
 * Input: the invoice id and the parked exception id (in a real build, also the
 *   returned document/data itself).
 * Output: the corrected `document` reference, plus a `revalidation` result from
 *   re-running validation against the now-changed data. `revalidation.cleared`
 *   lists exception ids the correction resolves (including the reopened one when
 *   the correction fixes it); `revalidation.surfaced` lists any new exceptions
 *   the honest re-check turns up. The caller reopens the exception (waiting ->
 *   open), refreshes its finding from the document, then drives the standard
 *   re-validation choreography with this result.
 *
 * Stubbed: resolves after ~1.2s, returning a corrected document id and a
 * re-validation that clears the reopened exception (the correction fixes it).
 */
export function receiveCorrectedInvoice(
  invoiceId: string,
  exceptionId: string,
): Promise<{
  document: string;
  revalidation: { cleared: string[]; surfaced: InvoiceException[] };
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        document: `${invoiceId}-R1`,
        revalidation: { cleared: [exceptionId], surfaced: [] },
      });
    }, 1200);
  });
}
