"use client";

import { z } from "zod";
import { EVALUATOR_LABELS } from "./constants";
import { useSolutionTestsConfig } from "./context";

const EvaluatorResultSchema = z.object({
  score: z.number().optional(),
  details: z.object({ justification: z.string().optional() }).optional(),
});
const EvaluatorResultsSchema = z.record(z.string(), EvaluatorResultSchema);

/** Tailwind color for an evaluator score: muted when absent, else pass/fail. */
function scoreColorClass(
  score: number | undefined,
  passThreshold: number,
): string {
  if (score == null) return "text-muted-foreground";
  return score >= passThreshold ? "text-green-600" : "text-red-500";
}

export const EvaluatorResultsView = ({ data }: { data: unknown }) => {
  const { passThreshold } = useSolutionTestsConfig();
  if (data == null) return null;

  let raw: unknown = data;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  const parsed = EvaluatorResultsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const entries = Object.entries(parsed.data);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([evaluatorId, evaluator]) => {
        const score = evaluator.score;
        const scoreStr = score == null ? "—" : `${Math.round(score * 100)}%`;
        const justification = evaluator.details?.justification;
        const label = EVALUATOR_LABELS[evaluatorId] ?? evaluatorId;

        return (
          <div key={evaluatorId} className="rounded-md border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <span
                className={`text-sm font-semibold ${scoreColorClass(score, passThreshold)}`}
              >
                {scoreStr}
              </span>
            </div>
            {justification && (
              <p className="mt-2 whitespace-pre-wrap text-xs">
                {justification}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
