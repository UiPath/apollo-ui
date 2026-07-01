"use client";

import { useTranslation } from "react-i18next";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { RunResultStatus } from "./types";
import type { SolutionTestRunResult } from "./types";
import { hasAutoPass } from "./utils";
import { UserMessagesView } from "./user-messages-view";
import { EvaluatorResultsView } from "./evaluator-results-view";
import { JsonPanel, formatJson } from "./evaluators/output-panels";

export interface ExpandedRowData {
  loading: boolean;
  expected?: unknown;
  expectedInput?: unknown;
  actual?: unknown;
  actualInput?: unknown;
  evaluatorResults?: unknown;
}

interface ResultExpandedContentProps {
  result: SolutionTestRunResult;
  data: ExpandedRowData | undefined;
}

export const ResultExpandedContent = ({
  result,
  data,
}: ResultExpandedContentProps) => {
  const { t } = useTranslation();
  const status = result.Status;

  if (data?.loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-4 w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Empty>
        <EmptyDescription>{t("no_data_available")}</EmptyDescription>
      </Empty>
    );
  }

  const isAutoPass = hasAutoPass(data.evaluatorResults);
  const isPassedOrFailed =
    status === RunResultStatus.Passed || status === RunResultStatus.Failed;

  return (
    <div className="flex flex-col gap-4 p-4">
      <UserMessagesView messages={result.UserMessages} />

      {isPassedOrFailed && !isAutoPass && (
        <EvaluatorResultsView
          data={data.evaluatorResults}
          expectedOutput={data.expected}
          actualOutput={data.actual}
          result={result}
        />
      )}

      {status === RunResultStatus.Missing && (
        <JsonPanel title={t("expected_output")} data={data.expected} />
      )}

      {status === RunResultStatus.NoBaseline && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">{t("actual_output")}</h4>
          {data.actual ? (
            <div className="max-h-[30vh] overflow-auto rounded-md border bg-muted/50 p-3">
              <pre className="whitespace-pre-wrap break-words text-xs">
                {formatJson(data.actual)}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("agent_produced_no_output")}
            </p>
          )}
        </div>
      )}

      {status === RunResultStatus.Error && (
        <>
          {result.ErrorMessage && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("error")}</h4>
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <pre className="whitespace-pre-wrap break-words text-xs">
                  {result.ErrorMessage}
                </pre>
              </div>
            </div>
          )}
          {data.actual && (
            <JsonPanel title={t("actual_output")} data={data.actual} />
          )}
        </>
      )}
    </div>
  );
};
