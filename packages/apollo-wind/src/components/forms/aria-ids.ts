// Internal: not exported from the package index.

/** Space-joins the ids that are set, or `undefined` when none is. */
export function joinIds(...ids: (string | false | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}
