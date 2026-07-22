"use client";

/**
 * Run results for a run: the live list plus the writes that act on a result —
 * adopt a job as baseline, update an existing baseline — and the per-result
 * attachment fetch used by the run-details expansion. Reads stream from the
 * `UiPathSTRunResults` collection; adopt/update go through the injected actions.
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";
import { useSolution } from "@uipath/vs-core";
import { fetchAttachment } from "./attachments";
import { ENTITY } from "./constants";
import { useSolutionTestsActions, useSolutionTestsContext } from "./context";
import type { AttachmentFetcher, MutationHook } from "./mutations";
import { JobRole } from "./types";
import type {
  ResultAttachmentField,
  SolutionTestJob,
  SolutionTestRunResult,
} from "./types";
import { useSolutionTestCollection } from "./use-solution-test-collection";

export interface UseRunResultsResult {
  results: SolutionTestRunResult[];
  isLoading: boolean;
}

/**
 * Keep a result unless its job is an entry-point. `SolutionTestJobId` is a bare
 * id, so the role lives on the joined `UiPathSTJobs` row. Results with no job id
 * or an unresolved job are kept; otherwise only `Baseline`-role jobs survive.
 */
function isBaselineJobResult(
  result: SolutionTestRunResult,
  jobsById: Map<string, SolutionTestJob>,
): boolean {
  const jobId = result.SolutionTestJobId;
  if (jobId == null) return true;
  const job = jobsById.get(jobId);
  if (!job) return true;
  return job.JobRole === JobRole.Baseline;
}

/** Live run results for a run, excluding entry-point jobs (role != Baseline). */
export function useRunResults(runId: string): UseRunResultsResult {
  const resultsCollection = useSolutionTestCollection(ENTITY.runResults);
  const jobsCollection = useSolutionTestCollection(ENTITY.jobs);
  const { data, isReady: resultsReady } = useLiveQuery(
    (q) => q.from({ results: resultsCollection }),
    [resultsCollection],
  );
  const { data: jobsData, isReady: jobsReady } = useLiveQuery(
    (q) => q.from({ jobs: jobsCollection }),
    [jobsCollection],
  );
  // The role filter needs both collections. Until both are ready, stay loading
  // so entry-point results never flash before the jobs join resolves.
  if (!resultsReady || !jobsReady) {
    return { results: [], isLoading: true };
  }
  const jobsById = new Map((jobsData ?? []).map((job) => [job.Id, job]));
  const results = (data ?? [])
    .filter((result) => result.SolutionTestRunId === runId)
    .filter((result) => isBaselineJobResult(result, jobsById));
  return { results, isLoading: false };
}

/** Adopt a run result's job as the test baseline. */
export function useAdoptJob(): MutationHook<string> {
  const actions = useSolutionTestsActions();
  return useMutation({
    mutationFn: (resultId: string) => actions.adoptJob(resultId),
  });
}

/** Update the test baseline from a run result. */
export function useUpdateBaseline(): MutationHook<string> {
  const actions = useSolutionTestsActions();
  return useMutation({
    mutationFn: (resultId: string) => actions.updateBaseline(resultId),
  });
}

/** One attachment slot for a run result (run-details expansion). */
export function useResultAttachment(): AttachmentFetcher<
  [resultId: string, field: ResultAttachmentField]
> {
  const solution = useSolution();
  const { attachmentScope } = useSolutionTestsContext();
  return {
    fetch: (resultId: string, field: ResultAttachmentField) => {
      const entityId = solution?.api.entityIds?.[ENTITY.runResults];
      if (!entityId) return Promise.resolve(null);
      return fetchAttachment(
        solution,
        entityId,
        resultId,
        field,
        attachmentScope?.(),
      );
    },
  };
}
