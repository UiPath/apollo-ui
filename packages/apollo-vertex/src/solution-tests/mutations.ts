import type { UseMutationResult } from "@tanstack/react-query";

/** A write hook's return: the React Query mutation, keyed by its variables. */
export type MutationHook<TVariables> = UseMutationResult<
  void,
  Error,
  TVariables
>;

export interface AttachmentFetcher<TArgs extends unknown[]> {
  fetch: (...args: TArgs) => Promise<unknown>;
}
