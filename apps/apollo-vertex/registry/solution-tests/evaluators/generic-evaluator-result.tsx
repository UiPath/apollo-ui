"use client";

import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useSolutionTestsConfig } from "../context";
import { JsonPanel } from "./output-panels";
import type { EvaluatorResultProps } from "./registry";

/** Schema for evaluators without a custom view (json-similarity, llm-judge):
 * a score + optional justification, plus the raw expected/actual outputs. */
export const GenericEvaluatorDetailsSchema = z.object({
  justification: z.string().optional(),
});
export type GenericEvaluatorDetails = z.infer<
  typeof GenericEvaluatorDetailsSchema
>;

function scoreColorClass(
  score: number | undefined,
  passThreshold: number,
): string {
  if (score == null) return "text-muted-foreground";
  return score >= passThreshold ? "text-success" : "text-destructive";
}

export const GenericEvaluatorResult = ({
  evaluatorId,
  label,
  score,
  evaluatorDetails,
  expectedOutput,
  actualOutput,
}: EvaluatorResultProps<GenericEvaluatorDetails> & { label?: string }) => {
  const { t } = useTranslation();
  const { passThreshold } = useSolutionTestsConfig();
  const displayLabel = label ?? evaluatorId;
  const justification = evaluatorDetails.justification;
  const scoreStr = score == null ? "—" : `${Math.round(score * 100)}%`;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{displayLabel}</span>
          <span
            className={`text-sm font-semibold ${scoreColorClass(score, passThreshold)}`}
          >
            {scoreStr}
          </span>
        </div>
        {justification && (
          <p className="mt-2 whitespace-pre-wrap text-xs">{justification}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <JsonPanel title={t("expected_output")} data={expectedOutput} />
        <JsonPanel title={t("actual_output")} data={actualOutput} />
      </div>
    </div>
  );
};
