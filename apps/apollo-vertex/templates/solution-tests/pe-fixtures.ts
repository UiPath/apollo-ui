/**
 * Demo payloads for the policy-engine agent: its evaluate_case job output and
 * the `uipath-pe-case-evaluation` evaluator details, in a passing and a
 * failing variant.
 */

import type { CaseEvaluationDetails } from "@/registry/solution-tests/evaluators/case-evaluation/schema";
import type { CaseEvaluationOutput } from "@/registry/solution-tests/outputs/case-evaluation/schema";

const DECISION_MODEL_V1 = "5f0c2a4e-8d1b-4c7a-9e3f-2b6d8a1c4e70";
const DECISION_MODEL_V2 = "a93e7b12-4c5d-4f8e-b1a6-7d2c9e0f3b58";

export const PE_OUTPUT_FIXTURE: CaseEvaluationOutput = {
  status: "Completed.",
  evaluations: [
    {
      OUTCOME: "Eligible",
      OUTCOMECONFIDENCE: 0.94,
      SUMMARY:
        "Debt-service coverage of 1.42 clears the 1.25 minimum and the loan-to-value of 68% is within the 75% limit.",
      STATUS: "success",
      ERRORMESSAGE: null,
    },
    {
      OUTCOME: "Refer",
      OUTCOMECONFIDENCE: 0.71,
      SUMMARY:
        "The guarantor's credit report is older than 90 days, so the policy refers the case for manual review.",
      STATUS: "success",
      ERRORMESSAGE: null,
    },
  ],
};

export const PE_OUTPUT_CHANGED_FIXTURE: CaseEvaluationOutput = {
  status: "Completed.",
  evaluations: [
    PE_OUTPUT_FIXTURE.evaluations[0],
    {
      OUTCOME: "Ineligible",
      OUTCOMECONFIDENCE: 0.88,
      SUMMARY:
        "The guarantor's credit report is older than 90 days, which the updated policy treats as a hard stop.",
      STATUS: "success",
      ERRORMESSAGE: null,
    },
  ],
};

const eligibleView = {
  outcome: "Eligible",
  confidence: 0.94,
  summary: PE_OUTPUT_FIXTURE.evaluations[0].SUMMARY ?? "",
  decision_model_id: DECISION_MODEL_V1,
  status: "success",
  error_message: "",
};

const referView = {
  outcome: "Refer",
  confidence: 0.71,
  summary: PE_OUTPUT_FIXTURE.evaluations[1].SUMMARY ?? "",
  decision_model_id: DECISION_MODEL_V1,
  status: "success",
  error_message: "",
};

export const PE_EVALUATOR_SAME_FIXTURE: CaseEvaluationDetails = {
  count_mismatch: false,
  expected_count: 2,
  actual_count: 2,
  pairs: [
    {
      policy_id: "POL-DSCR-001",
      status: "compared",
      outcome_match: true,
      summary_verdict: "same",
      summary_deltas: [],
      summary_reason: "",
      expected: eligibleView,
      actual: eligibleView,
    },
    {
      policy_id: "POL-GUAR-004",
      status: "compared",
      outcome_match: true,
      summary_verdict: "same",
      summary_deltas: [],
      summary_reason: "",
      expected: referView,
      actual: referView,
    },
  ],
  same_count: 2,
  outcome_mismatch_count: 0,
  summary_differs_count: 0,
  missing_count: 0,
  added_count: 0,
};

export const PE_EVALUATOR_CHANGED_FIXTURE: CaseEvaluationDetails = {
  ...PE_EVALUATOR_SAME_FIXTURE,
  pairs: [
    PE_EVALUATOR_SAME_FIXTURE.pairs[0],
    {
      policy_id: "POL-GUAR-004",
      status: "compared",
      outcome_match: false,
      summary_verdict: "differs",
      summary_deltas: [
        "A stale guarantor credit report now fails the case instead of referring it.",
      ],
      summary_reason: "",
      expected: referView,
      actual: {
        outcome: "Ineligible",
        confidence: 0.88,
        summary: PE_OUTPUT_CHANGED_FIXTURE.evaluations[1].SUMMARY ?? "",
        decision_model_id: DECISION_MODEL_V2,
        status: "success",
        error_message: "",
      },
    },
  ],
  same_count: 1,
  outcome_mismatch_count: 1,
  summary_differs_count: 1,
};
