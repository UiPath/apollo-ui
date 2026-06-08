"use client";

/**
 * Smart container for the Solution Tests view. Reads the collection-backed
 * query hooks + imperative action hooks, assembles the presentational props,
 * and hands smart expanded components to the dumb view via its render-props.
 *
 * The dumb `SolutionTestsView` owns all rendering; this file owns all data.
 */

import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { normalizeTab, type SolutionTestsTab } from "./tabs";
import { RunStatus } from "./types";
import type { SolutionTest, SolutionTestBatchRun } from "./types";
import {
  useSolutionTests,
  useSolutionTestBatchRuns,
  useSolutionTestRuns,
  useRunTests,
  useToggleTestActive,
  useDeleteTest,
  useForceStopBatch,
} from "./hooks";
import {
  SolutionTestsView,
  type RunConfirmTarget,
} from "./solution-tests-view";
import { ExpandedAgents } from "./expanded-agents";
import { ExpandedRunTests } from "./expanded-run-tests";

function getRunsForBatch(
  batchId: string,
  allRuns: ReturnType<typeof useSolutionTestRuns>["runs"],
) {
  return allRuns.filter((r) => r.RunBatchId === batchId);
}

export const SolutionTests = () => {
  const { t } = useTranslation();
  const { tests, isLoading: testsLoading } = useSolutionTests();
  const { batchRuns, isLoading: batchLoading } = useSolutionTestBatchRuns();
  const { runs: allRuns } = useSolutionTestRuns();

  const runTests = useRunTests();
  const toggleActive = useToggleTestActive();
  const deleteTest = useDeleteTest();
  const forceStopBatch = useForceStopBatch();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [runConfirm, setRunConfirm] = useState<RunConfirmTarget | null>(null);

  // Per-row pending derives from each mutation's in-flight variables (run-all
  // carries no test ids, so it's the only run without `variables.testIds`).
  const runningAll = runTests.isPending && !runTests.variables?.testIds;
  const runningTestId = runTests.isPending
    ? (runTests.variables?.testIds?.[0] ?? null)
    : null;
  const togglingTestId = toggleActive.isPending
    ? (toggleActive.variables?.testId ?? null)
    : null;
  const forceStoppingBatchId = forceStopBatch.isPending
    ? (forceStopBatch.variables ?? null)
    : null;

  // Active tab is synced to the `?tab=` search param so it survives reloads
  // and is shareable.
  const activeTab = useSearch({
    strict: false,
    select: (search: Record<string, unknown>) => normalizeTab(search.tab),
  });
  const navigate = useNavigate();
  const onTabChange = (tab: SolutionTestsTab) => {
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, tab }),
      replace: true,
    });
  };

  const hasActiveRuns = batchRuns.some(
    (r) => r.Status === RunStatus.Pending || r.Status === RunStatus.Running,
  );

  return (
    <SolutionTestsView
      tests={tests}
      batchRuns={batchRuns}
      loading={testsLoading || batchLoading}
      activeTab={activeTab}
      onTabChange={onTabChange}
      hasActiveRuns={hasActiveRuns}
      runningAll={runningAll}
      runningTestId={runningTestId}
      togglingTestId={togglingTestId}
      isDeleting={deleteTest.isPending}
      forceStoppingBatchId={forceStoppingBatchId}
      deleteConfirmId={deleteConfirmId}
      setDeleteConfirmId={setDeleteConfirmId}
      runConfirm={runConfirm}
      setRunConfirm={setRunConfirm}
      onConfirmRun={() => {
        if (!runConfirm) return;
        if (runConfirm.mode === "all") {
          runTests.mutate(
            {},
            {
              onSuccess: () => toast.success(t("all_tests_triggered")),
              onError: (err) =>
                toast.error(err.message || t("failed_to_run_tests")),
            },
          );
        } else {
          runTests.mutate(
            { testIds: [runConfirm.testId] },
            {
              onSuccess: () => toast.success(t("test_triggered")),
              onError: (err) =>
                toast.error(err.message || t("failed_to_run_test")),
            },
          );
        }
        setRunConfirm(null);
      }}
      onToggleActive={(testId, newValue) =>
        toggleActive.mutate(
          { testId, isActive: newValue },
          {
            onSuccess: () =>
              toast.success(newValue ? t("test_enabled") : t("test_disabled")),
            onError: (err) =>
              toast.error(err.message || t("failed_to_toggle_test")),
          },
        )
      }
      onDeleteTest={(testId) => {
        deleteTest.mutate(testId, {
          onSuccess: () => toast.success(t("test_deleted")),
          onError: (err) =>
            toast.error(err.message || t("failed_to_delete_test")),
        });
        setDeleteConfirmId(null);
      }}
      onForceStopBatch={(batchId) =>
        forceStopBatch.mutate(batchId, {
          onError: (err) =>
            toast.error(err.message || t("failed_to_force_stop_batch")),
        })
      }
      renderExpandedTest={(test: SolutionTest) => (
        <ExpandedAgents test={test} />
      )}
      renderExpandedRun={(batch: SolutionTestBatchRun) => (
        <ExpandedRunTests
          runs={getRunsForBatch(batch.Id, allRuns)}
          tests={tests}
        />
      )}
    />
  );
};
