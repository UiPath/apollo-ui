"use client";

import { z } from "zod";
import { resolveEvaluatorComponent } from "./evaluators/registry";
import type { SolutionTestRunResult } from "./types";

/** Each value's `details` is evaluator-specific, so it stays `unknown` here —
 * the resolved component validates the shape it expects. */
const EvaluatorResultsSchema = z.record(
  z.string(),
  z.object({ score: z.number().optional(), details: z.unknown().optional() }),
);

interface EvaluatorResultsViewProps {
  data: unknown;
  expected: unknown;
  actual: unknown;
  result: SolutionTestRunResult;
}

/** Renders each evaluator's result through the component registered for its id
 * (falling back to the generic card). The evaluator id is the object key — no
 * schema-sniffing needed. */
export const EvaluatorResultsView = ({
  data,
  expected,
  actual,
  result,
}: EvaluatorResultsViewProps) => {
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
    <div className="flex flex-col gap-4">
      {entries.map(([evaluatorId, evaluator]) => {
        const Component = resolveEvaluatorComponent(evaluatorId);
        return (
          <Component
            key={evaluatorId}
            evaluatorId={evaluatorId}
            score={evaluator.score}
            details={evaluator.details}
            expected={expected}
            actual={actual}
            result={result}
          />
        );
      })}
    </div>
  );
};
