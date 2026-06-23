"use client";

/**
 * Solution test batch runs: the live batch-run list. The force-stop write for
 * a batch lives in `use-force-stop` alongside the single-run stop.
 */

import { useLiveQuery } from "@tanstack/react-db";
import { ENTITY } from "./constants";
import type { SolutionTestBatchRun } from "./types";
import { useSolutionTestCollection } from "./use-solution-test-collection";

export interface UseSolutionTestBatchRunsResult {
  batchRuns: SolutionTestBatchRun[];
  isLoading: boolean;
}

/** Live list of batch runs. */
export function useSolutionTestBatchRuns(): UseSolutionTestBatchRunsResult {
  const collection = useSolutionTestCollection(ENTITY.batchRuns);
  const { data, isLoading } = useLiveQuery(() => collection, [collection]);
  return { batchRuns: data ?? [], isLoading };
}
