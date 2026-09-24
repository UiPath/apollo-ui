import { Spinner } from '@/components/ui/spinner';

export interface FolderPickerEmptyStateProps {
  /** A load that failed. Takes precedence over every other state. */
  error?: string | null;
  /** The level on screen has never resolved, so its contents are unknown. */
  loading?: boolean;
  /** The active search text, trimmed. Empty when the list is unfiltered. */
  query?: string;
  emptyText?: string;
  loadingText?: string;
}

/**
 * What the list shows when it has no rows.
 *
 * The four cases say different things and must not collapse into one message:
 * a level still loading is not an empty folder, an empty folder is not a failed
 * search, and neither is an error. Ordered by precedence, so a folder that
 * fails to load reports the failure rather than claiming to be empty.
 *
 * Returns null when there is nothing to say, which lets the caller render it
 * unconditionally above the rows.
 */
export function FolderPickerEmptyState({
  error,
  loading = false,
  query = '',
  emptyText = 'No subfolders.',
  loadingText = 'Loading…',
}: FolderPickerEmptyStateProps) {
  if (error) {
    return <div className="px-3 py-2 text-xs text-destructive">{error}</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-foreground-muted">
        <Spinner className="size-3.5" />
        {loadingText}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 text-xs text-foreground-muted">
      {query ? `No folders match “${query}”.` : emptyText}
    </div>
  );
}
