"use client";

/**
 * Solution test runs: the live list of all runs (the view filters by batch in
 * memory). The force-stop write for a single run lives in `use-force-stop`.
 */

import { useLiveQuery } from "@tanstack/react-db";
import { ENTITY } from "./constants";
import type { SolutionTestRun } from "./types";
import { useSolutionTestCollection } from "./use-solution-test-collection";

export interface UseSolutionTestRunsResult {
  runs: SolutionTestRun[];
  isLoading: boolean;
}

/** Live list of all runs (the view filters by batch in memory). */
export function useSolutionTestRuns(): UseSolutionTestRunsResult {
  const collection = useSolutionTestCollection(ENTITY.runs);
  const { data, isLoading } = useLiveQuery(() => collection, [collection]);
  return { runs: data ?? [], isLoading };
}
