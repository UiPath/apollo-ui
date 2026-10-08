export interface ResourcePickerEmptyStateProps {
  /** The active search text, trimmed. Empty when the list is unfiltered. */
  query?: string;
  emptyText?: string;
  /** Shown when the search matches nothing, given the query. */
  noMatchText?: (query: string) => string;
}

const defaultNoMatchText = (query: string) => `No results match “${query}”.`;

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
  noMatchText = defaultNoMatchText,
}: ResourcePickerEmptyStateProps) {
  return (
    <div className="px-3 py-2 text-xs text-foreground-muted">
      {query ? noMatchText(query) : emptyText}
    </div>
  );
}
