"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  makeProcessOutputRenderer,
  type ProcessOutputProps,
} from "../registry";
import {
  type CaseEvaluationOutput,
  CaseEvaluationOutputSchema,
  type EvaluationRecord,
} from "./schema";

/** One policy-engine evaluation: outcome + confidence header, summary prose,
 * and the record's own error when the evaluation faulted. */
const EvaluationCard = ({ evaluation }: { evaluation: EvaluationRecord }) => {
  const { t } = useTranslation();
  const faulted = evaluation.STATUS === "faulted";
  // `||`, not `??`: an empty OUTCOME string also means "no outcome".
  // oxlint-disable-next-line typescript-eslint(prefer-nullish-coalescing)
  const outcome = evaluation.OUTCOME || t("pe_output_no_outcome");
  const confidence =
    evaluation.OUTCOMECONFIDENCE == null
      ? null
      : Math.round(evaluation.OUTCOMECONFIDENCE * 100);

  return (
    <div className="flex min-w-0 flex-col gap-2 break-words rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t("pe_output_outcome")}
        </span>
        <Badge status={faulted ? "error" : "info"} variant="secondary">
          {outcome}
        </Badge>
        {confidence != null && (
          <span className="text-xs text-muted-foreground">
            {t("pe_output_confidence", { percent: confidence })}
          </span>
        )}
      </div>
      {evaluation.SUMMARY && (
        <p className="whitespace-pre-wrap text-sm">{evaluation.SUMMARY}</p>
      )}
      {faulted && evaluation.ERRORMESSAGE && (
        <p className="text-sm text-destructive">{evaluation.ERRORMESSAGE}</p>
      )}
    </div>
  );
};

/** evaluate_case job output: one card per processed Evaluations record. */
export const CaseEvaluationOutputResult = ({
  output,
}: ProcessOutputProps<CaseEvaluationOutput>) => {
  const { t } = useTranslation();

  if (output.evaluations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("pe_output_no_evaluations")}
      </p>
    );
  }

  // whitespace-normal: the shadcn TableCell that hosts this expanded content
  // sets `whitespace-nowrap`, which inherits; reset it so summaries wrap.
  return (
    <div className="flex min-w-0 flex-col gap-2 whitespace-normal">
      {output.evaluations.map((evaluation, i) => (
        // Record ids are per-run noise and the list never reorders after render.
        // oxlint-disable-next-line react(no-array-index-key)
        <EvaluationCard key={i} evaluation={evaluation} />
      ))}
    </div>
  );
};

// Bind to a vertical's policy-engine evaluate_case agent via config.outputRenderers.
export const CASE_EVALUATION_OUTPUT_RENDERER = makeProcessOutputRenderer(
  CaseEvaluationOutputSchema,
  CaseEvaluationOutputResult,
  {},
);
