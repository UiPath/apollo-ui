"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useSolutionTestsConfig } from "./context";
import { RunResultStatus } from "./types";
import type { SolutionTestRunResult } from "./types";
import { hasAutoPass } from "./utils";
import { UserMessagesView } from "./user-messages-view";
import {
  EvaluatorResultsView,
  parseEvaluatorResults,
} from "./evaluator-results-view";
import { JsonPanel } from "./evaluators/output-panels";
import { ProcessOutputView } from "./outputs/process-output-view";

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
  const { showDebug } = useSolutionTestsConfig();
  const [debugOpen, setDebugOpen] = useState(false);
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
  const evaluatorResults = parseEvaluatorResults(data.evaluatorResults);
  const hasEvaluatorResults =
    evaluatorResults != null && Object.keys(evaluatorResults).length > 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <UserMessagesView messages={result.UserMessages} />

      {isPassedOrFailed &&
        !isAutoPass &&
        (hasEvaluatorResults ? (
          <EvaluatorResultsView
            data={evaluatorResults}
            expectedOutput={data.expected}
            actualOutput={data.actual}
            result={result}
          />
        ) : (
          // No parseable evaluator results — fall back to the raw output panels
          // so a passed/failed row always shows something.
          <div className="grid grid-cols-2 gap-4">
            <JsonPanel title={t("expected_output")} data={data.expected} />
            <JsonPanel title={t("actual_output")} data={data.actual} />
          </div>
        ))}

      {/* Dev-only debug aid, identical for every status. */}
      {showDebug && (
        <Collapsible
          open={debugOpen}
          onOpenChange={setDebugOpen}
          className="rounded-md border border-dashed"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-2 p-3 text-left text-sm font-medium text-muted-foreground hover:bg-muted/30">
            <ChevronRight
              className={`size-4 shrink-0 transition-transform ${debugOpen ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
            {t("debug_dev_only")}
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-4 border-t p-3">
            <div className="grid grid-cols-2 gap-4">
              <JsonPanel title={t("expected_output")} data={data.expected} />
              <JsonPanel title={t("actual_output")} data={data.actual} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <JsonPanel
                title={t("expected_input")}
                data={data.expectedInput}
              />
              <JsonPanel title={t("actual_input")} data={data.actualInput} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {status === RunResultStatus.Missing && (
        <ProcessOutputView
          title={t("expected_output")}
          agentId={result.AgentId}
          processName={result.ProcessName}
          output={data.expected}
        />
      )}

      {status === RunResultStatus.NoBaseline &&
        (data.actual == null ? (
          <div>
            <h4 className="mb-2 text-sm font-semibold">{t("actual_output")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("agent_produced_no_output")}
            </p>
          </div>
        ) : (
          <ProcessOutputView
            title={t("actual_output")}
            agentId={result.AgentId}
            processName={result.ProcessName}
            output={data.actual}
          />
        ))}

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
          {data.actual != null && (
            <ProcessOutputView
              title={t("actual_output")}
              agentId={result.AgentId}
              processName={result.ProcessName}
              output={data.actual}
            />
          )}
        </>
      )}
    </div>
  );
};
