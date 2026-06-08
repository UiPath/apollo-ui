/** Hook return shape for a write: `mutate` rejects on failure; `isPending` reflects it. */
export interface MutationHookResult<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult>;
  isPending: boolean;
}

export interface AttachmentFetcher<TArgs extends unknown[]> {
  fetch: (...args: TArgs) => Promise<unknown>;
}
