"use client";

/**
 * Resolve a typed Solution Tests collection by entity name. The entity name
 * determines the row type, so callers cannot mismatch the two. Throws when used
 * outside a SolutionProvider or when the named collection is not registered.
 */

import type { Collection } from "@tanstack/react-db";
import { useSolution } from "@uipath/vs-core";
import { ENTITY } from "./constants";
import type {
  SolutionTest,
  SolutionTestBatchRun,
  SolutionTestJob,
  SolutionTestRun,
  SolutionTestRunResult,
} from "./types";

/** Row type stored in each Solution Tests collection, keyed by its entity name. */
type SolutionTestRow = {
  [ENTITY.tests]: SolutionTest;
  [ENTITY.batchRuns]: SolutionTestBatchRun;
  [ENTITY.runs]: SolutionTestRun;
  [ENTITY.jobs]: SolutionTestJob;
  [ENTITY.runResults]: SolutionTestRunResult;
};

export function useSolutionTestCollection<K extends keyof SolutionTestRow>(
  entity: K,
): Collection<SolutionTestRow[K]> {
  const solution = useSolution();
  if (!solution) {
    throw new Error(
      "useSolutionTestCollection must be used within a SolutionProvider.",
    );
  }
  const selected = solution.api.collections.solutionTests[entity];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const collection = selected as Collection<SolutionTestRow[K]> | undefined;
  if (!collection) {
    throw new Error(`Solution Tests collection "${entity}" is unavailable.`);
  }
  return collection;
}
