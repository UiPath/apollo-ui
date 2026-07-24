"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSolutionTestsConfig } from "./context";
import {
  useAdoptJob,
  useBaselineJobs,
  useRemoveJobBaseline,
  useResultAttachment,
  useRunResults,
  useUpdateBaseline,
} from "./hooks";
import type { ExpandedRowData } from "./result-expanded-content";
import { RunDetailsView, type BaselineJobMap } from "./run-details-view";
import {
  RunResultStatus,
  type SolutionTestRun,
  type SolutionTestRunResult,
} from "./types";

type ResultAttachments = Omit<ExpandedRowData, "loading">;

/** Download the attachment slots relevant to a result's status. Missing or
 *  failed slots resolve to null; irrelevant statuses fetch nothing. */
async function fetchResultAttachments(
  result: SolutionTestRunResult,
  attachment: ReturnType<typeof useResultAttachment>,
  showDebug: boolean,
): Promise<ResultAttachments> {
  const status = result.Status;

  // The debug view renders every slot, so it needs the full fetch.
  if (
    showDebug ||
    status === RunResultStatus.Passed ||
    status === RunResultStatus.Failed
  ) {
    const [expected, expectedInput, actual, actualInput, evalResults] =
      await Promise.allSettled([
        attachment.fetch(result.Id, "ExpectedOutput"),
        attachment.fetch(result.Id, "ExpectedInput"),
        attachment.fetch(result.Id, "ActualOutput"),
        attachment.fetch(result.Id, "ActualInput"),
        attachment.fetch(result.Id, "EvaluatorResults"),
      ]);
    return {
      expected: expected.status === "fulfilled" ? expected.value : null,
      expectedInput:
        expectedInput.status === "fulfilled" ? expectedInput.value : null,
      actual: actual.status === "fulfilled" ? actual.value : null,
      actualInput:
        actualInput.status === "fulfilled" ? actualInput.value : null,
      evaluatorResults:
        evalResults.status === "fulfilled" ? evalResults.value : null,
    };
  }

  if (status === RunResultStatus.Missing) {
    return {
      expected: await attachment
        .fetch(result.Id, "ExpectedOutput")
        .catch(() => null),
    };
  }

  if (
    status === RunResultStatus.NoBaseline ||
    status === RunResultStatus.Error
  ) {
    return {
      actual: await attachment
        .fetch(result.Id, "ActualOutput")
        .catch(() => null),
    };
  }

  return {};
}

interface RunDetailsProps {
  run: SolutionTestRun;
  subjectId: string;
  onBack: () => void;
}

/** Smart wrapper: live run results + baseline jobs, selected-agent attachment
 *  fetch + baseline write actions, driving the full-page run-details view. */
export const RunDetails = ({ run, subjectId, onBack }: RunDetailsProps) => {
  const { t } = useTranslation();
  const { showDebug } = useSolutionTestsConfig();
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

  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Per-row pending derives from each write mutation's in-flight variables.
  const adoptingResultId = adopt.isPending ? (adopt.variables ?? null) : null;
  const updatingResultId = updateBaseline.isPending
    ? (updateBaseline.variables ?? null)
    : null;
  const removingBaselineId = removeBaseline.isPending
    ? (removeBaseline.variables ?? null)
    : null;

  const selectedResult =
    results.find((r) => r.Id === selectedResultId) ?? results[0];

  // Selected-agent attachments, cached per result id so revisiting an agent is
  // instant and the fetch tracks the selection without manual effects/state.
  const attachments = useQuery({
    queryKey: [
      "solution-test-result-attachments",
      selectedResult?.Id,
      showDebug,
    ],
    enabled: !!selectedResult,
    queryFn: () =>
      selectedResult
        ? fetchResultAttachments(selectedResult, attachment, showDebug)
        : Promise.resolve<ResultAttachments>({}),
  });

  const selectedRowData = selectedResult && {
    loading: attachments.isLoading,
    ...attachments.data,
  };

  // Persist the default selection (and recover if the selected result drops out
  // of a live-query update) so the chosen agent doesn't jump if results reorder.
  useEffect(() => {
    if (results.length === 0) return;
    if (!results.some((r) => r.Id === selectedResultId)) {
      setSelectedResultId(results[0].Id);
    }
  }, [results, selectedResultId]);

  return (
    <RunDetailsView
      subjectId={subjectId}
      run={run}
      results={results}
      isLoading={isLoading}
      baselineJobMap={baselineJobMap}
      selectedResultId={selectedResult?.Id}
      selectedRowData={selectedRowData}
      adoptingResultId={adoptingResultId}
      updatingResultId={updatingResultId}
      removingBaselineId={removingBaselineId}
      onBack={onBack}
      onSelect={setSelectedResultId}
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
