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

// vs-core creates these as query collections, which carry `utils.refetch()`.
type SolutionTestCollection<T extends object> = Collection<
  T,
  string,
  { refetch: () => Promise<void> }
>;

// vs-core types `solutionTests` from the app's registered entities, which this
// package cannot see, hence the assertion.
export function getSolutionTestCollection<K extends keyof SolutionTestRow>(
  solution: ReturnType<typeof useSolution>,
  entity: K,
): SolutionTestCollection<SolutionTestRow[K]> | undefined {
  const collections: Record<string, unknown> =
    solution.api.collections.solutionTests;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return collections[entity] as
    | SolutionTestCollection<SolutionTestRow[K]>
    | undefined;
}

export function useSolutionTestCollection<K extends keyof SolutionTestRow>(
  entity: K,
): SolutionTestCollection<SolutionTestRow[K]> {
  const solution = useSolution();
  if (!solution) {
    throw new Error(
      "useSolutionTestCollection must be used within a SolutionProvider.",
    );
  }
  const collection = getSolutionTestCollection(solution, entity);
  if (!collection) {
    throw new Error(`Solution Tests collection "${entity}" is unavailable.`);
  }
  return collection;
}
