import { z } from "zod";

/** Per-pair status the case-evaluation evaluator emits (mirrors the BE pair
 * statuses in shared/solution_tests/evaluators/case_evaluation.py). */
export const EvaluationPairStatus = {
  Compared: "compared",
  MissingInActual: "missing_in_actual",
  NewInActual: "new_in_actual",
} as const;

export const SummaryVerdict = {
  Same: "same",
  Differs: "differs",
} as const;

const EvaluationViewSchema = z.object({
  outcome: z.string().optional().default(""),
  confidence: z.number().nullable().optional().default(null),
  summary: z.string().optional().default(""),
  // Per-version record id; differs between sides when the model was edited.
  decision_model_id: z.string().optional().default(""),
  status: z.string().optional().default(""),
  error_message: z.string().optional().default(""),
});

const EvaluationPairSchema = z.object({
  // The stable identity the two sides were matched on.
  policy_id: z.string().optional().default(""),
  // An unknown status fails validation rather than rendering as "new".
  status: z.enum(EvaluationPairStatus),
  outcome_match: z.boolean().optional().default(false),
  // Empty on one-sided pairs; any other unknown verdict fails validation.
  summary_verdict: z
    .union([z.enum(SummaryVerdict), z.literal("")])
    .optional()
    .default(""),
  summary_deltas: z.array(z.string()).optional().default([]),
  summary_reason: z.string().optional().default(""),
  // Absent on a new evaluation (no baseline) / a removed one (no new run).
  expected: EvaluationViewSchema.nullable().optional().default(null),
  actual: EvaluationViewSchema.nullable().optional().default(null),
});

export const CaseEvaluationDetailsSchema = z.object({
  count_mismatch: z.boolean(),
  expected_count: z.number(),
  actual_count: z.number(),
  pairs: z.array(EvaluationPairSchema),
  same_count: z.number(),
  outcome_mismatch_count: z.number(),
  summary_differs_count: z.number(),
  missing_count: z.number(),
  added_count: z.number(),
});

export type CaseEvaluationDetails = z.infer<typeof CaseEvaluationDetailsSchema>;
export type EvaluationPair = z.infer<typeof EvaluationPairSchema>;
export type EvaluationView = z.infer<typeof EvaluationViewSchema>;
