"use client";

import { Fragment } from "react";
import { z } from "zod";
import { resolveEvaluatorRenderer } from "./evaluators/registry";
import type { SolutionTestRunResult } from "./types";

/** The `EvaluatorResults` attachment is untrusted wire data, so it's validated
 * at the fetch boundary via `parseEvaluatorResults`. Each value's `details`
 * stays `unknown` until the resolved renderer validates it against that
 * evaluator's schema. */
const EvaluatorResultsSchema = z.record(
  z.string(),
  z.object({ score: z.number().optional(), details: z.unknown().optional() }),
);
export type EvaluatorResults = z.infer<typeof EvaluatorResultsSchema>;

/** Validate the raw `EvaluatorResults` attachment (a JSON string or object)
 * into a typed map, or `null` if it's absent / not a valid results map. This
 * is the trust boundary — callers pass the parsed result on as a typed prop. */
export function parseEvaluatorResults(data: unknown): EvaluatorResults | null {
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
  return parsed.success ? parsed.data : null;
}

interface EvaluatorResultsViewProps {
  data: EvaluatorResults;
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
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(data).map(([evaluatorId, evaluator]) => (
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
