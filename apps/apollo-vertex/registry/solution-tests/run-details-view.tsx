"use client";

import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import {
  PageHeader,
  PageHeaderBackButton,
  PageHeaderNav,
  PageHeaderTitle,
  PageHeaderTitleGroup,
} from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";
import {
  defaultRunResultStatusLabels,
  defaultRunStatusLabels,
} from "./constants";
import { useSolutionTestsConfig } from "./context";
import {
  type ExpandedRowData,
  ResultExpandedContent,
} from "./result-expanded-content";
import { RunDetailsAgentList } from "./run-details-agent-list";
import {
  resultBadgeClassMap,
  runResultStatusBadgeMap,
  runStatusBadgeMap,
} from "./status-maps";
import {
  RunResultStatus,
  type SolutionTestRun,
  type SolutionTestRunResult,
} from "./types";
import { compareVersions } from "./utils";

export type BaselineJobMap = Map<
  string,
  { id: string; sourceRunResultId?: string }
>;

export interface RunDetailsViewProps {
  subjectId: string;
  run: SolutionTestRun;
  results: SolutionTestRunResult[];
  isLoading: boolean;
  baselineJobMap: BaselineJobMap;
  selectedResultId: string | undefined;
  selectedRowData: ExpandedRowData | undefined;
  adoptingResultId: string | null;
  updatingResultId: string | null;
  removingBaselineId: string | null;
  onBack: () => void;
  onSelect: (resultId: string) => void;
  onAdopt: (resultId: string) => void;
  onUpdateBaseline: (resultId: string) => void;
  onRemoveBaseline: (baselineId: string) => void;
}

export const RunDetailsView = ({
  subjectId,
  run,
  results,
  isLoading,
  baselineJobMap,
  selectedResultId,
  selectedRowData,
  adoptingResultId,
  updatingResultId,
  removingBaselineId,
  onBack,
  onSelect,
  onAdopt,
  onUpdateBaseline,
  onRemoveBaseline,
}: RunDetailsViewProps) => {
  const { t } = useTranslation();
  const config = useSolutionTestsConfig();

  const title = `${
    config.subjectNoun
      ? t("subject_run_results", {
          subject: config.subjectNoun.singular,
          id: subjectId,
        })
      : subjectId
  } — ${t("run_results")}`;

  const selectedResult = results.find((r) => r.Id === selectedResultId);

  return (
    <div className="flex h-full min-h-[600px] flex-col">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderBackButton aria-label={t("back")} onClick={onBack} />
          <PageHeaderTitleGroup>
            <PageHeaderTitle>{title}</PageHeaderTitle>
          </PageHeaderTitleGroup>
          <div className="flex items-center gap-6 pl-6">
            <HeaderMetric label={t("score")}>
              <span className="text-lg font-semibold text-foreground">
                {renderValueOrEmptyState(run.TestRunScore, {
                  type: "number",
                  options: { style: "percent", maximumFractionDigits: 0 },
                })}
              </span>
            </HeaderMetric>
            <HeaderMetric label={t("agents_passed")}>
              <span className="text-lg font-semibold text-foreground">
                {`${run.JobsPassed ?? 0}/${run.JobsTotal ?? 0}`}
              </span>
            </HeaderMetric>
            <HeaderMetric label={t("status")}>
              <Badge
                variant="secondary"
                status={runStatusBadgeMap[run.Status] ?? "info"}
              >
                {defaultRunStatusLabels[run.Status] ?? "Unknown"}
              </Badge>
            </HeaderMetric>
          </div>
        </PageHeaderNav>
      </PageHeader>

      <div className="flex flex-1 min-h-0 overflow-hidden border-t border-border">
        <RunDetailsAgentList
          results={results}
          selectedResultId={selectedResultId}
          isLoading={isLoading}
          onSelect={onSelect}
        />

        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : selectedResult ? (
            <RunDetailsPane
              result={selectedResult}
              data={selectedRowData}
              baselineJobMap={baselineJobMap}
              adoptPending={adoptingResultId === selectedResult.Id}
              updatePending={updatingResultId === selectedResult.Id}
              removePendingId={removingBaselineId}
              onAdopt={onAdopt}
              onUpdateBaseline={onUpdateBaseline}
              onRemoveBaseline={onRemoveBaseline}
            />
          ) : (
            <Empty>
              <EmptyDescription>{t("no_results_available")}</EmptyDescription>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail pane: selected-agent header (versions, score, baseline actions) plus
// the shared evaluator content.
// ---------------------------------------------------------------------------

interface RunDetailsPaneProps {
  result: SolutionTestRunResult;
  data: ExpandedRowData | undefined;
  baselineJobMap: BaselineJobMap;
  adoptPending: boolean;
  updatePending: boolean;
  removePendingId: string | null;
  onAdopt: (resultId: string) => void;
  onUpdateBaseline: (resultId: string) => void;
  onRemoveBaseline: (baselineId: string) => void;
}

const RunDetailsPane = ({
  result,
  data,
  baselineJobMap,
  adoptPending,
  updatePending,
  removePendingId,
  onAdopt,
  onUpdateBaseline,
  onRemoveBaseline,
}: RunDetailsPaneProps) => {
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

  // Directional triangle indicating the tested version moved up or down from
  // the baseline (not a warning — just a signal that it changed).
  const versionGlyph =
    compareVersions(
      result.ProcessVersion ?? "",
      result.BaselineProcessVersion ?? "",
    ) < 0
      ? "▼"
      : "▲";

  const baselineInfo = baselineJobMap.get(result.ProcessName);
  const inBaseline = !!baselineInfo;
  const baselineId = baselineInfo?.id;
  const isBaselineSource = baselineInfo?.sourceRunResultId === result.Id;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {result.ProcessName}
            </h3>
            <Badge
              variant="secondary"
              status={runResultStatusBadgeMap[status] ?? "info"}
              className={resultBadgeClassMap[status]}
            >
              {defaultRunResultStatusLabels[status] ?? "Unknown"}
            </Badge>
            <BaselineStateLabel
              isBaselineSource={isBaselineSource}
              inBaseline={inBaseline}
              hadBaseline={status !== RunResultStatus.NoBaseline}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>
              {`${t("baseline_agent_version")}: `}
              {showBaselineVersion
                ? (result.BaselineProcessVersion ?? "-")
                : "—"}
            </span>
            <span className="inline-flex items-center gap-1">
              {`${t("tested_agent_version")}: `}
              {showActualVersion ? (result.ProcessVersion ?? "-") : "—"}
              {showActualVersion && versionChanged && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      role="img"
                      aria-label={t("version_differs_from_baseline")}
                      className="text-foreground"
                    >
                      {versionGlyph}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {`${t("version_differs_from_baseline")} (${result.BaselineProcessVersion})`}
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
            <span>
              {`${t("score")}: `}
              {showScore
                ? renderValueOrEmptyState(result.Score, {
                    type: "number",
                    options: { style: "percent", maximumFractionDigits: 0 },
                  })
                : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {inBaseline &&
            !isBaselineSource &&
            status !== RunResultStatus.Missing && (
              <ActionButton
                loading={updatePending}
                icon={<ArrowLeftRight className="size-3" />}
                label={t("update_baseline")}
                onClick={() => onUpdateBaseline(result.Id)}
              />
            )}
          {!inBaseline && (
            <ActionButton
              loading={adoptPending}
              icon={<Plus className="size-3" />}
              label={t("add_to_expected_result")}
              onClick={() => onAdopt(result.Id)}
            />
          )}
          {inBaseline && baselineId && (
            <ActionButton
              loading={removePendingId === baselineId}
              icon={<Trash2 className="size-3 text-destructive" />}
              label={t("remove_from_expected_result")}
              onClick={() => onRemoveBaseline(baselineId)}
            />
          )}
        </div>
      </div>

      <ResultExpandedContent result={result} data={data} />
    </div>
  );
};

interface ActionButtonProps {
  loading: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

const ActionButton = ({ loading, icon, label, onClick }: ActionButtonProps) => (
  <Button variant="outline" size="sm" disabled={loading} onClick={onClick}>
    {loading ? <Spinner className="size-3" /> : icon}
    {label}
  </Button>
);

interface BaselineStateLabelProps {
  isBaselineSource: boolean;
  inBaseline: boolean;
  hadBaseline: boolean;
}

const BaselineStateLabel = ({
  isBaselineSource,
  inBaseline,
  hadBaseline,
}: BaselineStateLabelProps) => {
  const { t } = useTranslation();

  if (isBaselineSource) {
    return (
      <span className="text-xs font-medium text-info">
        {t("current_baseline")}
      </span>
    );
  }
  if (inBaseline) {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        {`✓ ${t("in_baseline")}`}
      </span>
    );
  }
  if (hadBaseline) {
    return (
      <span className="text-xs font-medium text-destructive">
        {t("removed")}
      </span>
    );
  }
  return null;
};

interface HeaderMetricProps {
  label: string;
  children: ReactNode;
}

const HeaderMetric = ({ label, children }: HeaderMetricProps) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <div className="flex h-7 items-center">{children}</div>
  </div>
);
