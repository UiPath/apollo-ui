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
