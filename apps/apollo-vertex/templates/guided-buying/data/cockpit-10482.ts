// oxlint-disable max-lines -- seed data (fixtures), same exemption
// req-10482.ts already carries, for the same reason: the split kept this
// module under the limit on its own for a while, but enough prompts have
// since added legitimate derived content (prompt 38's metric units, sub
// lines, and scale marker among them) that it now needs the same
// allowance, not a trim of the reasoning already on these exports.

// Seed for Sam Rivera's four Cockpit screens (buyer workbench), REQ-10482
// specifically. Kept apart from req-10482.ts rather than added to it: that
// module already carries an oxlint max-lines exemption acknowledging its
// own size, and this is a distinct concern (how the buyer processes and
// resolves the request) from what's already there (the request's own
// identity, commercials, and timeline). Every derivation here reads those
// existing exports rather than restating them (see the report).

import type { Exception } from "./exceptions";
import type { JourneyStep, JourneyStepId } from "./journeys";
import { getPerson, type PersonId } from "./people";
import { ph } from "./placeholders";
import {
  ABOVE_BAND_ROUTE,
  ANNUAL_VALUE,
  BASE_TIER_REFERENCE_PRICE_PER_YEAR,
  BENCHMARK_EVIDENCE,
  BUYER_DECISION_BAND_PCT,
  DOCUMENTS,
  IDENTITY,
  isAboveDecisionBand,
  PAYMENT_TERMS_SOURCES,
  QUANTITY,
  REQUEST_JOURNEY,
  TERM_YEARS,
  TIMELINE,
  TOTAL_CONTRACT_VALUE,
  UNIT_PRICE_PER_YEAR,
  unitPriceDeviationPct,
} from "./req-10482";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: IDENTITY.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function timelineEvent(id: string) {
  const event = TIMELINE.find((e) => e.id === id);
  if (!event) throw new Error(`Unknown timeline event id: ${id}`);
  return event;
}

function paymentTerms(check: PaymentTermsCheckLookup): string {
  const source = PAYMENT_TERMS_SOURCES.find((s) => s.check === check);
  if (!source) throw new Error(`No payment terms source with check: ${check}`);
  return source.terms;
}
type PaymentTermsCheckLookup = "deviates" | "governing" | "consistent";

// A source that's merely consistent with the governing terms carries neither
// role: it isn't what the exception deviates from, and it isn't itself the
// reference. Only "deviates" and "governing" map onto a finding side's role.
function paymentTermsSideRole(
  check: PaymentTermsCheckLookup,
): "governing" | "deviating" | undefined {
  if (check === "deviates") return "deviating";
  if (check === "governing") return "governing";
}

function document(version: string) {
  const doc = DOCUMENTS.find((d) => d.version === version);
  if (!doc) throw new Error(`Unknown document version: ${version}`);
  return doc;
}

// ── 1. Benchmark evidence ────────────────────────────────────────────────────

export interface ComparableDeal {
  descriptor: string;
  seats: number;
  pricePerYear: number;
}

export const COMPARABLE_DEALS: ComparableDeal[] = [
  { descriptor: "Enterprise SaaS · base tier", seats: 1500, pricePerYear: 142 },
  { descriptor: "Enterprise SaaS · base tier", seats: 900, pricePerYear: 151 },
  {
    descriptor: "Enterprise SaaS · base and SSO",
    seats: 1100,
    pricePerYear: 155,
  },
];

// The base tier midpoint is BASE_TIER_REFERENCE_PRICE_PER_YEAR, already in
// req-10482.ts (see the report). This line names what the market
// references represent, it doesn't restate the price itself.
export const MARKET_REFERENCES_LINE = `${BENCHMARK_EVIDENCE.marketReferences} industry pricing indices, Q2 2026, base tier midpoint`;

export interface BenchmarkAddition {
  capability: string;
  note: string;
}

// How many of the comparables priced SSO separately rather than bundling it
// (only the "base and SSO" row bundles it). Derived from the comparables
// above, not authored as "2 of 3".
const dealsWithoutBundledSso = COMPARABLE_DEALS.filter(
  (deal) => !deal.descriptor.includes("SSO"),
).length;

// Years the rate lock protects: every contract year after year 1, derived
// from TERM_YEARS rather than restated as "2 and 3".
const lockedYears = Array.from(
  { length: Math.max(TERM_YEARS - 1, 0) },
  (_, i) => i + 2,
);
function joinYears(years: number[]): string {
  if (years.length <= 1) return years.map((y) => `year ${y}`).join("");
  return `years ${years.slice(0, -1).join(", ")} and ${years.at(-1)}`;
}

export const BENCHMARK_ADDITIONS: BenchmarkAddition[] = [
  {
    capability: "Recording and transcription",
    note: "not in the base benchmark",
  },
  {
    capability: "SSO integration",
    note: `priced as an add-on in ${dealsWithoutBundledSso} of ${COMPARABLE_DEALS.length} comparables`,
  },
  { capability: "Calendar integration", note: "bundled" },
  {
    capability: `${TERM_YEARS}-year rate lock`,
    note: `shields ${joinYears(lockedYears)} from list price increases`,
  },
];

const deviationPct = Math.round(unitPriceDeviationPct());

// The judgment the rationale leads with (prompt 29): fixed phrasing, no
// figure baked into the string. The deviation-vs-band figure renders as its
// own highlighted span in the component (see DEVIATION_PCT/
// DEVIATION_BAND_PCT/DEVIATION_BAND_RELATION below), matching how the
// approver's own summary highlights its decisive figure inline rather than
// folding it into plain prose.
export const BENCHMARK_CONCLUSION_LINE =
  "The premium is attributable to functionality outside the base benchmark";

// The reason, kept from the original rationale template (prompt 21):
// capabilities added plus the rate lock, in that order. Reworded from
// source material that used em-dashes (PH-11, unconfirmed).
const [recording, sso, calendar, rateLock] = BENCHMARK_ADDITIONS;
export const BENCHMARK_REASON_LINE = `The premium reflects ${recording.capability}, ${sso.capability}, and ${calendar.capability}, backed by the ${rateLock.capability}.`;

// The deviation against the buyer's own decision band, both read from
// req-10482.ts rather than restated: how far the unit price sits above the
// base tier reference, and the band that decides whether this resolves
// inline or routes to category management.
export const DEVIATION_PCT = deviationPct;
export const DEVIATION_BAND_PCT = BUYER_DECISION_BAND_PCT;

// Signed, so a positive deviation reads as a deviation, not a bare number.
export const DEVIATION_PCT_SIGNED = `${deviationPct >= 0 ? "+" : ""}${deviationPct}%`;

// The benchmark evidence view's own conclusion line (prompt 21's original
// spec, prompt 43): the deviation interpolated into the same sentence
// BENCHMARK_CONCLUSION_LINE above carries without it, since that export
// dropped the figure in prompt 29 for the summary card's own highlighted
// span instead. Distinct export, not a re-edit of BENCHMARK_CONCLUSION_LINE:
// the two screens need the figure placed differently (inline text here,
// a separate highlighted mark there).
export const BENCHMARK_EVIDENCE_CONCLUSION_LINE = `The ${DEVIATION_PCT_SIGNED} premium is attributable to functionality outside the base benchmark.`;

// The metric's own sub line: the band it sits within (prompt 38).
export const DEVIATION_METRIC_SUB_LINE = `${isAboveDecisionBand() ? "above" : "within"} the ${BUYER_DECISION_BAND_PCT}% decision band`;

// The band, named the way the deviation row states it inline (prompt 40):
// the same phrase the scale's own end label already used, now a named
// export so both read the identical derived string rather than two
// separately typed templates of the same fact.
export const DEVIATION_BAND_LABEL = `${BUYER_DECISION_BAND_PCT}% decision band`;

// A one line verdict for group one (prompt 40): the same within/above check
// that drives DEVIATION_BAND_RELATION (below), DEVIATION_ROUTING_NOTE, and
// the deviation row's own role colour, so this doesn't add a new field to
// the exception model, just a fourth reader of the same derived fact.
export const DEVIATION_VERDICT = `${isAboveDecisionBand() ? "above" : "within"} the decision band`;

// Unit price's value and unit, split (prompt 40, for the row layout's own
// value/unit split) from the single combined string prompt 39 introduced.
// "/license/yr" is still that combination ("/license" per the US English
// sweep, this codebase's own established suffix; "/yr" from
// UNIT_PRICE_PER_YEAR's own established one), just split into two exports
// now rather than one. The sub line keeps its own simpler "/yr": it
// multiplies by quantity, so the per unit reading is already unambiguous
// there.
export const UNIT_PRICE_VALUE = formatUSD(UNIT_PRICE_PER_YEAR);
export const UNIT_PRICE_UNIT = "/license/yr";
export const UNIT_PRICE_SUB_LINE = `${QUANTITY.toLocaleString("en-US")} × ${formatUSD(UNIT_PRICE_PER_YEAR)}/yr = ${formatUSD(ANNUAL_VALUE)}/yr`;

// Base tier reference's value and unit, split the same way (prompt 40). The
// approximation marker stays on the value, not the unit (prompt 39: it's
// part of the figure, not decoration). MARKET_REFERENCES_LINE above is
// this value's own sub line.
export const BASE_TIER_REFERENCE_VALUE = `~${formatUSD(BASE_TIER_REFERENCE_PRICE_PER_YEAR)}`;
export const BASE_TIER_REFERENCE_UNIT = "/license/yr";

// The scale earns its place only when the deviation is close enough to the
// band, or past it, that the number alone under-communicates the position
// (prompt 39). The margin is a fifth of the band itself, not a hardcoded
// point: proportional to whatever the band happens to be, rather than a
// fixed percentage point value that would mean something different for a
// wider or narrower band. See the report for why a fifth.
export const DEVIATION_NEAR_BAND_MARGIN_PCT = BUYER_DECISION_BAND_PCT * 0.2;
export const DEVIATION_SCALE_VISIBLE =
  deviationPct >= BUYER_DECISION_BAND_PCT - DEVIATION_NEAR_BAND_MARGIN_PCT;

// Whether the deviation sits within or above the band: the second half of
// the judgment the rationale leads with. Same underlying check as
// DEVIATION_ROUTING_NOTE below, named here rather than restated.
export const DEVIATION_BAND_RELATION = isAboveDecisionBand()
  ? "above"
  : "within";

// How far the deviation sits inside the band, 0 to 1, clamped: the scale's
// own fill ratio. Purely derived, no authored content, see the report.
export const DEVIATION_BAND_RATIO = Math.min(
  1,
  Math.max(0, deviationPct / BUYER_DECISION_BAND_PCT),
);

// Split into its condition and its consequence (prompt 42), not reworded:
// the condition ("within"/"above the band") duplicated what the headline's
// own verdict already states once the two joined (see DEVIATION_VERDICT
// above), so only the consequence renders on the pane now. The consequence
// clause is the same seed wording either way, just no longer prefixed by
// the condition that made it read as a sentence on its own; capitalization
// is the only change, since it now starts a sentence instead of continuing
// one. `DEVIATION_ROUTING_CONDITION` is kept named, structurally, even
// though nothing currently renders it (the headline covers that fact).
export const DEVIATION_ROUTING_CONDITION = isAboveDecisionBand()
  ? "Above the band."
  : "Within the band.";
export const DEVIATION_ROUTING_CONSEQUENCE = `Routes to ${ABOVE_BAND_ROUTE}.`;

// ── 2. The supplier correction draft ─────────────────────────────────────────

const casey = getPerson("casey-morgan");
const priya = getPerson("priya-nair");
const samRivera = getPerson("sam-rivera");
const caseyFirstName = casey.name.split(" ")[0];
const caseyEmail = casey.email;
if (!caseyEmail) throw new Error("casey-morgan has no email in the seed");
const orderFormTerms = paymentTerms("deviates");
const governingTerms = paymentTerms("governing");

export const CORRECTION_EMAIL_SUBJECT = `US expansion order form · payment terms to align with ${IDENTITY.agreement}`;

// Reworded from source material that used em-dashes (PH-11, unconfirmed).
// Terms and the agreement id interpolate from PAYMENT_TERMS_SOURCES and
// IDENTITY rather than being restated (see the report).
export const CORRECTION_EMAIL_BODY = `Hi ${caseyFirstName}, scope and pricing look good and we're ready to proceed. One item: the order form lists ${orderFormTerms}, while our governing agreement ${IDENTITY.agreement} sets ${governingTerms}. Could you send a corrected order form at ${governingTerms}? We'll re-validate on receipt and keep the timeline intact. ${samRivera.name}, ${samRivera.org}`;

export const CORRECTION_DRAFT = {
  to: caseyEmail,
  toName: casey.name,
  cc: priya.name,
  subject: CORRECTION_EMAIL_SUBJECT,
  body: CORRECTION_EMAIL_BODY,
  /** Where the draft posts, and who besides the buyer can see it. */
  postsTo: "request-thread" as const,
  visibleToRequester: true,
};

// ── 3. The supplier reply ────────────────────────────────────────────────────

// Reworded from source material that used em-dashes (PH-11, unconfirmed).
// Terms interpolate the same way the draft's own body does.
export const SUPPLIER_REPLY = {
  from: "casey-morgan" as PersonId,
  when: timelineEvent("order-form-v2-received").when,
  body: `Apologies, corrected order form attached with payment terms at the contracted ${governingTerms}. Everything else unchanged.`,
  /** The v2 document already in the seed, referenced rather than restated. */
  document: document("v2"),
};

// Reworded from source material that used em-dashes (PH-11, unconfirmed).
export const DETECTION_LINE = {
  text: "The corrected document is detected and reprocessed, with the agreement and vendor master checks re-run.",
  when: timelineEvent("revalidated").when,
};

// ── 4. Exceptions ─────────────────────────────────────────────────────────────
// REQ-10482's two exceptions, modelled on the generic shape in exceptions.ts
// (see the report). Values unchanged from the prior req-10482.ts EXCEPTIONS
// array: same ids, same type classification, same owner, same rationale.

// The price finding: what the order form charges versus the benchmark
// reference, both already in the seed.
const PRICE_EXCEPTION: Exception = {
  id: "price-above-benchmark",
  type: "commercial",
  headline: "Price above base benchmark",
  finding: {
    sides: [
      {
        label: "Unit price",
        value: UNIT_PRICE_VALUE,
        unit: UNIT_PRICE_UNIT,
        subLine: UNIT_PRICE_SUB_LINE,
        role: "deviating",
      },
      {
        label: "Base tier reference",
        value: BASE_TIER_REFERENCE_VALUE,
        unit: BASE_TIER_REFERENCE_UNIT,
        subLine: MARKET_REFERENCES_LINE,
        role: "governing",
      },
    ],
  },
  suggestions: [{ type: "accept" }],
  // The queue (prompt 24) needs this open: it's the lead exception on Sam's
  // own queue row, before he's acted on it. `resolution` still carries what
  // happens once he does, for the screens that show that later.
  status: "active",
  owner: "sam-rivera",
  rationale: "premium reflects added functionality; 3-year rate lock",
  resolution: {
    resolvedBy: "person",
    by: "sam-rivera",
    when: timelineEvent("price-accepted").when,
  },
};

// The terms finding: three sources, not two, the same shape unwidened (see
// the report). Mapped directly from PAYMENT_TERMS_SOURCES, nothing restated.
const TERMS_EXCEPTION: Exception = {
  id: "payment-terms-mismatch",
  type: "operational",
  headline: "Payment terms mismatch",
  finding: {
    sides: PAYMENT_TERMS_SOURCES.map((s) => ({
      label: s.source,
      value: s.terms,
      role: paymentTermsSideRole(s.check),
    })),
  },
  suggestions: [{ type: "request_correction", draft: CORRECTION_DRAFT }],
  // Open behind the price exception on the queue row (see the report on
  // PRICE_EXCEPTION's own status comment above).
  status: "open",
  owner: "sam-rivera",
  resolution: {
    resolvedBy: "document",
    by: document("v2").version,
    when: timelineEvent("revalidated").when,
  },
};

export const REQ_10482_EXCEPTIONS: Exception[] = [
  PRICE_EXCEPTION,
  TERMS_EXCEPTION,
];

// ── 5. Automatic release ─────────────────────────────────────────────────────

/** The step immediately after `afterId` in REQ-10482's own assembled
 * journey, flattening group members into the sequence. Computed from the
 * model rather than naming the next step directly (see the report). */
function stepAfter(afterId: JourneyStepId): JourneyStep | null {
  const flat: JourneyStep[] = [];
  for (const node of REQUEST_JOURNEY) {
    if (node.kind === "step") flat.push(node.step);
    else flat.push(...node.steps);
  }
  const index = flat.findIndex((step) => step.id === afterId);
  if (index === -1 || index + 1 >= flat.length) return null;
  return flat[index + 1];
}

export const NEXT_STEP = stepAfter("procurement-validation");
if (NEXT_STEP == null) {
  throw new Error("No step follows procurement-validation in REQUEST_JOURNEY");
}

// The next step's owner: the actor TIMELINE already records against that
// step's own completion event, not a fresh guess (see the report on why
// "budget-approved" is the right event to read here).
export const NEXT_STEP_OWNER = getPerson(
  timelineEvent("budget-approved").actor as PersonId,
);

export const RELEASE_RECORD = {
  completedAutomatically: true,
  when: timelineEvent("procurement-validation-complete").when,
  nextStep: NEXT_STEP,
  nextStepOwner: NEXT_STEP_OWNER,
  /** Draft sent, corrected form received, re-validated, validation
   * complete: all four read from TIMELINE, no new time literal. */
  timingTrail: [
    timelineEvent("terms-correction-sent"),
    timelineEvent("order-form-v2-received"),
    timelineEvent("revalidated"),
    timelineEvent("procurement-validation-complete"),
  ],
  // Reworded from source material that used an em-dash (PH-11, unconfirmed).
  closingStatement:
    "No manual release was needed because the resolution is the trigger.",
};

// ── 6. The queue ─────────────────────────────────────────────────────────────

export interface QueueBucket {
  count: number;
  qualifier: string;
}

export const QUEUE_COUNTS: Record<
  "needDecision" | "waitingOnOthers" | "autoClearedThisWeek",
  QueueBucket
> = {
  needDecision: { count: 2, qualifier: "1 due today" },
  waitingOnOthers: { count: 3, qualifier: "suppliers, reviews" },
  autoClearedThisWeek: { count: 57, qualifier: "validated, no action needed" },
};

export interface QueueItem {
  id: string;
  title: string;
  amount: number;
  issue: string;
  status: string;
  due: string;
  owner: string;
}

// REQ-10471 exists only so the queue isn't a list of one (see the prompt).
// Its owner is a real conflict, not a typo: this source names "Dana L." on
// a different request, while the seed already has Dana Kim as REQ-10482's
// budget owner. Registered as PH-07 (broadened from its original "role
// reuse" scope, see placeholders.ts) rather than assuming they're the same
// person or inventing a new one.
export const SECOND_QUEUE_ITEM: QueueItem = {
  id: "REQ-10471",
  title: "Endpoint agents · IT Ops",
  amount: 34000,
  issue: "Missing security cert",
  status: "Supplier asked, awaiting reply",
  due: "Thursday",
  owner: ph("PH-07"),
};

// REQ-10482's own queue card. Added: the due time (see PH-26, nothing in
// the seed anchors a specific clock time for it) and the wrapping shape
// itself. Everything else referenced from existing records rather than
// restated (see the report): id/title from IDENTITY, amount from
// TOTAL_CONTRACT_VALUE, owner from the price exception's own owner field,
// exceptions from REQ_10482_EXCEPTIONS directly.
export const PRIMARY_QUEUE_ITEM = {
  id: IDENTITY.id,
  title: IDENTITY.shortTitle,
  amount: TOTAL_CONTRACT_VALUE,
  owner: getPerson(PRICE_EXCEPTION.owner).name,
  due: `Today · ${ph("PH-26")}`,
  exceptions: REQ_10482_EXCEPTIONS,
  /** Agent evidence (the benchmark, the reprocessed document) is ready on
   * both exceptions. */
  agentEvidenceReady: true,
};
