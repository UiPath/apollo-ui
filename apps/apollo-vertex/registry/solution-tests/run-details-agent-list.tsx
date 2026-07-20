"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";
import { cn } from "@/lib/utils";
import { defaultRunResultStatusLabels } from "./constants";
import { resultBadgeClassMap, runResultStatusBadgeMap } from "./status-maps";
import { RunResultStatus, type SolutionTestRunResult } from "./types";

export interface RunDetailsAgentListProps {
  results: SolutionTestRunResult[];
  selectedResultId: string | undefined;
  isLoading: boolean;
  onSelect: (resultId: string) => void;
}

export const RunDetailsAgentList = ({
  results,
  selectedResultId,
  isLoading,
  onSelect,
}: RunDetailsAgentListProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-[320px] min-h-0 shrink-0 flex-col border-r border-border">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs font-bold leading-none text-muted-foreground">
          {t("agents")}
        </h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : results.length === 0 ? (
          <Empty>
            <EmptyDescription>{t("no_results_available")}</EmptyDescription>
          </Empty>
        ) : (
          results.map((result) => (
            <RunDetailsAgentItem
              key={result.Id}
              result={result}
              selected={result.Id === selectedResultId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface RunDetailsAgentItemProps {
  result: SolutionTestRunResult;
  selected: boolean;
  onSelect: (resultId: string) => void;
}

const RunDetailsAgentItem = ({
  result,
  selected,
  onSelect,
}: RunDetailsAgentItemProps) => {
  const status = result.Status;
  const showScore =
    status === RunResultStatus.Passed || status === RunResultStatus.Failed;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(result.Id)}
      className={cn(
        "flex w-full flex-col gap-2 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0",
        selected ? "bg-muted" : "cursor-pointer hover:bg-muted/50",
      )}
    >
      <span className="text-sm font-semibold text-foreground">
        {result.ProcessName}
      </span>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          status={runResultStatusBadgeMap[status] ?? "info"}
          className={resultBadgeClassMap[status]}
        >
          {defaultRunResultStatusLabels[status] ?? "Unknown"}
        </Badge>
        {showScore && (
          <span className="text-xs font-medium text-muted-foreground">
            {renderValueOrEmptyState(result.Score, {
              type: "number",
              options: { style: "percent", maximumFractionDigits: 0 },
            })}
          </span>
        )}
      </div>
    </button>
  );
};
