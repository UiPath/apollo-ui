"use client";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { SolutionTest, SolutionTestRun } from "./types";
import { useForceStopRun } from "./hooks";
import { ExpandedRunTestsView } from "./expanded-run-tests-view";

interface ExpandedRunTestsProps {
  runs: SolutionTestRun[];
  tests: SolutionTest[];
}

/** Smart wrapper: force-stop action + navigation to the run-details page. */
export const ExpandedRunTests = ({ runs, tests }: ExpandedRunTestsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const forceStopRun = useForceStopRun();

  const stoppingRunId = forceStopRun.isPending
    ? (forceStopRun.variables ?? null)
    : null;

  return (
    <ExpandedRunTestsView
      runs={runs}
      tests={tests}
      stoppingRunId={stoppingRunId}
      onOpenDetails={(run) =>
        void navigate({
          to: ".",
          search: (prev: Record<string, unknown>) => ({
            ...prev,
            run: run.Id,
          }),
        })
      }
      onForceStop={(runId) =>
        forceStopRun.mutate(runId, {
          onSuccess: () => toast.success(t("force_stop_initiated")),
          onError: () => toast.error(t("failed_to_force_stop_run")),
        })
      }
    />
  );
};
