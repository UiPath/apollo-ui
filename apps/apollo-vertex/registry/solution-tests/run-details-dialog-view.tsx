"use client";

/* eslint-disable max-lines -- run-results dialog with baseline actions */
import { ArrowLeftRight, ChevronDown, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";
import { defaultRunResultStatusLabels } from "./constants";
import { useSolutionTestsConfig } from "./context";
import {
  type ExpandedRowData,
  ResultExpandedContent,
} from "./result-expanded-content";
import { resultBadgeClassMap, runResultStatusBadgeMap } from "./status-maps";
import { RunResultStatus, type SolutionTestRunResult } from "./types";

export type BaselineJobMap = Map<
  string,
  { id: string; sourceRunResultId?: string }
>;

export interface RunDetailsDialogViewProps {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  results: SolutionTestRunResult[];
  isLoading: boolean;
  baselineJobMap: BaselineJobMap;
  expandedRows: Set<string>;
  rowData: Record<string, ExpandedRowData>;
  adoptingResultId: string | null;
  updatingResultId: string | null;
  removingBaselineId: string | null;
  onToggleRow: (result: SolutionTestRunResult) => void;
  onAdopt: (resultId: string) => void;
  onUpdateBaseline: (resultId: string) => void;
  onRemoveBaseline: (baselineId: string) => void;
}

export const RunDetailsDialogView = ({
  open,
  onClose,
  subjectId,
  results,
  isLoading,
  baselineJobMap,
  expandedRows,
  rowData,
  adoptingResultId,
  updatingResultId,
  removingBaselineId,
  onToggleRow,
  onAdopt,
  onUpdateBaseline,
  onRemoveBaseline,
}: RunDetailsDialogViewProps) => {
  const { t } = useTranslation();
  const config = useSolutionTestsConfig();

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-hidden"
        style={{ maxWidth: "75vw", width: "75vw" }}
      >
        <DialogHeader>
          <DialogTitle>
            {`${
              config.subjectNoun
                ? t("subject_run_results", {
                    subject: config.subjectNoun.singular,
                    id: subjectId,
                  })
                : subjectId
            } — ${t("run_results")}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("run_results_description")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("no_results_available")}
          </div>
        ) : (
          <div className="max-h-[80vh] overflow-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 px-3 py-2" />
                    <TableHead className="px-3 py-2">
                      {t("agent_name")}
                    </TableHead>
                    <TableHead className="px-3 py-2">
                      {t("baseline_agent_version")}
                    </TableHead>
                    <TableHead className="px-3 py-2">
                      {t("tested_agent_version")}
                    </TableHead>
                    <TableHead className="px-3 py-2">{t("score")}</TableHead>
                    <TableHead className="px-3 py-2">{t("status")}</TableHead>
                    <TableHead className="px-3 py-2 text-center">
                      {t("in_baseline")}
                    </TableHead>
                    <TableHead className="px-3 py-2">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <ResultRow
                      key={result.Id}
                      result={result}
                      expanded={expandedRows.has(result.Id)}
                      rowData={rowData[result.Id]}
                      baselineJobMap={baselineJobMap}
                      adoptPending={adoptingResultId === result.Id}
                      updatePending={updatingResultId === result.Id}
                      removePendingId={removingBaselineId}
                      onToggle={() => onToggleRow(result)}
                      onAdopt={onAdopt}
                      onUpdateBaseline={onUpdateBaseline}
                      onRemoveBaseline={onRemoveBaseline}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------

interface ResultRowProps {
  result: SolutionTestRunResult;
  expanded: boolean;
  rowData: ExpandedRowData | undefined;
  baselineJobMap: BaselineJobMap;
  adoptPending: boolean;
  updatePending: boolean;
  removePendingId: string | null;
  onToggle: () => void;
  onAdopt: (resultId: string) => void;
  onUpdateBaseline: (resultId: string) => void;
  onRemoveBaseline: (baselineId: string) => void;
}

const ResultRow = ({
  result,
  expanded,
  rowData,
  baselineJobMap,
  adoptPending,
  updatePending,
  removePendingId,
  onToggle,
  onAdopt,
  onUpdateBaseline,
  onRemoveBaseline,
}: ResultRowProps) => {
  const { t } = useTranslation();
  const status = result.Status;
  const versionChanged =
    result.BaselineProcessVersion &&
    result.ProcessVersion &&
    result.BaselineProcessVersion !== result.ProcessVersion;

  const showBaselineVersion = status !== RunResultStatus.NoBaseline;
  const showActualVersion = status !== RunResultStatus.Missing;
  const showScore =
    status === RunResultStatus.Passed || status === RunResultStatus.Failed;

  const baselineInfo = baselineJobMap.get(result.ProcessName);
  const inBaseline = !!baselineInfo;
  const baselineId = baselineInfo?.id;
  const isBaselineSource = baselineInfo?.sourceRunResultId === result.Id;
  const hadBaseline = status !== RunResultStatus.NoBaseline;

  const { label: baselineLabel, className: baselineLabelClass } = (() => {
    if (isBaselineSource)
      return {
        label: t("current_baseline"),
        className: "text-blue-600 font-medium",
      };
    if (inBaseline) return { label: "✓", className: "" };
    if (hadBaseline)
      return { label: t("removed"), className: "text-red-500 font-medium" };
    return { label: "—", className: "" };
  })();

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="px-3 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={expanded ? t("collapse") : t("expand")}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <ChevronDown
              className="size-4 text-muted-foreground transition-transform duration-200"
              style={{
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            />
          </Button>
        </TableCell>
        <TableCell className="px-3 py-2">{result.ProcessName}</TableCell>
        <TableCell className="px-3 py-2 text-muted-foreground">
          {showBaselineVersion ? (result.BaselineProcessVersion ?? "-") : "—"}
        </TableCell>
        <TableCell className="px-3 py-2 text-muted-foreground">
          {showActualVersion ? (
            <>
              {result.ProcessVersion ?? "-"}
              {versionChanged && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 text-warning-foreground">{"▲"}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {`${t("version_differs_from_baseline")} (${result.BaselineProcessVersion})`}
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="px-3 py-2 font-medium">
          {showScore
            ? renderValueOrEmptyState(result.Score, {
                type: "number",
                options: { style: "percent", maximumFractionDigits: 0 },
              })
            : "—"}
        </TableCell>
        <TableCell className="px-3 py-2">
          <Badge
            variant="secondary"
            status={runResultStatusBadgeMap[status] ?? "info"}
            className={resultBadgeClassMap[status]}
          >
            {defaultRunResultStatusLabels[status] ?? "Unknown"}
          </Badge>
        </TableCell>
        <TableCell className="px-3 py-2 text-center">
          <span className={baselineLabelClass}>{baselineLabel}</span>
        </TableCell>
        <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {inBaseline &&
              !isBaselineSource &&
              status !== RunResultStatus.Missing && (
                <ActionButton
                  loading={updatePending}
                  icon={<ArrowLeftRight className="size-3" />}
                  tooltip={t("update_baseline")}
                  onClick={() => onUpdateBaseline(result.Id)}
                />
              )}
            {!inBaseline && (
              <ActionButton
                loading={adoptPending}
                icon={<Plus className="size-3" />}
                tooltip={t("add_to_expected_result")}
                onClick={() => onAdopt(result.Id)}
              />
            )}
            {inBaseline && baselineId && (
              <ActionButton
                loading={removePendingId === baselineId}
                icon={<Trash2 className="size-3 text-destructive" />}
                tooltip={t("remove_from_expected_result")}
                onClick={() => onRemoveBaseline(baselineId)}
              />
            )}
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/10 p-0">
            <ResultExpandedContent result={result} data={rowData} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Small action button with tooltip + spinner
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  loading: boolean;
  icon: ReactNode;
  tooltip: string;
  onClick: () => void;
}

const ActionButton = ({
  loading,
  icon,
  tooltip,
  onClick,
}: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={onClick}
        aria-label={tooltip}
      >
        {loading ? <Spinner className="size-3" /> : icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
);
