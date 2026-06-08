"use client";

/**
 * Baseline jobs for a test: the live list plus the writes that act on jobs —
 * remove-from-baseline and the expected-output attachment fetch (Agents
 * expansion). Reads stream from the `UiPathSTJobs` collection; remove-from-
 * baseline goes through the injected actions.
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";
import { useSolution } from "@uipath/vs-core";
import { fetchAttachment } from "./attachments";
import { ENTITY } from "./constants";
import { useSolutionTestsActions, useSolutionTestsEntityId } from "./context";
import type { AttachmentFetcher, MutationHookResult } from "./mutations";
import { JobRole } from "./types";
import type { SolutionTestJob } from "./types";

export interface UseBaselineJobsResult {
  jobs: SolutionTestJob[];
  isLoading: boolean;
}

/** Live baseline jobs for a test. */
export function useBaselineJobs(testId: string): UseBaselineJobsResult {
  const solution = useSolution();
  const collection = solution?.api.collections.solutionTests[ENTITY.jobs];
  const { data, isLoading } = useLiveQuery<SolutionTestJob>(
    (q) => (collection ? q.from({ jobs: collection }) : null),
    [collection],
  );
  const jobs = (data ?? []).filter(
    (job) => job.SolutionTestId === testId && job.JobRole === JobRole.Baseline,
  );
  return { jobs, isLoading };
}

/** Remove a job from the test's expected (baseline) results. */
export function useRemoveJobBaseline(): MutationHookResult<
  [baselineId: string],
  void
> {
  const actions = useSolutionTestsActions();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (baselineId: string) => actions.removeJobBaseline(baselineId),
  });
  return { mutate: (baselineId) => mutateAsync(baselineId), isPending };
}

/** Expected-output attachment for a baseline job (Agents expansion). */
export function useJobExpectedOutput(): AttachmentFetcher<[jobId: string]> {
  const solution = useSolution();
  const getEntityId = useSolutionTestsEntityId();
  return {
    fetch: (jobId: string) => {
      const entityId = getEntityId(ENTITY.jobs);
      if (!entityId) return Promise.resolve(null);
      // The baseline job's expected output lives in the `Output` File field on
      // UiPathSTJobs — `ExpectedOutput` only exists on UiPathSTRunResults.
      return fetchAttachment(solution, entityId, jobId, "Output");
    },
  };
}
