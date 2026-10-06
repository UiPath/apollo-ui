import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface FolderPickerEmptyStateProps {
  /** A load that failed. Takes precedence over every other state. */
  error?: string | null;
  /** The level on screen has never resolved, so its contents are unknown. */
  loading?: boolean;
  /** The active search text, trimmed. Empty when the list is unfiltered. */
  query?: string;
  emptyText?: string;
  noMatchText?: (query: string) => string;
  loadingText?: string;
  /** Requests the failed level again. Without it, the error offers no action. */
  onRetry?: () => void;
  retryLabel?: string;
}

const defaultNoMatchText = (query: string) => `No folders match “${query}”.`;

/**
 * What the list shows when it has no rows.
 *
 * The four cases say different things and must not collapse into one message:
 * a level still loading is not an empty folder, an empty folder is not a failed
 * search, and neither is an error. Ordered by precedence, so a folder that
 * fails to load reports the failure rather than claiming to be empty.
 *
 * Always renders one of the four messages, falling back to the empty-folder
 * text, so the caller renders it only when the list has no rows.
 */
export function FolderPickerEmptyState({
  error,
  loading = false,
  query = '',
  emptyText = 'No subfolders.',
  noMatchText = defaultNoMatchText,
  loadingText = 'Loading…',
  onRetry,
  retryLabel = 'Retry',
}: FolderPickerEmptyStateProps) {
  if (error) {
    // An alert, as the failure arrives asynchronously while focus is in the
    // search and would otherwise go unannounced.
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
        {/* Otherwise a level that failed on first load is a dead end: its
            crumb is the current page and there are no rows to open. */}
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
      // biome-ignore lint/a11y/useSemanticElements: role="status" announces progress; <output> implies a computed form value.
      <div
        role="status"
        className="flex items-center gap-2 px-3 py-2 text-xs text-foreground-muted"
      >
        {/* Sized through its glyph: the class otherwise lands on the wrapper
            and leaves the icon at its 24px default. */}
        <Spinner className="[&_svg]:size-3.5" aria-hidden="true" />
        {loadingText}
      </div>
    );
  }

  // A status, as a filter that leaves no rows, or a level that resolves empty,
  // changes the list while focus stays in the search.
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" announces a result; <output> implies a computed form value.
    <div role="status" className="px-3 py-2 text-xs text-foreground-muted">
      {query ? noMatchText(query) : emptyText}
    </div>
  );
}
