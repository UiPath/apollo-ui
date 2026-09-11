// Elena Vasquez's procurement outcomes view (prompt 58). Scope: this
// quarter, United States, all entities. Figures are seed data; sentences
// interpolate them rather than restating them as separate literals.

export const ANALYTICS_SCOPE = {
  period: "This quarter",
  region: "United States",
  entities: "All entities",
};

export const INTAKE_QUALITY_PCT = 82;
export const OFF_PROCESS_REDIRECTED_PCT = 9;
export const INTAKE_QUALITY_SUB_FINDINGS = [
  `${OFF_PROCESS_REDIRECTED_PCT}% off process attempts caught and redirected.`,
  "Missing statement of work is the top return reason.",
  "Marketing services has the lowest rate.",
];

export const ON_CONTRACT_PCT = 76;
export const COMMITTED_SPEND_MILLIONS = 8.4;
export const SPEND_COMPLIANCE_SUB_FINDINGS = [
  `$${COMMITTED_SPEND_MILLIONS}M committed spend processed.`,
  "Unlinked spend concentrates in three suppliers.",
  "Software has the highest off contract spend.",
];

// Derived, not authored: the complement of ON_CONTRACT_PCT (prompt 77).
// ON_CONTRACT_PCT stays the single source; this is never typed separately.
export const OFF_CONTRACT_PCT = 100 - ON_CONTRACT_PCT;

// Derived, not authored: OFF_CONTRACT_PCT's own share of the committed
// spend processed, rounded to one decimal for display.
export const OFF_CONTRACT_MILLIONS =
  Math.round((OFF_CONTRACT_PCT / 100) * COMMITTED_SPEND_MILLIONS * 10) / 10;

// Derived, not authored: the total against OFF_CONTRACT_MILLIONS (prompt
// 85), not a separate share calculation, so the two amounts always sum to
// COMMITTED_SPEND_MILLIONS exactly.
export const ON_CONTRACT_MILLIONS =
  Math.round((COMMITTED_SPEND_MILLIONS - OFF_CONTRACT_MILLIONS) * 10) / 10;

export const AVG_REQUEST_TO_PO_DAYS = 6.4;
export const PROCESS_PERFORMANCE_SUB_FINDINGS = [
  "Security review is the longest stage.",
  "Software requests take longer than other commodities.",
];

export interface HeadlineMetric {
  id: string;
  label: string;
  /** The short figure a metric card's own value slot carries (prompt 60):
   * a number and its unit, nothing else, so it never wraps. */
  figure: string;
  /** What the figure means, rendered as a caption beneath it rather than
   * folded into the figure itself. */
  qualifier: string;
  subFindings: string[];
}

export const HEADLINE_METRICS: HeadlineMetric[] = [
  {
    id: "intake-quality",
    label: "Intake quality",
    figure: `${INTAKE_QUALITY_PCT}%`,
    qualifier: "First time right",
    subFindings: INTAKE_QUALITY_SUB_FINDINGS,
  },
  {
    id: "spend-compliance",
    label: "Spend and contract compliance",
    figure: `${ON_CONTRACT_PCT}%`,
    qualifier: "On contract",
    subFindings: SPEND_COMPLIANCE_SUB_FINDINGS,
  },
  {
    id: "process-performance",
    label: "Process performance",
    figure: `${AVG_REQUEST_TO_PO_DAYS} days`,
    qualifier: "Average request to purchase order",
    subFindings: PROCESS_PERFORMANCE_SUB_FINDINGS,
  },
];

export interface StageDuration {
  stage: string;
  days: number;
}

// Software, request to purchase order.
export const SOFTWARE_STAGE_BREAKDOWN: StageDuration[] = [
  { stage: "Procurement validation", days: 1.2 },
  { stage: "Budget approval", days: 0.8 },
  { stage: "Legal", days: 0.6 },
  { stage: "Security", days: 2.9 },
  { stage: "Purchase requisition and order", days: 0.9 },
];

// Derived, not authored: equals AVG_REQUEST_TO_PO_DAYS (6.4), a
// consistency check between the headline metric and its own breakdown.
export const SOFTWARE_STAGE_TOTAL_DAYS = SOFTWARE_STAGE_BREAKDOWN.reduce(
  (sum, s) => sum + s.days,
  0,
);

export interface ReturnReason {
  reason: string;
  sharePct: number;
}

// Share of returned requests. Provisional and not yet ruled (prompt 66,
// see placeholders.ts PH-77): these magnitudes render so the card is
// legible but have not gone through a ruling.
export const RETURN_REASONS: ReturnReason[] = [
  { reason: "Missing statement of work", sharePct: 41 },
  { reason: "Incomplete cost centre", sharePct: 22 },
  { reason: "No vendor quote attached", sharePct: 16 },
  { reason: "Wrong buying entity", sharePct: 12 },
  { reason: "Duplicate request", sharePct: 9 },
];

export interface CommodityCycleTime {
  commodity: string;
  days: number;
}

// Average request to purchase order, by commodity.
export const COMMODITY_CYCLE_TIME: CommodityCycleTime[] = [
  { commodity: "Software", days: 8.1 },
  { commodity: "Services", days: 5.8 },
  { commodity: "Catalog", days: 3.2 },
];

// Derived, not authored: the longest commodity's own cycle time.
export const LONGEST_COMMODITY_DAYS = Math.max(
  ...COMMODITY_CYCLE_TIME.map((c) => c.days),
);

// This week.
export const AUTO_CLEARED_COUNT = 57;
export const NEEDS_DECISION_COUNT = 8;

// Derived, not authored.
export const AUTO_CLEARED_TOTAL = AUTO_CLEARED_COUNT + NEEDS_DECISION_COUNT;
export const AUTO_CLEARED_SHARE_PCT = Math.round(
  (AUTO_CLEARED_COUNT / AUTO_CLEARED_TOTAL) * 100,
);

// Twelve weekly values, average request to purchase order in days across
// the quarter. Provisional and not yet ruled (prompt 70, see
// placeholders.ts PH-87): these render so the hero is legible but have
// not gone through a ruling. The final week is not a duplicate literal;
// it is AVG_REQUEST_TO_PO_DAYS itself, the same figure the headline
// interpolates.
export const CYCLE_TIME_TREND_DAYS: number[] = [
  8.1,
  7.9,
  7.6,
  7.7,
  7.4,
  7.1,
  7.2,
  6.9,
  6.7,
  6.6,
  6.5,
  AVG_REQUEST_TO_PO_DAYS,
];

// Also provisional, per PH-87.
export const CYCLE_TIME_TARGET_DAYS = 6;
