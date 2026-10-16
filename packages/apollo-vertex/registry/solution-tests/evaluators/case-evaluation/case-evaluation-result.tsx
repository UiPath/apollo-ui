"use client";

import { AlertCircle, Check, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { useVertexTranslation } from "@/lib/vertex-translation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BaselineCompare } from "../../baseline-compare";
import { EMPTY_VALUE } from "../../constants";
import type { EvaluatorResultProps } from "../registry";
import {
  type CaseEvaluationDetails,
  type EvaluationPair,
  EvaluationPairStatus,
  type EvaluationView,
  SummaryVerdict,
} from "./schema";

// Show what changed first; all-same pairs sink to the bottom.
const pairRank = (pair: EvaluationPair): number => {
  if (pair.status !== EvaluationPairStatus.Compared) return 1;
  return pair.outcome_match && pair.summary_verdict === SummaryVerdict.Same
    ? 2
    : 0;
};

const sortPairs = (pairs: EvaluationPair[]): EvaluationPair[] =>
  pairs.toSorted((a, b) => pairRank(a) - pairRank(b));

// The schema defaults absent fields to "", which should read as "no value".
const presentOrNull = (value: string | undefined): string | null => {
  if (!value) return null;
  return value;
};

/** Informative baseline-vs-new metadata. None of it is scored, so a change
 * gets a neutral flag rather than a failure. */
const PairMetadata = ({ pair }: { pair: EvaluationPair }) => {
  const { t } = useVertexTranslation();
  const { expected, actual } = pair;
  const compared = pair.status === EvaluationPairStatus.Compared;
  const modelChanged =
    (expected?.decision_model_id ?? "") !== (actual?.decision_model_id ?? "");

  return (
    <BaselineCompare
      rows={[
        {
          label: t("pe_eval_field_decision_model"),
          baseline: presentOrNull(expected?.decision_model_id),
          current: presentOrNull(actual?.decision_model_id),
          mono: true,
          marker: compared && modelChanged && (
            <Badge status="info" variant="secondary">
              {t("pe_eval_changed")}
            </Badge>
          ),
        },
        {
          label: t("pe_eval_field_status"),
          baseline: presentOrNull(expected?.status),
          current: presentOrNull(actual?.status),
        },
      ]}
    />
  );
};

const VerdictBadge = ({ same }: { same: boolean }) => {
  const { t } = useVertexTranslation();
  return (
    <Badge status={same ? "success" : "error"} variant="secondary">
      {same ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <X className="size-3" aria-hidden />
      )}
      {t(same ? "pe_eval_same" : "pe_eval_differs")}
    </Badge>
  );
};

const NoCounterpart = () => {
  const { t } = useVertexTranslation();
  return (
    <div className="flex min-w-0 items-center justify-center rounded-md border border-dashed bg-muted/20 p-3">
      <Badge status="error" variant="secondary">
        {t("pe_eval_no_counterpart")}
      </Badge>
    </div>
  );
};

/** One scored field: "<Field> <verdict>", then baseline beside new run. A null
 * `same` (one-sided pair) omits the verdict. */
const ComparedField = ({
  label,
  same,
  reason,
  baseline,
  current,
  children,
}: {
  label: string;
  same: boolean | null;
  reason?: string;
  baseline: ReactNode;
  current: ReactNode;
  children?: ReactNode;
}) => {
  const { t } = useVertexTranslation();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {same != null && <VerdictBadge same={same} />}
        {reason && (
          <span className="text-[11px] italic text-muted-foreground">
            {reason}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldSide label={t("compare_baseline")}>{baseline}</FieldSide>
        <FieldSide label={t("compare_new_run")}>{current}</FieldSide>
      </div>
      {children}
    </div>
  );
};

const FieldSide = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex min-w-0 flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
  </div>
);

const ValueBox = ({ children }: { children: ReactNode }) => (
  <div className="min-w-0 break-words rounded-md border p-3">{children}</div>
);

const OutcomeValue = ({ view }: { view: EvaluationView | null }) => {
  if (!view) return <NoCounterpart />;
  return (
    <ValueBox>
      <p className="text-sm">{view.outcome || EMPTY_VALUE}</p>
    </ValueBox>
  );
};

const SummaryValue = ({ view }: { view: EvaluationView | null }) => {
  const { t } = useVertexTranslation();
  if (!view) return <NoCounterpart />;
  return (
    <ValueBox>
      {view.error_message && (
        // A faulted evaluation's backend error would otherwise be invisible:
        // for passed/failed rows the run view renders only this evaluator
        // component, not the raw-output panel that also carries the error.
        <Alert status="error" visual="tinted" className="mb-2">
          <TriangleAlert />
          <AlertTitle>{t("pe_eval_faulted")}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap break-words">
            {view.error_message}
          </AlertDescription>
        </Alert>
      )}
      {view.summary ? (
        <p className="whitespace-pre-wrap text-sm">{view.summary}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("pe_eval_no_summary")}
        </p>
      )}
    </ValueBox>
  );
};

/** One matched (or one-sided) policy evaluation: informative metadata, then
 * the two scored fields. */
const PairSection = ({ pair }: { pair: EvaluationPair }) => {
  const { t } = useVertexTranslation();
  const compared = pair.status === EvaluationPairStatus.Compared;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {!compared && (
        <Badge status="error" variant="secondary" className="w-fit">
          {t(
            pair.status === EvaluationPairStatus.MissingInActual
              ? "pe_eval_status_missing"
              : "pe_eval_status_new",
          )}
        </Badge>
      )}
      <PairMetadata pair={pair} />
      <ComparedField
        label={t("pe_eval_field_outcome")}
        same={compared ? pair.outcome_match : null}
        baseline={<OutcomeValue view={pair.expected} />}
        current={<OutcomeValue view={pair.actual} />}
      />
      <ComparedField
        label={t("pe_eval_field_summary")}
        same={compared ? pair.summary_verdict === SummaryVerdict.Same : null}
        reason={pair.summary_reason}
        baseline={<SummaryValue view={pair.expected} />}
        current={<SummaryValue view={pair.actual} />}
      >
        {pair.summary_deltas.length > 0 && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
            <p className="text-xs font-medium">
              {t("pe_eval_semantic_deltas")}
            </p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {pair.summary_deltas.map((delta) => (
                <li key={delta}>{delta}</li>
              ))}
            </ul>
          </div>
        )}
      </ComparedField>
    </div>
  );
};

/** Case-evaluation evaluator view: baseline-vs-new comparison of the policy
 * engine's evaluations, matched by policy — outcome exact-matched, summary
 * judged semantically. Renders entirely from the evaluator details (validated
 * by the registry, so they arrive already typed). */
export const CaseEvaluationResult = ({
  evaluatorDetails,
}: EvaluatorResultProps<CaseEvaluationDetails>) => {
  const { t } = useVertexTranslation();
  const { pairs, count_mismatch, expected_count, actual_count } =
    evaluatorDetails;

  // whitespace-normal: the shadcn TableCell that hosts this expanded content
  // sets `whitespace-nowrap`, which inherits; reset it so summaries wrap.
  return (
    <div className="flex min-w-0 flex-col gap-4 whitespace-normal">
      {count_mismatch && (
        <Alert status="error" visual="tinted">
          <AlertCircle />
          <AlertTitle>{t("pe_eval_count_mismatch_title")}</AlertTitle>
          <AlertDescription>
            {t("pe_eval_count_mismatch_body", {
              expected: expected_count,
              actual: actual_count,
            })}
          </AlertDescription>
        </Alert>
      )}

      {pairs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("pe_eval_no_pairs")}</p>
      ) : (
        <div className="flex min-w-0 flex-col divide-y [&>*:not(:first-child)]:pt-4 [&>*:not(:last-child)]:pb-4">
          {sortPairs(pairs).map((pair, i) => (
            // A missing and a new pair can share a policy id and the list
            // never reorders after render, so the index is a safe key.
            // oxlint-disable-next-line react(no-array-index-key)
            <PairSection key={i} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
};
