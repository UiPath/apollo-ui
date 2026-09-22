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

  // Per-run pending derives from the in-flight mutation's `mode`, which
  // disambiguates a single-row run from a bulk run of one selected test (both
  // carry exactly one `testId`).
  const runMode = runTests.isPending
    ? (runTests.variables?.mode ?? null)
    : null;
  const runningAll = runMode === "all";
  const runningSelected = runMode === "selected";
  const runningTestId =
    runMode === "test" ? (runTests.variables?.testIds?.[0] ?? null) : null;
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
      runningSelected={runningSelected}
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
        setRunConfirm(null);

        if (runConfirm.mode === "all") {
          runTests.mutate(
            { mode: "all" },
            {
              onSuccess: () => toast.success(t("all_tests_triggered")),
              onError: (err) =>
                toast.error(err.message || t("failed_to_run_tests")),
            },
          );
          return;
        }

        if (runConfirm.mode === "selected") {
          runTests.mutate(
            { testIds: runConfirm.testIds, mode: "selected" },
            {
              onSuccess: () => toast.success(t("selected_tests_triggered")),
              onError: (err) =>
                toast.error(err.message || t("failed_to_run_tests")),
            },
          );
          return;
        }

        runTests.mutate(
          { testIds: [runConfirm.testId], mode: "test" },
          {
            onSuccess: () => toast.success(t("test_triggered")),
            onError: (err) =>
              toast.error(err.message || t("failed_to_run_test")),
          },
        );
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
          onSuccess: () => {
            toast.success(t("test_deleted"));
            setDeleteConfirmId(null);
          },
          onError: (err) =>
            toast.error(err.message || t("failed_to_delete_test")),
        });
      }}
      onForceStopBatch={(batchId) =>
        forceStopBatch.mutate(batchId, {
          onSuccess: () => toast.success(t("force_stop_initiated")),
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
