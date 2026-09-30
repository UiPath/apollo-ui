import { z } from "zod";

/** One Evaluations record echoed by evaluate_case (File-typed fields omitted).
 * Unknown fields are stripped; only what the renderer shows is modeled. */
const EvaluationRecordSchema = z.object({
  OUTCOME: z.string().nullish(),
  OUTCOMECONFIDENCE: z.number().nullish(),
  SUMMARY: z.string().nullish(),
  STATUS: z.string().nullish(),
  ERRORMESSAGE: z.string().nullish(),
});

/** evaluate_case job output. `evaluations` is required so pre-enrichment
 * outputs (which only carried evaluation ids) fall back to the raw JSON view. */
export const CaseEvaluationOutputSchema = z.object({
  status: z.string().nullish(),
  evaluations: z.array(EvaluationRecordSchema),
});

export type CaseEvaluationOutput = z.infer<typeof CaseEvaluationOutputSchema>;
export type EvaluationRecord = z.infer<typeof EvaluationRecordSchema>;
