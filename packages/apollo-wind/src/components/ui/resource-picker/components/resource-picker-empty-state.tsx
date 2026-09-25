export interface ResourcePickerEmptyStateProps {
  /** The active search text, trimmed. Empty when the list is unfiltered. */
  query?: string;
  emptyText?: string;
}

/**
 * What the list shows when it has no rows.
 *
 * A picker with nothing in it and a search that matched nothing are not the
 * same thing, so they do not collapse into one message: the first is a state
 * of the data, the second is a state of the query, and only the second is
 * undone by clearing the search.
 */
export function ResourcePickerEmptyState({
  query = '',
  emptyText = 'No matches.',
}: ResourcePickerEmptyStateProps) {
  return (
    <div className="px-3 py-2 text-xs text-foreground-muted">
      {query ? `No results match “${query}”.` : emptyText}
    </div>
  );
}
