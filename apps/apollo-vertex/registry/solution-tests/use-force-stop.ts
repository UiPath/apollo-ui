"use client";

/**
 * Force-stop writes for in-flight work — one for a whole batch run, one for a
 * single run. Grouped together as the stop surface; both resolve their
 * implementation from the provider's `actions`.
 */

import { useMutation } from "@tanstack/react-query";
import { useSolutionTestsActions } from "./context";
import type { MutationHook } from "./mutations";

/** Force-stop a whole batch run. */
export function useForceStopBatch(): MutationHook<string> {
  const actions = useSolutionTestsActions();
  return useMutation({
    mutationFn: (batchId: string) => actions.forceStopBatch(batchId),
  });
}

/** Force-stop a single run. */
export function useForceStopRun(): MutationHook<string> {
  const actions = useSolutionTestsActions();
  return useMutation({
    mutationFn: (runId: string) => actions.forceStopRun(runId),
  });
}
