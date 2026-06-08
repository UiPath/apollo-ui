"use client";

/**
 * Solution test runs: the live list of all runs (the view filters by batch in
 * memory). The force-stop write for a single run lives in `use-force-stop`.
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useSolution } from "@uipath/vs-core";
import { ENTITY } from "./constants";
import type { SolutionTestRun } from "./types";

export interface UseSolutionTestRunsResult {
  runs: SolutionTestRun[];
  isLoading: boolean;
}

/** Live list of all runs (the view filters by batch in memory). */
export function useSolutionTestRuns(): UseSolutionTestRunsResult {
  const solution = useSolution();
  const collection = solution?.api.collections.solutionTests[ENTITY.runs];
  const { data, isLoading } = useLiveQuery<SolutionTestRun>(
    (q) => (collection ? q.from({ runs: collection }) : null),
    [collection],
  );
  return { runs: data ?? [], isLoading };
}
