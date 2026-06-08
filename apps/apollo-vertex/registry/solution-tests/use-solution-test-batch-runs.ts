"use client";

/**
 * Solution test batch runs: the live batch-run list. The force-stop write for
 * a batch lives in `use-force-stop` alongside the single-run stop.
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useSolution } from "@uipath/vs-core";
import { ENTITY } from "./constants";
import type { SolutionTestBatchRun } from "./types";

export interface UseSolutionTestBatchRunsResult {
  batchRuns: SolutionTestBatchRun[];
  isLoading: boolean;
}

/** Live list of batch runs. */
export function useSolutionTestBatchRuns(): UseSolutionTestBatchRunsResult {
  const solution = useSolution();
  const collection = solution?.api.collections.solutionTests[ENTITY.batchRuns];
  const { data, isLoading } = useLiveQuery<SolutionTestBatchRun>(
    (q) => (collection ? q.from({ batchRuns: collection }) : null),
    [collection],
  );
  return { batchRuns: data ?? [], isLoading };
}
