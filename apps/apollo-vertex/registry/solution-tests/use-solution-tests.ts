"use client";

/**
 * Solution tests: the live test list plus the writes that act on tests —
 * run, toggle-active, and delete. Reads stream from the `UiPathSTTests`
 * collection; run/delete go through the injected trigger actions.
 */

import { useLiveQuery } from "@tanstack/react-db";
import { useMutation } from "@tanstack/react-query";
import { useSolution } from "@uipath/vs-core";
import { ENTITY } from "./constants";
import { useSolutionTestsActions } from "./context";
import type { MutationHook } from "./mutations";
import type { SolutionTest } from "./types";
import { useSolutionTestCollection } from "./use-solution-test-collection";

export interface UseSolutionTestsResult {
  tests: SolutionTest[];
  isLoading: boolean;
}

/** Live list of solution tests. */
export function useSolutionTests(): UseSolutionTestsResult {
  const collection = useSolutionTestCollection(ENTITY.tests);
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ tests: collection }),
    [collection],
  );
  return { tests: data ?? [], isLoading };
}

/** Which run a `useRunTests` mutation represents; lets callers tell a single
 * bulk-selected run apart from a single-row run (both carry one `testId`). */
export type RunTestsMode = "all" | "test" | "selected";

/** Run the given tests (all active tests when `testIds` is omitted). */
export function useRunTests(): MutationHook<{
  testIds?: string[];
  mode: RunTestsMode;
}> {
  const actions = useSolutionTestsActions();
  return useMutation({
    mutationFn: ({ testIds }: { testIds?: string[]; mode: RunTestsMode }) =>
      actions.runTests(testIds),
  });
}

/** Create a solution test from a subject id (e.g. a loan). */
export function useCreateTest(): MutationHook<string> {
  const actions = useSolutionTestsActions();
  const testsCollection = useSolutionTestCollection(ENTITY.tests);
  return useMutation({
    mutationFn: async (subjectId: string) => {
      await actions.createTest(subjectId);
      await testsCollection.utils.refetch();
    },
  });
}

/**
 * Toggle a test's active flag. Unlike the other writes this isn't an API
 * trigger — it's a direct field update on the `UiPathSTTests` collection, so it
 * goes through the collection's optimistic `.update()` (synced to the backend
 * by vs-core) rather than the injected `actions`.
 */
export function useToggleTestActive(): MutationHook<{
  testId: string;
  isActive: boolean;
}> {
  const solution = useSolution();
  return useMutation({
    mutationFn: async ({
      testId,
      isActive,
    }: {
      testId: string;
      isActive: boolean;
    }) => {
      const collection = solution?.api.collections.solutionTests[ENTITY.tests];
      if (!collection) {
        throw new Error("Solution Tests collection is unavailable.");
      }
      const transaction = collection.update(testId, (draft) => {
        draft.IsActive = isActive;
      });
      await transaction.isPersisted.promise;
    },
  });
}

/** Delete a test. */
export function useDeleteTest(): MutationHook<string> {
  const actions = useSolutionTestsActions();
  const testsCollection = useSolutionTestCollection(ENTITY.tests);
  const jobsCollection = useSolutionTestCollection(ENTITY.jobs);
  return useMutation({
    mutationFn: async (testId: string) => {
      await actions.deleteTest(testId);
      await Promise.all([
        testsCollection.utils.refetch(),
        jobsCollection.utils.refetch(),
      ]);
    },
  });
}
