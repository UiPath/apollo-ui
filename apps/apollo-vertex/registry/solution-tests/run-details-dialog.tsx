"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RunResultStatus, type SolutionTestRun } from "./types";
import type { SolutionTestRunResult } from "./types";
import {
  useRunResults,
  useBaselineJobs,
  useAdoptJob,
  useUpdateBaseline,
  useRemoveJobBaseline,
  useResultAttachment,
} from "./hooks";
import {
  RunDetailsDialogView,
  type BaselineJobMap,
} from "./run-details-dialog-view";
import type { ExpandedRowData } from "./result-expanded-content";

interface RunDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  run: SolutionTestRun;
}

/** Smart wrapper: live run results + baseline jobs, attachment + write actions. */
export const RunDetailsDialog = ({
  open,
  onClose,
  subjectId,
  run,
}: RunDetailsDialogProps) => {
  const { t } = useTranslation();
  const { results, isLoading } = useRunResults(run.Id);
  const { jobs: baselines } = useBaselineJobs(run.SolutionTestId);

  const attachment = useResultAttachment();
  const adopt = useAdoptJob();
  const updateBaseline = useUpdateBaseline();
  const removeBaseline = useRemoveJobBaseline();

  const baselineJobMap = useMemo<BaselineJobMap>(
    () =>
      new Map(
        baselines.map((b) => [
          b.ProcessName,
          { id: b.Id, sourceRunResultId: b.SourceRunResultId },
        ]),
      ),
    [baselines],
  );

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rowData, setRowData] = useState<Record<string, ExpandedRowData>>({});

  // Per-row pending derives from each write mutation's in-flight variables.
  const adoptingResultId = adopt.isPending ? (adopt.variables ?? null) : null;
  const updatingResultId = updateBaseline.isPending
    ? (updateBaseline.variables ?? null)
    : null;
  const removingBaselineId = removeBaseline.isPending
    ? (removeBaseline.variables ?? null)
    : null;

  const fetchRowAttachments = useCallback(
    async (result: SolutionTestRunResult) => {
      const status = result.Status;
      setRowData((prev) => ({ ...prev, [result.Id]: { loading: true } }));

      try {
        if (
          status === RunResultStatus.Passed ||
          status === RunResultStatus.Failed
        ) {
          const [expected, actual, evalResults] = await Promise.allSettled([
            attachment.fetch(result.Id, "ExpectedOutput"),
            attachment.fetch(result.Id, "ActualOutput"),
            attachment.fetch(result.Id, "EvaluatorResults"),
          ]);
          setRowData((prev) => ({
            ...prev,
            [result.Id]: {
              loading: false,
              expected: expected.status === "fulfilled" ? expected.value : null,
              actual: actual.status === "fulfilled" ? actual.value : null,
              evaluatorResults:
                evalResults.status === "fulfilled" ? evalResults.value : null,
            },
          }));
        } else if (status === RunResultStatus.Missing) {
          const expectedData = await attachment
            .fetch(result.Id, "ExpectedOutput")
            .catch(() => null);
          setRowData((prev) => ({
            ...prev,
            [result.Id]: { loading: false, expected: expectedData },
          }));
        } else if (
          status === RunResultStatus.NoBaseline ||
          status === RunResultStatus.Error
        ) {
          const actualData = await attachment
            .fetch(result.Id, "ActualOutput")
            .catch(() => null);
          setRowData((prev) => ({
            ...prev,
            [result.Id]: { loading: false, actual: actualData },
          }));
        } else {
          setRowData((prev) => ({
            ...prev,
            [result.Id]: { loading: false },
          }));
        }
      } catch {
        setRowData((prev) => ({
          ...prev,
          [result.Id]: { loading: false },
        }));
      }
    },
    [attachment],
  );

  const toggleRow = useCallback(
    (result: SolutionTestRunResult) => {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        if (next.has(result.Id)) {
          next.delete(result.Id);
        } else {
          next.add(result.Id);
          if (!rowData[result.Id]) void fetchRowAttachments(result);
        }
        return next;
      });
    },
    [rowData, fetchRowAttachments],
  );

  return (
    <RunDetailsDialogView
      open={open}
      onClose={onClose}
      subjectId={subjectId}
      results={results}
      isLoading={isLoading}
      baselineJobMap={baselineJobMap}
      expandedRows={expandedRows}
      rowData={rowData}
      adoptingResultId={adoptingResultId}
      updatingResultId={updatingResultId}
      removingBaselineId={removingBaselineId}
      onToggleRow={toggleRow}
      onAdopt={(id) =>
        adopt.mutate(id, {
          onSuccess: () => toast.success(t("agent_adopted_successfully")),
          onError: (err) =>
            toast.error(`${t("failed_to_adopt_agent")}: ${err.message}`),
        })
      }
      onUpdateBaseline={(id) =>
        updateBaseline.mutate(id, {
          onSuccess: () => toast.success(t("baseline_updated_successfully")),
          onError: (err) =>
            toast.error(`${t("failed_to_update_baseline")}: ${err.message}`),
        })
      }
      onRemoveBaseline={(id) =>
        removeBaseline.mutate(id, {
          onSuccess: () =>
            toast.success(t("agent_removed_from_expected_results")),
          onError: (err) =>
            toast.error(
              `${t("failed_to_remove_agent_baseline")}: ${err.message}`,
            ),
        })
      }
    />
  );
};
