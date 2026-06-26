"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SolutionTest, SolutionTestJob } from "./types";
import { useBaselineJobs, useJobExpectedOutput } from "./hooks";
import { ExpandedAgentsView } from "./expanded-agents-view";

interface ExpandedAgentsProps {
  test: SolutionTest;
}

/**
 * Smart wrapper: baseline jobs (lazily, on expand) plus the expected-output
 * attachment for the currently-open job, fetched on demand via React Query.
 */
export const ExpandedAgents = ({ test }: ExpandedAgentsProps) => {
  const { jobs: baselines, isLoading } = useBaselineJobs(test.Id);
  const expectedOutput = useJobExpectedOutput();

  const [openJob, setOpenJob] = useState<SolutionTestJob | null>(null);

  const { data, isFetching, isFetched } = useQuery({
    queryKey: ["solution-tests", "expected-output", openJob?.Id],
    queryFn: () => expectedOutput.fetch(openJob?.Id ?? ""),
    enabled: openJob != null,
  });

  // The open job has no expected output once its fetch resolves empty.
  const noOutputJobIds = new Set(
    openJob && isFetched && data == null ? [openJob.Id] : [],
  );

  const viewing = openJob
    ? { job: openJob, data: data ?? null, loading: isFetching }
    : null;

  return (
    <ExpandedAgentsView
      test={test}
      baselines={baselines}
      isLoading={isLoading}
      noOutputJobIds={noOutputJobIds}
      viewing={viewing}
      onViewExpected={(job) => setOpenJob(job)}
      onCloseViewer={() => setOpenJob(null)}
    />
  );
};
