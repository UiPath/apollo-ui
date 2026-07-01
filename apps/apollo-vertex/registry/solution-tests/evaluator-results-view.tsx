"use client";

import { Fragment } from "react";
import { z } from "zod";
import { resolveEvaluatorRenderer } from "./evaluators/registry";
import type { SolutionTestRunResult } from "./types";

/** The `EvaluatorResults` attachment is untrusted wire data, so it's validated
 * at runtime here. Each value's `details` stays `unknown` until the resolved
 * renderer validates it against that evaluator's schema. */
const EvaluatorResultsSchema = z.record(
  z.string(),
  z.object({ score: z.number().optional(), details: z.unknown().optional() }),
);

interface EvaluatorResultsViewProps {
  data: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  result: SolutionTestRunResult;
}

/** Renders each evaluator's result through the renderer registered for its id
 * (falling back to the generic card). The evaluator id is the object key — no
 * schema-sniffing needed. */
export const EvaluatorResultsView = ({
  data,
  expectedOutput,
  actualOutput,
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
      {entries.map(([evaluatorId, evaluator]) => (
        <Fragment key={evaluatorId}>
          {resolveEvaluatorRenderer(evaluatorId)({
            evaluatorId,
            score: evaluator.score,
            rawDetails: evaluator.details,
            expectedOutput,
            actualOutput,
            result,
          })}
        </Fragment>
      ))}
    </div>
  );
};
