// oxlint-disable max-lines -- J3 request seed (fixtures); mirrors the size of
// requests/data.ts and workbench/data.ts

import type { IntakeAnswers, JourneyStepId } from "./journeys";
import { assembleJourney } from "./journeys";
import type { PersonId } from "./people";
import { atTime, D1, D2, D3, ph } from "./placeholders";

// ── Identity ─────────────────────────────────────────────────────────────────

export interface RequestIdentity {
  id: "REQ-10482";
  title: string;
  shortTitle: string;
  requester: PersonId;
  commodity: string;
  buyingEntity: string;
  costCentre: string;
  rejectedCostCentre: string;
  /** The rejected cost centre's name. Kept apart from its code (above), the
   * same "Name · Code" split the committed costCentre already keeps as a
   * single string, so both compose through the same display helper below. */
  rejectedCostCentreName: string;
  currency: "USD";
  neededFrom: string;
  agreement: string;
}

export const IDENTITY: RequestIdentity = {
  id: "REQ-10482",
  title: "ConnectMeet expansion · 1,200 US users",
  shortTitle: "Video-conferencing expansion · ConnectMeet",
  requester: "priya-nair",
  commodity: "Software · Collaboration / Video Conferencing",
  buyingEntity: "UiPath Inc. · New York (US)",
  costCentre: "IT Collaboration US · CC-1450",
  rejectedCostCentre: "CC-4820",
  rejectedCostCentreName: "UiPath UK",
  currency: "USD",
  neededFrom: "Sep 1 · legacy tool retires Oct 1",
  agreement: "MSA-VC-01",
};

// Same "Name · Code" shape the committed cost centre string already uses,
// so the rejected value renders in the field the same way a valid one does.
export const REJECTED_COST_CENTRE_DISPLAY = `${IDENTITY.rejectedCostCentreName} · ${IDENTITY.rejectedCostCentre}`;

// "UiPath Inc. · New York (US)" -> "UiPath New York": first word of the org
// name, paren-qualified location with the parenthetical dropped. A
// mechanical shortening, not a second authored copy of the entity name
// (same status as shortHostingLabel below, for the same reason).
function shortBuyingEntityLabel(buyingEntity: string): string {
  const [org, location] = buyingEntity.split(" · ");
  const orgName = org?.split(" ")[0] ?? buyingEntity;
  const locationName = location?.replace(/\s*\([^)]*\)\s*$/, "") ?? "";
  return locationName ? `${orgName} ${locationName}` : orgName;
}

// "IT Collaboration US · CC-1450" -> "IT Collaboration US (CC-1450)": the
// rule message's own parenthetical convention, distinct from the field
// value's "Name · Code" convention above. Mechanical, not a second copy.
function costCentreParenLabel(costCentre: string): string {
  const [name, code] = costCentre.split(" · ");
  return code ? `${name} (${code})` : costCentre;
}

// The cost centre rule message, split so the recommended cost centre can
// render emphasised:
// `${COST_CENTRE_RULE_PREFIX}${RECOMMENDED_COST_CENTRE_LABEL}.` is the full
// sentence. Both pieces interpolate IDENTITY rather than restating it; see
// the report for the exact derivation of the two short forms above.
export const COST_CENTRE_RULE_PREFIX = `This cost centre can't be used with ${shortBuyingEntityLabel(IDENTITY.buyingEntity)}. Recommended for you: `;
export const RECOMMENDED_COST_CENTRE_LABEL = costCentreParenLabel(
  IDENTITY.costCentre,
);

// General Info's footer line. Stable policy copy, not volatile request
// content, so it's authored here rather than registered as a placeholder.
// Reworded from source material that used an em-dash (PH-11, unconfirmed).
export const GENERAL_INFO_FOOTER_LINE =
  "Every controlled field is checked against policy as you type, so problems get caught here, not after submission.";

// ── Commercials ──────────────────────────────────────────────────────────────
// Annual and total contract value are derived below, never stored. A stored
// total would drift the moment quantity, unit price, or term changed.

export const QUANTITY = 1200;
export const UNIT_PRICE_PER_YEAR = 165;
export const TERM_YEARS = 3;
export const BASE_TIER_REFERENCE_PRICE_PER_YEAR = 148;
export const BUYER_DECISION_BAND_PCT = 15;
export const ABOVE_BAND_ROUTE = "Category Management";
export const BUDGET_REMAINING_AFTER_APPROVAL = 300000;

export const BENCHMARK_EVIDENCE = {
  comparableDeals: 3,
  marketReferences: 2,
};

/** Licence fee for one contract year. Derived from quantity × unit price. */
export const ANNUAL_VALUE = QUANTITY * UNIT_PRICE_PER_YEAR;

/** Full-term value across TERM_YEARS. Derived, never stored as a literal. */
export const TOTAL_CONTRACT_VALUE = ANNUAL_VALUE * TERM_YEARS;

/** How far the unit price sits above the base tier reference, as a percent. */
export function unitPriceDeviationPct(): number {
  return (
    ((UNIT_PRICE_PER_YEAR - BASE_TIER_REFERENCE_PRICE_PER_YEAR) /
      BASE_TIER_REFERENCE_PRICE_PER_YEAR) *
    100
  );
}

/** Whether the deviation clears the buyer's own decision band (in which
 * case the request routes to ABOVE_BAND_ROUTE instead of resolving inline). */
export function isAboveDecisionBand(): boolean {
  return unitPriceDeviationPct() > BUYER_DECISION_BAND_PCT;
}

export interface CommercialLine {
  year: number;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/** One line per contract year, generated from quantity/unit price/term,
 * never three literal line objects. */
export function buildAnnualLines(): CommercialLine[] {
  return Array.from({ length: TERM_YEARS }, (_, i) => ({
    year: i + 1,
    quantity: QUANTITY,
    unitPrice: UNIT_PRICE_PER_YEAR,
    amount: QUANTITY * UNIT_PRICE_PER_YEAR,
  }));
}

// ── Payment terms ────────────────────────────────────────────────────────────

export type PaymentTermsCheck = "deviates" | "governing" | "consistent";

export interface PaymentTermsSource {
  source: string;
  terms: string;
  check: PaymentTermsCheck;
}

export const PAYMENT_TERMS_SOURCES: PaymentTermsSource[] = [
  { source: "Order form v1 · §4", terms: "Net 30", check: "deviates" },
  { source: "MSA-VC-01 · agreed terms", terms: "Net 60", check: "governing" },
  { source: "Vendor master record", terms: "Net 60", check: "consistent" },
];

// ── Field provenance ─────────────────────────────────────────────────────────
// Closed vocabulary, no free strings. The prompt defining this module names
// the six values and asks that display labels live with the type, but does
// not say which specific req-10482 fields carry which value, so none are
// wired here. See the report: escalated rather than guessed.

export type FieldProvenance =
  | "from-order-form"
  | "from-order-form-pricing"
  | "from-profile"
  | "from-entity"
  | "from-you"
  | "recognised";

// Reconciled toward Details' own vocabulary (see the report): from-profile
// reuses "From your profile" verbatim, since it means the same thing there.
// from-order-form and from-order-form-pricing stay distinct, Details has no
// equivalent for a source document, and both now share the same "From
// order form" opening so they read as one family rather than two.
export const FIELD_PROVENANCE_LABEL: Record<FieldProvenance, string> = {
  "from-order-form": "From order form",
  "from-order-form-pricing": "From order form · §2 Pricing",
  "from-profile": "From your profile",
  "from-entity": "From the buying entity",
  "from-you": "From you",
  recognised: "Recognised",
};

// ── Documents ────────────────────────────────────────────────────────────────

export type DocumentState = "superseded" | "current";

export interface RequestDocument {
  version: string;
  filename: string;
  size: string;
  terms: string;
  state: DocumentState;
  /** Version this one supersedes. v1 stays in the collection either way. */
  supersedes?: string;
}

export const DOCUMENTS: RequestDocument[] = [
  {
    version: "v1",
    filename: "ConnectMeet_Order_Form_US_Expansion.pdf",
    size: "840 KB",
    terms: "Net 30",
    state: "superseded",
  },
  {
    version: "v2",
    filename: "ConnectMeet_Order_Form_US_Expansion_v2.pdf",
    size: ph("PH-03"),
    terms: "Net 60",
    state: "current",
    supersedes: "v1",
  },
];

// ── Vendor options ───────────────────────────────────────────────────────────

export type VendorStatus = "preferred" | "approved";

export interface VendorOption {
  vendor: string;
  category: string;
  status: VendorStatus;
  contract: string;
  consequence: string;
}

export const VENDOR_OPTIONS: VendorOption[] = [
  {
    vendor: "ConnectMeet",
    category: "Video conferencing · incumbent",
    status: "preferred",
    contract: "Under MSA-VC-01",
    consequence: "Links MSA-VC-01 to the request",
  },
  {
    vendor: "MeetHub",
    category: "Video conferencing",
    status: "preferred",
    contract: "Under contract",
    consequence: "Restarts commercial review",
  },
  {
    vendor: "Vantage AV",
    category: "AV & conferencing",
    status: "approved",
    contract: "No contract",
    consequence: "Requires contracting before purchase",
  },
];

// ── Intake questions ─────────────────────────────────────────────────────────

export interface IntakeQuestion {
  id: "Q1" | "Q2" | "Q3" | "Q4" | "Q5";
  question: string;
  helperText?: string;
  answer: string;
  adds: JourneyStepId | null;
  /** Config change gating whether this question exists in the default
   * flow. Absent for questions that are always active. */
  enabledBy?: string;
  /** What this answer does to the request, rendered beneath it. Stable
   * policy copy, not volatile request content, so it's authored here rather
   * than registered as a placeholder. Absent for Q5 (never rendered in the
   * default flow, see enabledBy above). */
  consequence?: string;
  /** Q1 only: the consequence line when its answer is "no" instead of
   * "yes". `consequence` above only covers the "yes" case (it names the
   * DPA review and the questions it reveals, neither true on "no"). The
   * source has no covering copy for this state (see the report), hence a
   * placeholder rather than an authored line. */
  consequenceNo?: string;
}

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "Q1",
    question: "Will the software process personal or sensitive company data?",
    helperText:
      "For example: customer or employee records, financial data, or other confidential information.",
    answer: "yes",
    adds: "legal-dpa",
    consequence:
      "A DPA applicability review is triggered (Legal), and a few more questions appear below.",
    consequenceNo: ph("PH-25"),
  },
  {
    id: "Q2",
    question: "Will the software connect to or access internal UiPath systems?",
    answer: "yes",
    adds: "security-review",
    consequence:
      "An IT Security review will be added to the approval workflow.",
  },
  {
    id: "Q3",
    question: "Where will the software and its data be hosted?",
    answer: "Public cloud (SaaS) · US",
    adds: null,
    consequence:
      "This scopes the IT Security review and records the data-residency requirement.",
  },
  {
    id: "Q4",
    question: "Will the software support business-critical processes?",
    answer: "no",
    adds: null,
    // PH-11: source used an em-dash, reworded here. Unconfirmed.
    consequence:
      "Important collaboration tool, but not operations-halting, so no critical escalation is added.",
  },
  {
    id: "Q5",
    question:
      "Will the software share data with third parties or sub-processors?",
    answer: "yes",
    adds: "privacy-review",
    enabledBy: "CFG-2041",
  },
];

const QUESTION_ANSWER_FIELD: Partial<
  Record<IntakeQuestion["id"], keyof IntakeAnswers>
> = {
  Q1: "personalData",
  Q2: "systemAccess",
  Q5: "thirdPartySharing",
};

function intakeAnswersFrom(questions: IntakeQuestion[]): IntakeAnswers {
  const answers: IntakeAnswers = {};
  for (const question of questions) {
    const field = QUESTION_ANSWER_FIELD[question.id];
    if (field && (question.answer === "yes" || question.answer === "no")) {
      answers[field] = question.answer;
    }
  }
  return answers;
}

/** Q5 is excluded here. CFG-2041 gates it out of the default flow. A later
 * prompt reaches it via INTAKE_ANSWERS_WITH_CFG_2041 without editing this
 * file. */
export const DEFAULT_INTAKE_ANSWERS: IntakeAnswers = intakeAnswersFrom(
  INTAKE_QUESTIONS.filter((question) => question.enabledBy == null),
);

export const INTAKE_ANSWERS_WITH_CFG_2041: IntakeAnswers =
  intakeAnswersFrom(INTAKE_QUESTIONS);

/** REQ-10482's own assembled journey under the default (no-CFG-2041) flow. */
export const REQUEST_JOURNEY = assembleJourney(DEFAULT_INTAKE_ANSWERS);

function yesNoLabel(answer: string): string {
  if (answer === "yes") return "Yes";
  if (answer === "no") return "No";
  return answer;
}

/** Abbreviates a hosting-model answer like "Public cloud (SaaS) · US" to
 * "SaaS US" for the review summary line, by extracting the parenthetical
 * acronym and the trailing region token. Not a second stored label. */
function shortHostingLabel(answer: string): string {
  const acronym = answer.match(/\(([^)]+)\)/)?.[1] ?? answer;
  const region = answer.split("·").at(-1)?.trim();
  return region ? `${acronym} ${region}` : acronym;
}

/** "Data: Yes · Access: Yes · SaaS US · Critical: No", derived from
 * whichever Q1 through Q4 answers the caller currently holds, never stored.
 * Takes the live values rather than reading INTAKE_QUESTIONS' own seed
 * answers directly, so a caller holding a live edit (Review, reading
 * Data and Info's shared state) reduces that edit, not the static seed. */
export function reviewSummaryLine(values: {
  Q1: string;
  Q2: string;
  Q3: string;
  Q4: string;
}): string {
  const personalData = yesNoLabel(values.Q1);
  const systemAccess = yesNoLabel(values.Q2);
  const hosting = shortHostingLabel(values.Q3);
  const critical = yesNoLabel(values.Q4);
  return `Data: ${personalData} · Access: ${systemAccess} · ${hosting} · Critical: ${critical}`;
}

// REQ-10482's two exceptions now live in cockpit-10482.ts, modelled on the
// generic shape in exceptions.ts (see the report). The commercial/operational
// classification and both exceptions' values are unchanged from here.

// ── Downstream records ───────────────────────────────────────────────────────

export type DownstreamRecordType =
  | "pr"
  | "po"
  | "jira"
  | "config-change"
  | "agreement"
  | "addendum";

export interface DownstreamRecord {
  id: string;
  type: DownstreamRecordType;
  detail?: string;
}

export const DOWNSTREAM_RECORDS: DownstreamRecord[] = [
  { id: "PR-88231", type: "pr", detail: "pre-approved" },
  { id: "PO-90214", type: "po", detail: "created on PR conversion" },
  { id: "SEC-482", type: "jira", detail: "Third-Party Security Review" },
  { id: "CFG-2041", type: "config-change" },
  { id: "MSA-VC-01", type: "agreement" },
  { id: "dpa-addendum", type: "addendum", detail: "DPA addendum" },
];

export const ACTIVATION = {
  seats: QUANTITY,
  capabilities: ["recording", "transcription", "SSO", "calendar"] as const,
};

// ── Timeline ─────────────────────────────────────────────────────────────────

export type TimelineActor =
  | PersonId
  | "policy"
  | "agent"
  | "system"
  | "DocuSign";

export interface TimelineEvent {
  id: string;
  label: string;
  actor: TimelineActor;
  /** A concrete instant once resolved, or an unresolved PH-01 placeholder
   * string for the two events whose timing isn't anchored yet. */
  when: Date | string;
}

const SEATS_LABEL = QUANTITY.toLocaleString("en-US");

// Ordered 1:1 with the prompt's own numbered timeline. Events between the
// numbered 12th and 13th entries (security approval, PO dispatch) carry
// unresolved timing (see PH-01) rather than an invented stamp.
export const TIMELINE: TimelineEvent[] = [
  {
    id: "order-form-uploaded",
    label: "Order form uploaded, v1",
    actor: "priya-nair",
    when: atTime(D1, "09:05"),
  },
  {
    id: "cost-centre-corrected",
    label: "Cost centre rule blocked CC-4820, corrected to CC-1450",
    actor: "policy",
    when: atTime(D1, "09:14"),
  },
  {
    id: "submitted",
    label: "Submitted, moved to Pending Buyer Action",
    actor: "priya-nair",
    when: atTime(D1, "09:18"),
  },
  {
    id: "benchmark-produced",
    label: "Benchmark produced",
    actor: "agent",
    when: atTime(D1, "09:24"),
  },
  {
    id: "price-accepted",
    label: "Price accepted with rationale",
    actor: "sam-rivera",
    when: atTime(D1, "09:41"),
  },
  {
    id: "terms-correction-sent",
    label: "Terms correction drafted by agent, sent by buyer",
    actor: "sam-rivera",
    when: atTime(D1, "09:47"),
  },
  {
    id: "order-form-v2-received",
    label: "Corrected order form v2 received",
    actor: "casey-morgan",
    when: atTime(D1, "13:10"),
  },
  {
    id: "revalidated",
    label: "Re-validated, checks re-run",
    actor: "agent",
    when: atTime(D1, "13:11"),
  },
  {
    id: "procurement-validation-complete",
    label: "Procurement validation complete, released to budget",
    actor: "agent",
    when: atTime(D1, "13:12"),
  },
  {
    id: "teams-card-posted",
    label: "Teams approval card posted",
    actor: "agent",
    when: atTime(D1, "13:14"),
  },
  {
    id: "budget-approved",
    label: "Budget approved",
    actor: "dana-kim",
    when: atTime(D1, "13:17"),
  },
  {
    id: "legal-dpa-complete",
    label: "Legal DPA complete, addendum signed",
    actor: "legal-team",
    when: atTime(D1, "13:25"),
  },
  {
    id: "security-review-complete",
    label: "Security approval",
    actor: "infosec-team",
    when: ph("PH-01"),
  },
  {
    id: "po-dispatched",
    label: "PO dispatched",
    actor: "agent",
    when: ph("PH-01"),
  },
  {
    id: "contract-executed",
    label: "Contract executed, v2 signed and synced back",
    actor: "DocuSign",
    when: atTime(D2, "11:00"),
  },
  {
    id: "year1-active",
    label: `Year 1 licences active, ${SEATS_LABEL} seats provisioned`,
    actor: "system",
    when: D3,
  },
  {
    id: "year1-activation-confirmed",
    label: "Year 1 activation confirmed",
    actor: "priya-nair",
    when: D3,
  },
];
