"use client";

/**
 * Force-stop writes for in-flight work — one for a whole batch run, one for a
 * single run. Grouped together as the stop surface; both resolve their
 * implementation from the provider's `actions`.
 */

import { useMutation } from "@tanstack/react-query";
import { useSolutionTestsActions } from "./context";
import type { MutationHookResult } from "./mutations";

/** Force-stop a whole batch run. */
export function useForceStopBatch(): MutationHookResult<
  [batchId: string],
  void
> {
  const actions = useSolutionTestsActions();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (batchId: string) => actions.forceStopBatch(batchId),
  });
  return { mutate: (batchId) => mutateAsync(batchId), isPending };
}

/** Force-stop a single run. */
export function useForceStopRun(): MutationHookResult<[runId: string], void> {
  const actions = useSolutionTestsActions();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (runId: string) => actions.forceStopRun(runId),
  });
  return { mutate: (runId) => mutateAsync(runId), isPending };
}
