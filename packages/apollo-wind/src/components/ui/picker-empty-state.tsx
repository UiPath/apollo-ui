import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface PickerEmptyStateProps {
  /** A load that failed. Takes precedence over every other state. */
  error?: string | null;
  /** The list on screen has never resolved, so its contents are unknown. */
  loading?: boolean;
  /** The active search text, trimmed. Empty when the list is unfiltered. */
  query?: string;
  emptyText?: string;
  noMatchText?: (query: string) => string;
  loadingText?: string;
  /** Requests the failed list again. Without it, the error offers no action. */
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * Makes each message its own live region. Pass `false` when the caller
   * keeps a region mounted around it, so the message is announced as it
   * arrives in an existing region rather than as a new one, and not twice.
   */
  announce?: boolean;
}

const defaultNoMatchText = (query: string) => `No results match “${query}”.`;

/**
 * What a picker's list shows when it has no rows. Shared by FolderPicker and
 * ResourcePicker, and not exported from the package.
 *
 * The four cases say different things and must not collapse into one message:
 * a list still loading is not an empty one, an empty list is not a failed
 * search, and neither is an error. Ordered by precedence, so a list that
 * fails to load reports the failure rather than claiming to be empty.
 *
 * Always renders one of the four messages, falling back to the empty-folder
 * text, so the caller renders it only when the list has no rows.
 */
export function PickerEmptyState({
  error,
  loading = false,
  query = '',
  emptyText = 'No results.',
  noMatchText = defaultNoMatchText,
  loadingText = 'Loading…',
  onRetry,
  retryLabel = 'Retry',
  announce = true,
}: PickerEmptyStateProps) {
  if (error) {
    // An alert, as the failure arrives asynchronously while focus is in the
    // search and would otherwise go unannounced.
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span role={announce ? 'alert' : undefined} className="text-xs text-error">
          {error}
        </span>
        {/* Otherwise a list that failed on first load is a dead end, with no
            rows to open. */}
        {onRetry && (
          <Button variant="ghost" size="xs" type="button" className="h-7" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      // The status is the row, so it announces the consumer's wording. The
      // spinner's own status would read its default "Loading" instead.
      <div
        role={announce ? 'status' : undefined}
        className="flex items-center gap-2 px-3 py-2 text-xs text-foreground-muted"
      >
        {/* Sized through its glyph: the class otherwise lands on the wrapper
            and leaves the icon at its 24px default. */}
        <Spinner className="[&_svg]:size-3.5" aria-hidden="true" />
        {loadingText}
      </div>
    );
  }

  // A status, as a filter that leaves no rows, or a list that resolves empty,
  // changes the list while focus stays in the search.
  return (
    <div role={announce ? 'status' : undefined} className="px-3 py-2 text-xs text-foreground-muted">
      {query ? noMatchText(query) : emptyText}
    </div>
  );
}
