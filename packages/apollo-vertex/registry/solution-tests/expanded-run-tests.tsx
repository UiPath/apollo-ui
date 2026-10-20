"use client";

import { useVertexTranslation } from "@/lib/vertex-translation";
import { toast } from "sonner";
import type { SolutionTest, SolutionTestRun } from "./types";
import { useSolutionTestsConfig } from "./context";
import { useForceStopRun } from "./hooks";
import { ExpandedRunTestsView } from "./expanded-run-tests-view";

interface ExpandedRunTestsProps {
  runs: SolutionTestRun[];
  tests: SolutionTest[];
}

/** Smart wrapper: force-stop action + opening the run-details route (the host
 *  owns navigation via `config.onOpenRun`). */
export const ExpandedRunTests = ({ runs, tests }: ExpandedRunTestsProps) => {
  const { t } = useVertexTranslation();
  const { track, onOpenRun } = useSolutionTestsConfig();
  const forceStopRun = useForceStopRun();

  const stoppingRunId = forceStopRun.isPending
    ? (forceStopRun.variables ?? null)
    : null;

  return (
    <ExpandedRunTestsView
      runs={runs}
      tests={tests}
      stoppingRunId={stoppingRunId}
      onOpenDetails={(run) => {
        // No host navigation wired up — don't track an open that can't happen.
        if (!onOpenRun) return;
        track?.("VS.SolutionTest.RunDetailsOpened", { runId: run.Id });
        onOpenRun(run);
      }}
      onForceStop={(runId) =>
        forceStopRun.mutate(runId, {
          onSuccess: () => toast.success(t("force_stop_initiated")),
          onError: () => toast.error(t("failed_to_force_stop_run")),
        })
      }
    />
  );
};
