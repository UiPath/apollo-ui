"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { SolutionTest, SolutionTestRun } from "./types";
import { useForceStopRun } from "./hooks";
import { ExpandedRunTestsView } from "./expanded-run-tests-view";
import { RunDetailsDialog } from "./run-details-dialog";

interface DetailsTarget {
  run: SolutionTestRun;
  subjectId: string;
}

interface ExpandedRunTestsProps {
  runs: SolutionTestRun[];
  tests: SolutionTest[];
}

/** Smart wrapper: force-stop action + lazily-fetched run-details dialog. */
export const ExpandedRunTests = ({ runs, tests }: ExpandedRunTestsProps) => {
  const { t } = useTranslation();
  const forceStopRun = useForceStopRun();
  const [detailsTarget, setDetailsTarget] = useState<DetailsTarget | null>(
    null,
  );

  const stoppingRunId = forceStopRun.isPending
    ? (forceStopRun.variables ?? null)
    : null;

  return (
    <ExpandedRunTestsView
      runs={runs}
      tests={tests}
      stoppingRunId={stoppingRunId}
      onOpenDetails={(run, subjectId) => setDetailsTarget({ run, subjectId })}
      onForceStop={(runId) =>
        forceStopRun.mutate(runId, {
          onSuccess: () => toast.success(t("force_stop_initiated")),
          onError: () => toast.error(t("failed_to_force_stop_run")),
        })
      }
      detailsDialog={
        detailsTarget && (
          <RunDetailsDialog
            open
            onClose={() => setDetailsTarget(null)}
            subjectId={detailsTarget.subjectId}
            run={detailsTarget.run}
          />
        )
      }
    />
  );
};
