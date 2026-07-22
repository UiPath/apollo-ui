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
import { useSolutionTestsActions, useSolutionTestsContext } from "./context";
import type { AttachmentFetcher, MutationHook } from "./mutations";
import { JobRole } from "./types";
import type { SolutionTestJob } from "./types";
import { useSolutionTestCollection } from "./use-solution-test-collection";

export interface UseBaselineJobsResult {
  jobs: SolutionTestJob[];
  isLoading: boolean;
}

/** Live baseline jobs for a test. */
export function useBaselineJobs(testId: string): UseBaselineJobsResult {
  const collection = useSolutionTestCollection(ENTITY.jobs);
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ jobs: collection }),
    [collection],
  );
  const jobs = (data ?? []).filter(
    (job) => job.SolutionTestId === testId && job.JobRole === JobRole.Baseline,
  );
  return { jobs, isLoading };
}

/** Remove a job from the test's expected (baseline) results. */
export function useRemoveJobBaseline(): MutationHook<string> {
  const actions = useSolutionTestsActions();
  const jobsCollection = useSolutionTestCollection(ENTITY.jobs);
  return useMutation({
    mutationFn: async (baselineId: string) => {
      await actions.removeJobBaseline(baselineId);
      await jobsCollection.utils.refetch();
    },
  });
}

/** Expected-output attachment for a baseline job (Agents expansion). */
export function useJobExpectedOutput(): AttachmentFetcher<[jobId: string]> {
  const solution = useSolution();
  const { attachmentScope } = useSolutionTestsContext();
  return {
    fetch: (jobId: string) => {
      const entityId = solution?.api.entityIds?.[ENTITY.jobs];
      if (!entityId) return Promise.resolve(null);
      // The baseline job's expected output lives in the `Output` File field on
      // UiPathSTJobs — `ExpectedOutput` only exists on UiPathSTRunResults.
      return fetchAttachment(
        solution,
        entityId,
        jobId,
        "Output",
        attachmentScope?.(),
      );
    },
  };
}
