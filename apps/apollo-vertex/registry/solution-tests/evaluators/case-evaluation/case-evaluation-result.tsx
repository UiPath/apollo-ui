"use client";

import { AlertCircle, Check, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BaselineCompare } from "../../baseline-compare";
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

const formatConfidence = (view: EvaluationView | null): string | null =>
  view?.confidence == null ? null : `${Math.round(view.confidence * 100)}%`;

// The schema defaults absent fields to "", which should read as "no value".
const presentOrNull = (value: string | undefined): string | null => {
  if (!value) return null;
  return value;
};

/** Flags a field that differs between the two runs. */
const ChangedBadge = ({ status }: { status: "error" | "warning" }) => {
  const { t } = useTranslation();
  return (
    <Badge status={status} variant="secondary">
      {t("pe_eval_changed")}
    </Badge>
  );
};

/** The scalar fields of a pair, baseline beside new run. */
const PairFields = ({ pair }: { pair: EvaluationPair }) => {
  const { t } = useTranslation();
  const { expected, actual } = pair;
  const compared = pair.status === EvaluationPairStatus.Compared;
  // The decision-model id is a per-version record id; a new one alone doesn't
  // fail the pair (matching is by policy), so it gets a softer flag.
  const modelChanged =
    (expected?.decision_model_id ?? "") !== (actual?.decision_model_id ?? "");

  return (
    <BaselineCompare
      rows={[
        {
          label: t("pe_eval_field_outcome"),
          baseline: presentOrNull(expected?.outcome),
          current: presentOrNull(actual?.outcome),
          marker: compared && !pair.outcome_match && (
            <ChangedBadge status="error" />
          ),
        },
        {
          label: t("pe_eval_field_confidence"),
          baseline: formatConfidence(expected),
          current: formatConfidence(actual),
        },
        {
          label: t("pe_eval_field_decision_model"),
          baseline: presentOrNull(expected?.decision_model_id),
          current: presentOrNull(actual?.decision_model_id),
          mono: true,
          marker: compared && modelChanged && <ChangedBadge status="warning" />,
        },
      ]}
    />
  );
};

/** One run's summary prose, or a "no counterpart" chip for a one-sided pair. */
const SummarySide = ({ view }: { view: EvaluationView | null }) => {
  const { t } = useTranslation();
  if (!view) {
    return (
      <div className="flex min-w-0 items-center justify-center rounded-md border border-dashed bg-muted/20 p-3">
        <Badge status="error" variant="secondary">
          {t("pe_eval_no_counterpart")}
        </Badge>
      </div>
    );
  }
  return (
    <div className="min-w-0 break-words rounded-md border p-3">
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
    </div>
  );
};

/** Baseline and new summaries side by side, with the judge's verdict and its
 * enumerated semantic deltas. */
const SummaryComparison = ({ pair }: { pair: EvaluationPair }) => {
  const { t } = useTranslation();
  const compared = pair.status === EvaluationPairStatus.Compared;
  const same = pair.summary_verdict === SummaryVerdict.Same;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {t("pe_eval_field_summary")}
        </span>
        {compared && (
          <Badge status={same ? "success" : "warning"} variant="secondary">
            {same ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <TriangleAlert className="size-3" aria-hidden />
            )}
            {t(same ? "pe_eval_summary_same" : "pe_eval_summary_differs")}
          </Badge>
        )}
        {pair.summary_reason && (
          <span className="text-[11px] italic text-muted-foreground">
            {pair.summary_reason}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SummarySide view={pair.expected} />
        <SummarySide view={pair.actual} />
      </div>
      {pair.summary_deltas.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
          <p className="text-xs font-medium">{t("pe_eval_semantic_deltas")}</p>
          <ul className="mt-1 list-disc pl-4 text-sm">
            {pair.summary_deltas.map((delta) => (
              <li key={delta}>{delta}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/** One matched (or one-sided) policy evaluation: fields diff table + summaries. */
const PairRow = ({ pair }: { pair: EvaluationPair }) => {
  const { t } = useTranslation();
  const oneSided = pair.status !== EvaluationPairStatus.Compared;
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-muted-foreground">
          {t("pe_eval_policy")}
        </span>
        <span className="font-mono">{pair.policy_id || "—"}</span>
        {oneSided && (
          <Badge status="error" variant="secondary">
            {t(
              pair.status === EvaluationPairStatus.MissingInActual
                ? "pe_eval_status_missing"
                : "pe_eval_status_new",
            )}
          </Badge>
        )}
      </div>
      <PairFields pair={pair} />
      <SummaryComparison pair={pair} />
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
  const { t } = useTranslation();
  const {
    pairs,
    count_mismatch,
    expected_count,
    actual_count,
    same_count,
    outcome_mismatch_count,
    summary_differs_count,
    missing_count,
    added_count,
  } = evaluatorDetails;

  const summary = [
    {
      show: same_count > 0,
      status: "success",
      key: "pe_eval_count_same",
      count: same_count,
    },
    {
      show: outcome_mismatch_count > 0,
      status: "error",
      key: "pe_eval_count_outcome_mismatch",
      count: outcome_mismatch_count,
    },
    {
      show: summary_differs_count > 0,
      status: "warning",
      key: "pe_eval_count_summary_differs",
      count: summary_differs_count,
    },
    {
      show: missing_count > 0,
      status: "error",
      key: "pe_eval_count_missing",
      count: missing_count,
    },
    {
      show: added_count > 0,
      status: "error",
      key: "pe_eval_count_new",
      count: added_count,
    },
  ] as const;

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

      <div className="flex flex-wrap items-center gap-2">
        {summary
          .filter((s) => s.show)
          .map((s) => (
            <Badge key={s.key} status={s.status} variant="secondary">
              {t(s.key, { count: s.count })}
            </Badge>
          ))}
      </div>

      {pairs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("pe_eval_no_pairs")}</p>
      ) : (
        <div className="flex min-w-0 flex-col gap-3">
          {sortPairs(pairs).map((pair, i) => (
            // A missing and a new pair can share a policy id and the list
            // never reorders after render, so the index is a safe key.
            // oxlint-disable-next-line react(no-array-index-key)
            <PairRow key={i} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
};
