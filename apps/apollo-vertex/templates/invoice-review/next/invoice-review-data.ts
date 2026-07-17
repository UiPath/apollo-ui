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
  | "goods-not-received"
  | "qty-over-invoiced"
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
  "goods-not-received": { label: "Goods not received", tone: "error" },
  "qty-over-invoiced": { label: "Quantity over-invoiced", tone: "warning" },
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
  /**
   * For suggest_correction: the typed write-through payload. The store applies
   * this to detailCorrections when the suggestion is resolved. When data.label
   * is absent, suggestionLabel derives the button copy from this field — single
   * source of truth for the corrected value.
   * For verify: names the field(s) being attested so the aim ring can target
   * them. The value in the correction is the invoice value being confirmed, not
   * an incoming change — it is never written on commit.
   */
  correction?: DetailCorrections;
  /**
   * Per-suggestion event copy. When present, overrides the parent exception's
   * resolution.label / .sub / .shortLabel for the event that fires when THIS
   * suggestion commits. Lets two suggestions on the same exception produce
   * different timeline events (e.g. "Corrected VAT" vs "Kept invoice VAT").
   */
  resolution?: Pick<ExceptionResolution, "label" | "sub" | "shortLabel">;
}

export interface InvoiceException {
  id: string;
  /** canonical type; label + tone come from EXCEPTION_META */
  type: ExceptionType;
  headline: string;
  /** Up Next synthesis: what's wrong + magnitude, ≤45 chars. Falls back to type label when absent or too long. */
  synthesis?: string;
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
  /**
   * SEAM: stable anchor ids for the source-document regions this exception
   * implicates ("field:vat", "line:1:unit-price", "field:total"). The anchor id
   * is the contract: the demo renders these onto the mock document, but a real
   * backend resolves the same ids to regions on the actual PDF. Absent = the
   * disputed value isn't on the invoice document (no "Show in source" action).
   */
  sourceAnchors?: string[];
  /**
   * SEAM: edit-form reference annotation. When this exception implicates a
   * specific editable field, this object carries the system-of-record value the
   * reviewer should correct toward, so the edit form can surface it inline.
   * fieldKey uses dot-path notation: "vatNumber", "documentDate",
   * "lineItems.<0-indexed-line>.<field>".
   */
  reference?: {
    fieldKey: string;
    label: string;
    value: string;
    source: string;
  };
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
  /** seam for the rollup card (section C): present only when a single root cause explains all findings */
  rootCause?: { summary: string; secondaryLine: string; poReceiptDate: string };
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

/** Corrections to a single extracted line item. */
export interface LineCorrection {
  qty?: number;
  amount?: string;
  unitPrice?: string;
  description?: string;
}

/**
 * Human-authored corrections to extracted invoice fields. Applied over the
 * base detailDataMap entry; unset keys fall through to the original value.
 * `lines` is 1-indexed to match the panel's line numbering.
 */
export interface DetailCorrections {
  vendor?: string;
  vendorEmail?: string;
  vendorAddress?: string;
  billTo?: string;
  billAddress?: string;
  po?: string;
  paymentTerms?: string;
  vat?: string;
  documentDateFormatted?: string;
  dueFormatted?: string;
  servicePeriod?: string;
  billingAccount?: string;
  lines?: Record<number, LineCorrection>;
}

/** Minimal base-data shape required for running resolution predicates. */
export interface PredicateBaseData {
  vat?: string;
  lines?: Array<{ qty?: number; poQty?: number }>;
}

/** An exception parked by a routing action, awaiting a corrected invoice/data. */
export interface WaitingRef {
  id: string;
  /** who we are waiting on: "supplier", or an internal owner's name */
  waitingOn: string;
  /** the internal owner's role (internal routes only), for the summary line */
  waitingRole?: string;
  /** the routing event title, e.g. "Asked supplier", "Routed to Sarah Chen" */
  label: string;
  /** the sent supplier email, when the route went through the draft modal */
  draft?: SupplierEmailDraft;
}

/** A named internal handoff recipient (colleague), not a bare role string. */
export interface RouteOwner {
  name: string;
  role: string;
}

/**
 * Reviewer disposition of the whole invoice. Approved and rejected are hard,
 * permanent commits (no undo); held is a reversible overlay (it never mutates
 * the exception/waiting state beneath, so Resume just clears it and the derived
 * terminal returns). Rejected supersedes whatever was underneath (live, waiting,
 * passed) and ends the review. In v2/v3 this is the SINGLE source for
 * approve/hold/reject; the template's completionMap/parkedMap are not consulted
 * for those (flag stays legacy).
 */
export type InvoiceDisposition =
  | { type: "approved"; time: string }
  | { type: "held"; reason?: string; time: string }
  | { type: "rejected"; reason?: string; note?: string; time: string };

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
 * - corrected: a human-authored field correction (edit mode or fix-action write-through)
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
      /** the selected reason chip (internal routes), for the expanded detail */
      reason?: string;
      /** the reviewer's optional handoff note (internal routes) */
      note?: string;
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
      /** who took the action, stated (not inferred) so the row picks the right
       *  marker: reviewer dispositions get the person marker, not the AI sparkle */
      actor: "reviewer" | "agent";
      /** the reviewer's optional note (hold), for the expanded detail */
      note?: string;
    }
  | {
      /** a human-authored correction to an extracted field */
      kind: "corrected";
      label: string;
      sub: string;
      time: string;
    };

/** A logged event: an input plus the store-assigned key (intersection over the
 *  union distributes the key onto every variant, preserving the discriminant). */
export type RunEvent = RunEventInput & { key: string };

/**
 * A "show in source" request: the anchors to highlight in the source document,
 * the exception they belong to (so a stale highlight clears when it stops being
 * live), and a nonce bumped on every request so a repeat click re-scrolls and
 * re-pulses even when the anchors are unchanged.
 */
export interface SourceHighlight {
  anchors: string[];
  exceptionId: string;
  nonce: number;
}

/** Runtime loop state for one invoice, shared across surfaces (see the store). */
export interface InvoiceRuntime {
  resolvedIds: string[];
  surfaced: InvoiceException[];
  /** exceptions parked in a waiting state by a routing action (not resolved) */
  waiting: WaitingRef[];
  /** invoice-data changes applied by resolutions (e.g. a linked PO) */
  dataPatch?: Partial<InvoiceReview>;
  /** human-authored corrections to the extracted detail record (panel fields + line items) */
  detailCorrections?: DetailCorrections;
  /** reviewer disposition of the whole invoice (approve/hold); undefined = none */
  disposition?: InvoiceDisposition;
  /** the whole timeline event log, appended atomically inside the mutations */
  events: RunEvent[];
  /** pending "show in source" request; validity is derived (live exception) */
  highlight?: SourceHighlight;
  /** field-focus highlight from the edit form — takes priority over exception highlights */
  fieldHighlight?: { anchor: string; nonce: number };
  /** Transient correction pulse set atomically by correctDetail; drives settle animations. */
  correctionPulse?: {
    nonce: number;
    /** Scalar detail field keys that changed (e.g. "vat", "documentDateFormatted"). */
    detailFields: readonly string[];
    /** 1-based line numbers with qty corrections. */
    lineNums: readonly number[];
    /** Exception IDs auto-cleared by predicate re-run in this batch. */
    autoResolvedIds: readonly string[];
  };
  /** Transient aim state: set while a mutating fix action is hovered/focused. */
  aimCorrection?: DetailCorrections;
  /**
   * Snapshot captured by correctDetail before the merge: enables one-step undo.
   * Cleared by revertDetail or by the next correctDetail call.
   */
  undoTarget?: {
    prevDetailCorrections: DetailCorrections | undefined;
    autoResolvedIds: readonly string[];
  };
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

/**
 * Resolution predicate: returns true if the finding still holds given the
 * corrections applied, false if the finding is now satisfied (auto-resolve).
 */
export type ResolutionPredicate = (
  exception: InvoiceException,
  corrections: DetailCorrections,
  base: PredicateBaseData,
) => boolean;

/**
 * Registry of resolution predicates keyed by exception type. Only registered
 * types are evaluated; unregistered types are left open by default. Extend by
 * adding an entry — no other code changes needed.
 */
export const RESOLUTION_PREDICATES: Partial<
  Record<ExceptionType, ResolutionPredicate>
> = {
  "qty-over-invoiced": (exc, corrections) => {
    if (exc.scope.level !== "line") return true;
    const lineNum = exc.scope.line; // 1-indexed
    const correctedQty = corrections.lines?.[lineNum]?.qty;
    // PO qty is the non-warn side of the finding — no separate base needed.
    const poQtyStr = exc.finding.sides?.find((s) => s.tone !== "warn")?.value;
    if (correctedQty === undefined || poQtyStr === undefined) return true;
    const poQty = parseInt(poQtyStr, 10);
    if (Number.isNaN(poQty)) return true;
    return correctedQty > poQty;
  },
  "vat-mismatch": (exc, corrections, base) => {
    const correctedVat = corrections.vat ?? base.vat;
    const expectedVat = exc.finding.sides?.find(
      (s) => s.tone !== "warn",
    )?.value;
    if (correctedVat === undefined || expectedVat === undefined) return true;
    return correctedVat !== expectedVat;
  },
  // Any explicit date correction clears the outside-period flag: the reviewer
  // has acknowledged and corrected the date, which is all we can verify here.
  "outside-po-period": (_exc, corrections) =>
    corrections.documentDateFormatted === undefined,
  // Any explicit account correction clears the missing-account flag.
  "billing-account": (_exc, corrections) =>
    corrections.billingAccount === undefined,
};

/**
 * Run all registered predicates against a set of open exceptions. Returns the
 * ids of exceptions whose finding is now satisfied (should auto-resolve).
 */
export function runPredicates(
  openExceptions: InvoiceException[],
  corrections: DetailCorrections,
  base: PredicateBaseData,
): { cleared: string[] } {
  const cleared = openExceptions
    .filter((exc) => {
      const predicate = RESOLUTION_PREDICATES[exc.type];
      return predicate !== undefined && !predicate(exc, corrections, base);
    })
    .map((exc) => exc.id);
  return { cleared };
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

/**
 * Returns the DetailCorrections payload used to drive the aim ring while an
 * action is hovered/focused. Three tiers:
 *   - route / wait: null — no ring, no ghost.
 *   - verify (attestation): ring fires on each attested field, but the values
 *     are empty-string sentinels so aimGhost returns "" (falsy) and the "→ X"
 *     arrow is suppressed. The ring means "this value is what's being attested."
 *   - suggest_correction / others: full correction payload — ring + ghost.
 */
export function suggestionAimCorrection(
  s: Suggestion,
): DetailCorrections | null {
  if (isRouteSuggestion(s) || s.type === "wait") return null;
  if (s.type === "verify" && s.correction) {
    const aimKeys = Object.keys(s.correction).filter((k) => k !== "lines");
    if (aimKeys.length === 0) return {};
    return Object.fromEntries(aimKeys.map((k) => [k, ""])) as DetailCorrections;
  }
  return s.correction ?? {};
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

// Internal routes hand off to a named colleague, never a bare role string. The
// fixture role string (data.owner) is the lookup key; the resolver always
// returns a RouteOwner, so no route can surface a lowercased role like
// "ap lead". Add a row here when a fixture introduces a new route target.
const DEFAULT_ROUTE_OWNER: RouteOwner = { name: "Sarah Chen", role: "AP lead" };

const ROUTE_OWNERS: Record<string, RouteOwner> = {
  "AP lead": { name: "Sarah Chen", role: "AP lead" },
  "Data owner": { name: "Sarah Chen", role: "AP lead" },
  Approver: { name: "Marcus Webb", role: "Finance approver" },
  "Tax data owner": { name: "Priya Nair", role: "Tax data owner" },
  "Vendor data owner": { name: "Diego Alvarez", role: "Vendor data owner" },
  Procurement: { name: "Tom Fletcher", role: "Procurement lead" },
  Receiving: { name: "Ana Duarte", role: "Receiving lead" },
  "Vendor onboarding": { name: "Nadia Rahman", role: "Vendor onboarding" },
};

/**
 * Resolve an internal route suggestion to its named owner. Always returns a
 * RouteOwner (falls back to a named default), so no route parks against a bare
 * role string.
 */
export function routeOwner(suggestion: Suggestion): RouteOwner {
  const key = suggestion.data.owner as string | undefined;
  return (key ? ROUTE_OWNERS[key] : undefined) ?? DEFAULT_ROUTE_OWNER;
}

// Reason chips for the park-family dialogs (Hold, Route). Single-select, first
// preselected so one-click commit always works. Fixture-adjustable: tune per
// route type here when the reasons should differ by handoff target.
export const HOLD_REASONS = [
  "Awaiting supplier response",
  "Escalating to manager",
  "PO in progress",
  "Needs more info",
] as const;

export const ROUTE_REASONS = [
  "Data correction needed",
  "Ownership unclear",
  "Needs verification",
  "Other",
] as const;

export const FLAG_REASONS = [
  "Awaiting supplier response",
  "Escalating to manager",
  "PO in progress",
  "Needs more info",
] as const;

export const REJECT_REASONS = [
  "Incorrect price",
  "Wrong vendor",
  "Duplicate invoice",
  "No PO found",
  "Other",
] as const;

/**
 * Waiting-state copy for a routing action: the row title ("Asked supplier" /
 * "Routed to Sarah Chen"), the sub, who we wait on (and their role, for
 * internal routes), and a lowercase fragment for the completion summary.
 * Derived from the exception + chosen suggestion.
 */
export function routeMeta(
  exception: InvoiceException,
  suggestion: Suggestion,
): {
  title: string;
  sub: string;
  waitingOn: string;
  waitingRole?: string;
  shortLabel: string;
} {
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
  const owner = routeOwner(suggestion);
  return {
    title: `Routed to ${owner.name}`,
    sub: `${meta.label}, routed to ${owner.name}`,
    waitingOn: owner.name,
    waitingRole: owner.role,
    shortLabel: `routed to ${owner.name}`,
  };
}

export function suggestionLabel(s: Suggestion): string {
  switch (s.type) {
    case "suggest_po":
      return `Link ${(s.data.po as string) ?? "PO"}`;
    case "suggest_correction": {
      if (!s.data.label && s.correction?.lines) {
        const entries = Object.entries(s.correction.lines);
        if (entries.length > 0) {
          const lc = entries[0][1] as LineCorrection;
          if (lc.qty !== undefined) return `Adjust to ${lc.qty} units`;
        }
      }
      if (!s.data.label && s.correction?.documentDateFormatted) {
        return `Correct to ${s.correction.documentDateFormatted}`;
      }
      return (s.data.label as string) ?? "Apply correction";
    }
    case "suggest_account":
      return (s.data.label as string) ?? "Set GL account";
    case "suggest_tax_code":
      return "Apply tax code";
    case "suggest_email":
      return "Draft to supplier";
    case "suggest_supplier":
      return "Ask supplier";
    case "verify":
      return (s.data.label as string) ?? "Keep";
    case "route":
      return (s.data.label as string) ?? "Route to data owner";
    case "retry":
      return "Retry extraction";
    case "wait":
      return (s.data.label as string) ?? "Hold for rate";
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
        data: { label: `Keep ${amount}` },
        reasoning:
          "The amount is above the auto-approve threshold, so it needs a human sign-off.",
        resolution: {
          label: `Kept at ${amount}`,
          sub: "High value, approved by you",
          shortLabel: "high value approved",
        },
      },
      {
        type: "route",
        data: { owner: "Approver", label: "Route to approver" },
      },
    ],
    resolution: {
      label: `Kept at ${amount}`,
      sub: "High value, approved by you",
      shortLabel: "high value approved",
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
  synthesis: "Unit price $144 above PO rate",
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
      type: "verify",
      data: { label: "Keep amended price" },
      reasoning:
        "The PO was amended on May 2. The new unit price matches this invoice.",
      resolution: {
        label: "Kept amended price",
        sub: "PO was updated to match this invoice",
        shortLabel: "amended price kept",
      },
    },
    { type: "suggest_supplier", data: {} },
  ],
  resolution: {
    label: "Kept amended price",
    sub: "PO was updated to match this invoice",
    shortLabel: "amended price kept",
  },
};

const ACME_TAX: InvoiceException = {
  id: "exc-acme-tax",
  type: "tax-mismatch",
  headline: "Tax on the invoice doesn't match the PO tax code",
  synthesis: "Tax $122 above PO code (6% vs 5%)",
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
      data: { label: "Keep tax rate" },
      reasoning: "The invoice applies 6% tax; PO-5123 uses tax code E1 at 5%.",
      resolution: {
        label: "Kept invoice tax rate",
        sub: "6% rate confirmed by you",
        shortLabel: "tax rate kept",
      },
    },
    { type: "route", data: { owner: "Tax data owner" } },
  ],
  resolution: {
    label: "Kept invoice tax rate",
    sub: "6% rate confirmed by you",
    shortLabel: "tax rate kept",
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
        synthesis: "Facility supplies submitted without a PO",
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
        synthesis: "Invoice date fell outside PO window Apr 30",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
        sourceAnchors: ["field:invoice-date"],
        reference: {
          fieldKey: "documentDate",
          label: "PO window ends",
          value: "Apr 30, 2026",
          source: "PO-558120044",
        },
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
            data: {},
            reasoning:
              "The service period ends Apr 30; the invoice date looks like a billing lag.",
            correction: { documentDateFormatted: "Apr 30, 2026" },
          },
          { type: "suggest_supplier", data: {} },
        ],
        resolution: {
          label: "Corrected to Apr 30, 2026",
          sub: "Outside PO period, resolved by you",
          shortLabel: "date corrected",
        },
      },
      {
        ...highValueException("55832", "€22,500.00"),
        synthesis: "Total €22,500 exceeds auto-approve limit",
      },
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
        synthesis: "VAT on invoice doesn't match vendor record",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
        sourceAnchors: ["field:vat"],
        reference: {
          fieldKey: "vatNumber",
          label: "On file",
          value: "US-82-4470911",
          source: "Vendor master",
        },
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
            type: "suggest_correction",
            correction: { vat: "US-82-4470911" },
            data: { label: "Use vendor master" },
            reasoning:
              "Apply the vendor-master VAT number; the invoice value is one digit off.",
            resolution: {
              label: "Corrected VAT number",
              sub: "Applied vendor master value",
              shortLabel: "VAT corrected",
            },
          },
          {
            type: "verify",
            data: { label: "Keep invoice value" },
            correction: { vat: "US-82-4471200" },
            reasoning:
              "The invoice VAT is one digit off the record; likely a typo on the invoice.",
            resolution: {
              label: "Kept invoice VAT",
              sub: "Verified against vendor master",
              shortLabel: "invoice VAT kept",
            },
          },
          { type: "route", data: { owner: "Vendor data owner" } },
        ],
        resolution: {
          label: "Kept invoice VAT",
          sub: "Verified against vendor master",
          shortLabel: "invoice VAT kept",
        },
      },
      {
        ...highValueException("66216", "$65,800.00"),
        synthesis: "Total $65,800 exceeds auto-approve limit",
      },
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
        synthesis: "Billing account not found in NetSuite",
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
            correction: { billingAccount: "4020" },
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
        synthesis: "No PO linked to this invoice",
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
        headline: "Quantity billed exceeds goods received",
        synthesis: "Quantity billed exceeds goods received",
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
            data: { label: "Keep 48 units" },
            reasoning:
              "A partial receipt is expected; the balance ships next week.",
            resolution: {
              label: "Kept 48 units",
              sub: "Partial receipt accepted by you",
              shortLabel: "48 units kept",
            },
          },
          { type: "route", data: { owner: "Receiving" } },
        ],
        resolution: {
          label: "Kept 48 units",
          sub: "Partial receipt accepted by you",
          shortLabel: "48 units kept",
        },
      },
    ],
    // Calm path: the first fix re-checks clean.
    revalidation: { cleared: [], surfaced: [] },
  },

  // 5. Grouped state: 8 line-scoped findings across two types — goods-not-received (3) + qty-over-invoiced (5).
  "INV-30291": {
    id: "INV-30291",
    supplier: "CDW Netherlands",
    vendorEmail: "ap@cdw.nl",
    amount: "$18,400.00 USD",
    due: "May 30, 2026",
    poPill: { label: "PO-820051133", tone: "neutral" },
    purchaseOrder: "PO-820051133",
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    rootCause: {
      summary:
        "All 3 lines bill more than was received. The PO shows a partial delivery on July 9; remaining goods appear to be in transit.",
      secondaryLine:
        "Holding until the next receipt posts resolves all 8 findings if quantities match.",
      poReceiptDate: "July 9, 2026",
    },
    exceptions: [
      {
        id: "exc-30291-gnr-1",
        type: "goods-not-received",
        headline: "Line 1 billed but no goods receipt found",
        synthesis: "No goods receipt found",
        scope: { level: "line", line: 1 },
        origin: "initial",
        status: "open",
        finding: {
          type: "single",
          items: [
            {
              label: "Receipt status",
              value: "Not received",
              tone: "warn",
              provenance: "GRN",
            },
          ],
        },
        suggestions: [
          {
            type: "wait",
            data: { label: "Hold until receipt" },
            reasoning:
              "Goods are in transit; a receipt is expected by end of week.",
          },
          {
            type: "route",
            data: { owner: "Receiving", label: "Route to data owner" },
          },
        ],
        resolution: {
          label: "Held for receipt",
          sub: "Goods not received, resolved by you",
          shortLabel: "held for receipt",
        },
      },
      {
        id: "exc-30291-gnr-2",
        type: "goods-not-received",
        headline: "Line 2 billed but no goods receipt found",
        synthesis: "No goods receipt found",
        scope: { level: "line", line: 2 },
        origin: "initial",
        status: "open",
        finding: {
          type: "single",
          items: [
            {
              label: "Receipt status",
              value: "Not received",
              tone: "warn",
              provenance: "GRN",
            },
          ],
        },
        suggestions: [
          {
            type: "wait",
            data: { label: "Hold until receipt" },
            reasoning:
              "Same shipment as line 1; the July 9 receipt was partial.",
          },
          {
            type: "route",
            data: { owner: "Receiving", label: "Route to data owner" },
          },
        ],
        resolution: {
          label: "Held for receipt",
          sub: "Goods not received, resolved by you",
          shortLabel: "held for receipt",
        },
      },
      {
        id: "exc-30291-gnr-3",
        type: "goods-not-received",
        headline: "Line 3 billed but no goods receipt found",
        synthesis: "No goods receipt found",
        scope: { level: "line", line: 3 },
        origin: "initial",
        status: "open",
        finding: {
          type: "single",
          items: [
            {
              label: "Receipt status",
              value: "Not received",
              tone: "warn",
              provenance: "GRN",
            },
          ],
        },
        suggestions: [
          {
            type: "wait",
            data: { label: "Hold until receipt" },
            reasoning:
              "No receipt posted for this line; expected with the same delivery.",
          },
          {
            type: "route",
            data: { owner: "Receiving", label: "Route to data owner" },
          },
        ],
        resolution: {
          label: "Held for receipt",
          sub: "Goods not received, resolved by you",
          shortLabel: "held for receipt",
        },
      },
      {
        id: "exc-30291-qoi-1",
        type: "qty-over-invoiced",
        headline: "Quantity on line 1 exceeds the PO amount",
        synthesis: "Billed 2 units above PO",
        scope: { level: "line", line: 1 },
        origin: "initial",
        status: "open",
        reference: {
          fieldKey: "lineItems.0.qty",
          label: "PO qty",
          value: "10",
          source: "PO-820051133",
        },
        finding: {
          type: "compare",
          sides: [
            {
              label: "Billed",
              value: "12 units",
              provenance: "INV-30291 line 1",
              tone: "warn",
              inspectable: true,
            },
            { label: "PO qty", value: "10 units", provenance: "PO-820051133" },
          ],
        },
        suggestions: [
          {
            type: "suggest_correction",
            data: {},
            reasoning:
              "Billed 12 against PO qty 10; adjust or hold for the remaining receipt.",
            correction: { lines: { 1: { qty: 10 } } },
          },
          { type: "suggest_supplier", data: {} },
        ],
        resolution: {
          label: "Quantity adjusted",
          sub: "Quantity over-invoiced, resolved by you",
          shortLabel: "quantity adjusted",
        },
      },
      {
        id: "exc-30291-qoi-2",
        type: "qty-over-invoiced",
        headline: "Quantity on line 2 exceeds the PO amount",
        synthesis: "Billed 5 units above PO",
        scope: { level: "line", line: 2 },
        origin: "initial",
        status: "open",
        reference: {
          fieldKey: "lineItems.1.qty",
          label: "PO qty",
          value: "25",
          source: "PO-820051133",
        },
        finding: {
          type: "compare",
          sides: [
            {
              label: "Billed",
              value: "30 units",
              provenance: "INV-30291 line 2",
              tone: "warn",
              inspectable: true,
            },
            { label: "PO qty", value: "25 units", provenance: "PO-820051133" },
          ],
        },
        suggestions: [
          {
            type: "suggest_correction",
            data: {},
            reasoning:
              "Billed 30 against PO qty 25; adjust or hold for the remaining receipt.",
            correction: { lines: { 2: { qty: 25 } } },
          },
          { type: "suggest_supplier", data: {} },
        ],
        resolution: {
          label: "Quantity adjusted",
          sub: "Quantity over-invoiced, resolved by you",
          shortLabel: "quantity adjusted",
        },
      },
      {
        id: "exc-30291-qoi-2t",
        type: "qty-over-invoiced",
        headline: "Line 2 quantity also exceeds the 5% tolerance band",
        synthesis: "Billed 20% above PO tolerance",
        scope: { level: "line", line: 2 },
        origin: "initial",
        status: "open",
        finding: {
          type: "single",
          items: [
            {
              label: "Tolerance",
              value: "+20% (5% allowed)",
              tone: "warn",
              provenance: "PO-820051133 terms",
            },
          ],
        },
        suggestions: [
          {
            type: "verify",
            data: { label: "Keep +20% overage" },
            reasoning:
              "The billing tolerance is 5%; line 2 is 20% over the PO quantity.",
            resolution: {
              label: "Kept +20% overage",
              sub: "Tolerance breach accepted by you",
              shortLabel: "+20% overage kept",
            },
          },
        ],
        resolution: {
          label: "Kept +20% overage",
          sub: "Tolerance breach accepted by you",
          shortLabel: "+20% overage kept",
        },
      },
      {
        id: "exc-30291-qoi-3",
        type: "qty-over-invoiced",
        headline: "Quantity on line 3 exceeds the PO amount",
        synthesis: "Billed 5 units above PO",
        scope: { level: "line", line: 3 },
        origin: "initial",
        status: "open",
        reference: {
          fieldKey: "lineItems.2.qty",
          label: "PO qty",
          value: "20",
          source: "PO-820051133",
        },
        finding: {
          type: "compare",
          sides: [
            {
              label: "Billed",
              value: "25 units",
              provenance: "INV-30291 line 3",
              tone: "warn",
              inspectable: true,
            },
            { label: "PO qty", value: "20 units", provenance: "PO-820051133" },
          ],
        },
        suggestions: [
          {
            type: "suggest_correction",
            data: {},
            reasoning:
              "Billed 25 against PO qty 20; adjust or hold for the remaining receipt.",
            correction: { lines: { 3: { qty: 20 } } },
          },
          { type: "suggest_supplier", data: {} },
        ],
        resolution: {
          label: "Quantity adjusted",
          sub: "Quantity over-invoiced, resolved by you",
          shortLabel: "quantity adjusted",
        },
      },
      {
        id: "exc-30291-qoi-3t",
        type: "qty-over-invoiced",
        headline: "Line 3 quantity also exceeds the 5% tolerance band",
        synthesis: "Billed 25% above PO tolerance",
        scope: { level: "line", line: 3 },
        origin: "initial",
        status: "open",
        finding: {
          type: "single",
          items: [
            {
              label: "Tolerance",
              value: "+25% (5% allowed)",
              tone: "warn",
              provenance: "PO-820051133 terms",
            },
          ],
        },
        suggestions: [
          {
            type: "verify",
            data: { label: "Keep +25% overage" },
            reasoning:
              "The billing tolerance is 5%; line 3 is 25% over the PO quantity.",
            resolution: {
              label: "Kept +25% overage",
              sub: "Tolerance breach accepted by you",
              shortLabel: "+25% overage kept",
            },
          },
        ],
        resolution: {
          label: "Kept +25% overage",
          sub: "Tolerance breach accepted by you",
          shortLabel: "+25% overage kept",
        },
      },
    ],
  },

  // 7. Hybrid state: qty-over-invoiced (3, grouped) + price-mismatch (1, fallback — no synthesis).
  "INV-30292": {
    id: "INV-30292",
    supplier: "Falcon Procurement",
    vendorEmail: "ap@falconprocurement.com",
    amount: "€9,850.00 EUR",
    due: "May 31, 2026",
    poPill: { label: "PO-820051201", tone: "neutral" },
    purchaseOrder: "PO-820051201",
    assignee: REVIEWER,
    status: "pending-review",
    agentHistory: DEFAULT_AGENT_HISTORY,
    exceptions: [
      {
        id: "exc-30292-qoi-1",
        type: "qty-over-invoiced",
        headline: "Quantity on line 1 exceeds the PO amount",
        synthesis: "Line 1 billed 8 units above PO",
        scope: { level: "line", line: 1 },
        origin: "initial",
        status: "open",
        reference: {
          fieldKey: "lineItems.0.qty",
          label: "PO qty",
          value: "10",
          source: "PO-820051201",
        },
        finding: {
          type: "compare",
          sides: [
            {
              label: "Billed",
              value: "18 units",
              provenance: "INV-30292 line 1",
              tone: "warn",
              inspectable: true,
            },
            { label: "PO qty", value: "10 units", provenance: "PO-820051201" },
          ],
        },
        suggestions: [
          {
            type: "suggest_correction",
            data: { label: "Adjust to 10 units" },
            reasoning:
              "Billed 18 against PO qty 10; adjust or hold for a corrected invoice.",
          },
          { type: "suggest_supplier", data: {} },
        ],
        resolution: {
          label: "Quantity adjusted",
          sub: "Quantity over-invoiced, resolved by you",
          shortLabel: "quantity adjusted",
        },
      },
      {
        id: "exc-30292-qoi-3",
        type: "qty-over-invoiced",
        headline: "Quantity on line 3 exceeds the PO amount",
        synthesis: "Line 3 billed 5 units above PO",
        scope: { level: "line", line: 3 },
        origin: "initial",
        status: "open",
        reference: {
          fieldKey: "lineItems.2.qty",
          label: "PO qty",
          value: "10",
          source: "PO-820051201",
        },
        finding: {
          type: "compare",
          sides: [
            {
              label: "Billed",
              value: "15 units",
              provenance: "INV-30292 line 3",
              tone: "warn",
              inspectable: true,
            },
            { label: "PO qty", value: "10 units", provenance: "PO-820051201" },
          ],
        },
        suggestions: [
          {
            type: "suggest_correction",
            data: { label: "Adjust to 10 units" },
            reasoning:
              "Billed 15 against PO qty 10; adjust or hold for a corrected invoice.",
          },
          { type: "suggest_supplier", data: {} },
        ],
        resolution: {
          label: "Quantity adjusted",
          sub: "Quantity over-invoiced, resolved by you",
          shortLabel: "quantity adjusted",
        },
      },
      {
        id: "exc-30292-qoi-3t",
        type: "qty-over-invoiced",
        headline: "Line 3 quantity also exceeds the 5% tolerance band",
        synthesis: "Line 3 tolerance breach: +50%",
        scope: { level: "line", line: 3 },
        origin: "initial",
        status: "open",
        finding: {
          type: "single",
          items: [
            {
              label: "Tolerance",
              value: "+50% (5% allowed)",
              tone: "warn",
              provenance: "PO-820051201 terms",
            },
          ],
        },
        suggestions: [
          {
            type: "verify",
            data: { label: "Keep +50% overage" },
            reasoning:
              "The billing tolerance is 5%; line 3 is 50% over the PO quantity.",
            resolution: {
              label: "Kept +50% overage",
              sub: "Tolerance breach accepted by you",
              shortLabel: "+50% overage kept",
            },
          },
        ],
        resolution: {
          label: "Kept +50% overage",
          sub: "Tolerance breach accepted by you",
          shortLabel: "+50% overage kept",
        },
      },
      {
        id: "exc-30292-price-4",
        type: "price-mismatch",
        // No synthesis — exercises the Up Next fallback (renders type label instead).
        headline: "Unit price on line 4 does not match the PO rate",
        scope: { level: "line", line: 4 },
        origin: "initial",
        status: "open",
        finding: {
          type: "compare",
          sides: [
            {
              label: "Invoiced",
              value: "€142.00",
              provenance: "INV-30292 line 4",
              tone: "warn",
              inspectable: true,
            },
            { label: "PO rate", value: "€130.00", provenance: "PO-820051201" },
          ],
        },
        suggestions: [
          {
            type: "suggest_correction",
            data: { label: "Adjust to €130.00" },
            reasoning:
              "Unit price €142 against PO rate €130; a €12 overage per unit.",
          },
          { type: "suggest_supplier", data: {} },
        ],
        resolution: {
          label: "Price adjusted",
          sub: "Price mismatch on line 4, resolved by you",
          shortLabel: "price adjusted",
        },
      },
    ],
  },

  // 8. No exchange rate (lead) + High value (waiting).
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
        synthesis: "No GBP/USD rate available for May 28",
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
      {
        ...highValueException("91003", "£8,750.00"),
        synthesis: "Total £8,750 exceeds auto-approve limit",
      },
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
        synthesis: "USB hub invoiced $4.84 above PO",
        scope: { level: "invoice" },
        origin: "initial",
        status: "open",
        sourceAnchors: ["line:1:unit-price", "field:total"],
        reference: {
          fieldKey: "lineItems.0.amount",
          label: "PO agreed",
          value: "$689.55",
          source: "PO-460035919",
        },
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
        synthesis: "Invoice number was already paid Apr 2",
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
            data: { label: "Confirm not duplicate" },
            reasoning: "Amounts and dates differ from the prior run.",
            resolution: {
              label: "Confirmed not a duplicate",
              sub: "Distinct invoice confirmed by you",
              shortLabel: "not duplicate confirmed",
            },
          },
          { type: "route", data: { owner: "AP lead" } },
        ],
        resolution: {
          label: "Confirmed not a duplicate",
          sub: "Distinct invoice confirmed by you",
          shortLabel: "not duplicate confirmed",
        },
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
        synthesis: "Vendor not yet in the approved master list",
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
            data: { label: "Approve vendor" },
            reasoning: "Banking details match the W-9 on file.",
            resolution: {
              label: "Approved new vendor",
              sub: "Vendor confirmed by you",
              shortLabel: "vendor approved",
            },
          },
          { type: "route", data: { owner: "Vendor onboarding" } },
        ],
        resolution: {
          label: "Approved new vendor",
          sub: "Vendor confirmed by you",
          shortLabel: "vendor approved",
        },
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

/**
 * SEAM: hard-commit a rejection (permanent, like approve, no undo). Backend
 * contract point: a real build records the rejection + reason and returns the
 * invoice to the supplier for resubmission (a new cycle, out of scope here).
 */
export function rejectInvoice(
  invoiceId: string,
  reason: string,
  note?: string,
): void {
  // eslint-disable-next-line no-console
  console.info(
    `[rejectInvoice] ${invoiceId} — ${reason}${note ? ` (${note})` : ""}`,
  );
}

/** SEAM: park the invoice on a reviewer hold (reversible). */
export function holdInvoice(
  invoiceId: string,
  reason?: string,
  note?: string,
): void {
  // eslint-disable-next-line no-console
  console.info(
    `[holdInvoice] ${invoiceId}${reason ? ` — ${reason}` : ""}${note ? ` (${note})` : ""}`,
  );
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
      actor: "reviewer",
    },
  };
}

export function buildHold(
  review: InvoiceReview,
  reason?: string,
  note?: string,
): { disposition: InvoiceDisposition; event: RunEventInput } {
  const time = "Just now";
  const trimmed = reason?.trim() || undefined;
  const trimmedNote = note?.trim() || undefined;
  return {
    disposition: { type: "held", reason: trimmed, time },
    event: {
      kind: "disposition",
      label: "Put on hold",
      sub: trimmed ?? `${review.supplier} invoice`,
      time,
      actor: "reviewer",
      note: trimmedNote,
    },
  };
}

export function buildReject(
  review: InvoiceReview,
  reason: string,
  note?: string,
): { disposition: InvoiceDisposition; event: RunEventInput } {
  const time = "Just now";
  const trimmed = reason.trim() || review.supplier;
  const trimmedNote = note?.trim() || undefined;
  return {
    // Note lives on the disposition too (the terminal renders it beneath the
    // summary), unlike hold where the note is only on the event.
    disposition: { type: "rejected", reason: trimmed, note: trimmedNote, time },
    event: {
      kind: "disposition",
      label: "Invoice rejected",
      sub: trimmed,
      time,
      actor: "reviewer",
      note: trimmedNote,
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
      actor: "reviewer",
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
 * SEAM CONTRACT (exception-resolution-loop workstream). The OUTBOUND leg for an
 * INTERNAL handoff: route the exception to a named colleague (data owner,
 * approver, etc.) with an optional note. The internal counterpart to
 * sendSupplierEmail. Pairs with the same receiveCorrectedInvoice return leg.
 *
 * Input: invoice id, the parked exception id, the resolved owner (name + role),
 *   the selected reason chip, and the reviewer's optional handoff note.
 * Output: a routing receipt (handoff id + time). The caller parks the exception
 *   in a waiting state against the owner's name.
 *
 * Stubbed: resolves after ~600ms with a synthetic receipt.
 */
export function routeToOwner(
  invoiceId: string,
  exceptionId: string,
  owner: RouteOwner,
  reason?: string,
  note?: string,
): Promise<{ id: string; routedTime: string }> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          id: `${invoiceId}-${exceptionId}-route`,
          routedTime: "just now",
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
 *
 * REJECTED invoices are out of the loop: this seam never runs for them (the
 * caller never surfaces the return trigger on a rejected terminal), so there is
 * nothing to do here. It stays a silent no-op by omission, not a logged event.
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
