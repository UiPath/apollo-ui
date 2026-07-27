"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSolutionTestsConfig } from "./context";
import {
  useAdoptJob,
  useBaselineJobs,
  useRemoveJobBaseline,
  useResultAttachment,
  useRunResults,
  useSolutionTestRuns,
  useSolutionTests,
  useUpdateBaseline,
} from "./hooks";
import type { ExpandedRowData } from "./result-expanded-content";
import { RunDetailsView, type BaselineJobMap } from "./run-details-view";
import { RunResultStatus, type SolutionTestRunResult } from "./types";
import { isRunDone } from "./utils";

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
  /** Run id from the route param. Resolved to a run via the live collections. */
  runId: string;
  onBack: () => void;
}

/** Smart wrapper: resolves the run from the route id, loads its live results +
 *  baseline jobs, fetches the selected-agent attachments, and drives the
 *  full-page run-details view. A route id that doesn't resolve to a completed
 *  run (stale/shared link, or a still-running run) renders an empty state with a
 *  Back button rather than auto-navigating. */
export const RunDetails = ({ runId, onBack }: RunDetailsProps) => {
  const { t } = useTranslation();
  const { showDebug, track } = useSolutionTestsConfig();
  const { runs, isLoading: runsLoading } = useSolutionTestRuns();
  const { tests } = useSolutionTests();

  const run = runs.find((r) => r.Id === runId);
  const test = run && tests.find((x) => x.Id === run.SolutionTestId);
  const subjectId = test?.SubjectId ?? run?.SolutionTestId ?? "";

  const { results, isLoading } = useRunResults(runId);
  const { jobs: baselines } = useBaselineJobs(run?.SolutionTestId ?? "");

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

  // A route id that isn't a completed run has nothing to show (a stale or shared
  // deep-link). Wait for the runs collection to resolve so a valid link isn't
  // judged early, then render an empty state — never navigate away on the user.
  if (!run || !isRunDone(run.Status)) {
    if (runsLoading) return null;
    return (
      <Empty className="h-full min-h-[600px]">
        <EmptyHeader>
          <EmptyTitle>{t("run_unavailable")}</EmptyTitle>
          <EmptyDescription>
            {t("run_unavailable_description")}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onBack}>
            {t("back")}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

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
      onSelect={(id) => {
        // Only a genuine selection change is a "view" — re-clicking the shown
        // agent should not re-emit.
        if (id !== selectedResult?.Id) {
          track?.("VS.SolutionTest.ResultViewed", { resultId: id });
        }
        setSelectedResultId(id);
      }}
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
