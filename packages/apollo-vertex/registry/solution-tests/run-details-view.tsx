"use client";

import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useVertexTranslation } from "@/lib/vertex-translation";
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
import {
  type ExpandedRowData,
  ResultExpandedContent,
} from "./result-expanded-content";
import { ConfigVersionValue } from "./config-version";
import { useComponentLabel } from "./context";
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
import { VersionDetails } from "./run-details-version-details";

export type BaselineJobMap = Map<
  string,
  { id: string; sourceRunResultId?: string }
>;

export interface RunDetailsViewProps {
  subjectLabel: string;
  run: SolutionTestRun;
  results: SolutionTestRunResult[];
  isLoading: boolean;
  baselineJobMap: BaselineJobMap;
  selectedResultId: string | undefined;
  selectedRowData: ExpandedRowData | undefined;
  adoptingResultId: string | null;
  updatingResultId: string | null;
  removingBaselineId: string | null;
  /** True while a run of this test is in flight; baselines can't change then. */
  isBaselineLocked: boolean;
  onBack: () => void;
  onSelect: (resultId: string) => void;
  onAdopt: (resultId: string) => void;
  onUpdateBaseline: (resultId: string) => void;
  onRemoveBaseline: (baselineId: string) => void;
}

export const RunDetailsView = ({
  subjectLabel,
  run,
  results,
  isLoading,
  baselineJobMap,
  selectedResultId,
  selectedRowData,
  adoptingResultId,
  updatingResultId,
  removingBaselineId,
  isBaselineLocked,
  onBack,
  onSelect,
  onAdopt,
  onUpdateBaseline,
  onRemoveBaseline,
}: RunDetailsViewProps) => {
  const { t } = useVertexTranslation();

  // subjectLabel is the test's display name (falling back to its subject id),
  // so the title reads e.g. "Acme Term Loan Run Results".
  const title = t("subject_run_results", { subject: subjectLabel });

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
            <HeaderMetric label={t("components_passed")}>
              <span className="text-lg font-semibold text-foreground">
                {`${run.JobsPassed ?? 0}/${run.JobsTotal ?? 0}`}
              </span>
            </HeaderMetric>
            <HeaderMetric label={t("baseline_config_version")}>
              <span className="text-lg font-semibold text-foreground">
                {run.BaselineConfigVersion ?? "-"}
              </span>
            </HeaderMetric>
            <HeaderMetric label={t("run_config_version")}>
              <span className="text-lg font-semibold text-foreground">
                <ConfigVersionValue run={run} />
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
              isBaselineLocked={isBaselineLocked}
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
// Detail pane: selected-component header (status, score, version details,
// baseline actions) plus the shared evaluator content.
// ---------------------------------------------------------------------------

interface RunDetailsPaneProps {
  result: SolutionTestRunResult;
  data: ExpandedRowData | undefined;
  baselineJobMap: BaselineJobMap;
  adoptPending: boolean;
  updatePending: boolean;
  removePendingId: string | null;
  isBaselineLocked: boolean;
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
  isBaselineLocked,
  onAdopt,
  onUpdateBaseline,
  onRemoveBaseline,
}: RunDetailsPaneProps) => {
  const { t } = useVertexTranslation();
  const componentLabel = useComponentLabel();
  const status = result.Status;
  const showScore =
    status === RunResultStatus.Passed || status === RunResultStatus.Failed;
  const lockReasonKey = baselineLockReasonKey(isBaselineLocked, status);
  const lockReason = lockReasonKey ? t(lockReasonKey) : null;

  const baselineInfo = baselineJobMap.get(result.ProcessName);
  const inBaseline = !!baselineInfo;
  const baselineId = baselineInfo?.id;
  const isBaselineSource = baselineInfo?.sourceRunResultId === result.Id;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            {componentLabel({
              agentId: result.AgentId,
              processName: result.ProcessName,
            })}
          </h3>
          <VersionDetails result={result} />
          <Badge
            variant="secondary"
            status={runResultStatusBadgeMap[status] ?? "info"}
            className={resultBadgeClassMap[status]}
          >
            {defaultRunResultStatusLabels[status] ?? "Unknown"}
          </Badge>
          {showScore && (
            <span className="text-sm font-medium text-muted-foreground">
              {renderValueOrEmptyState(result.Score, {
                type: "number",
                options: { style: "percent", maximumFractionDigits: 0 },
              })}
            </span>
          )}
          <BaselineStateLabel
            isBaselineSource={isBaselineSource}
            inBaseline={inBaseline}
            hadBaseline={status !== RunResultStatus.NoBaseline}
          />
        </div>

        <div className="flex items-center gap-2">
          {inBaseline &&
            !isBaselineSource &&
            status !== RunResultStatus.Missing && (
              <ActionButton
                loading={updatePending}
                lockReason={lockReason}
                icon={<ArrowLeftRight className="size-3" />}
                label={t("update_baseline")}
                onClick={() => onUpdateBaseline(result.Id)}
              />
            )}
          {!inBaseline && (
            <ActionButton
              loading={adoptPending}
              lockReason={lockReason}
              icon={<Plus className="size-3" />}
              label={t("add_to_expected_result")}
              onClick={() => onAdopt(result.Id)}
            />
          )}
          {inBaseline && baselineId && (
            <ActionButton
              loading={removePendingId === baselineId}
              lockReason={lockReason}
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

function baselineLockReasonKey(isBaselineLocked: boolean, status: number) {
  if (isBaselineLocked) {
    return "runs_in_progress";
  }
  if (status === RunResultStatus.Aborted) {
    return "result_aborted_baseline_locked";
  }
  return null;
}

interface ActionButtonProps {
  loading: boolean;
  /** When set, disables the action and shows this reason as a tooltip. */
  lockReason: string | null;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

const ActionButton = ({
  loading,
  lockReason,
  icon,
  label,
  onClick,
}: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      {/* A disabled button can't take focus, so the wrapper does while
          locked, letting keyboard users reach the reason. */}
      <span className="inline-flex" tabIndex={lockReason == null ? -1 : 0}>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || lockReason != null}
          onClick={onClick}
        >
          {loading ? <Spinner className="size-3" /> : icon}
          {label}
        </Button>
      </span>
    </TooltipTrigger>
    {lockReason != null && <TooltipContent>{lockReason}</TooltipContent>}
  </Tooltip>
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
  const { t } = useVertexTranslation();

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
