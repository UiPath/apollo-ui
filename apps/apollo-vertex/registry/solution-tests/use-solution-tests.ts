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
import type { MutationHookResult } from "./mutations";
import type { SolutionTest } from "./types";

export interface UseSolutionTestsResult {
  tests: SolutionTest[];
  isLoading: boolean;
}

/** Live list of solution tests. */
export function useSolutionTests(): UseSolutionTestsResult {
  const solution = useSolution();
  const collection = solution?.api.collections.solutionTests[ENTITY.tests];
  const { data, isLoading } = useLiveQuery<SolutionTest>(
    (q) => (collection ? q.from({ tests: collection }) : null),
    [collection],
  );
  return { tests: data ?? [], isLoading };
}

/** Run the given tests (all active tests when omitted). */
export function useRunTests(): MutationHookResult<[testIds?: string[]], void> {
  const actions = useSolutionTestsActions();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (testIds?: string[]) => actions.runTests(testIds),
  });
  return { mutate: (testIds) => mutateAsync(testIds), isPending };
}

/**
 * Toggle a test's active flag. Unlike the other writes this isn't an API
 * trigger — it's a direct field update on the `UiPathSTTests` collection, so it
 * goes through the collection's optimistic `.update()` (synced to the backend
 * by vs-core) rather than the injected `actions`.
 */
export function useToggleTestActive(): MutationHookResult<
  [testId: string, isActive: boolean],
  void
> {
  const solution = useSolution();
  const { mutateAsync, isPending } = useMutation({
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
  return {
    mutate: (testId, isActive) => mutateAsync({ testId, isActive }),
    isPending,
  };
}

/** Delete a test. */
export function useDeleteTest(): MutationHookResult<[testId: string], void> {
  const actions = useSolutionTestsActions();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (testId: string) => actions.deleteTest(testId),
  });
  return { mutate: (testId) => mutateAsync(testId), isPending };
}
