import type { ReactNode } from 'react';

export interface ResourcePickerFooterProps {
  leading?: ReactNode;
  trailing?: ReactNode;
}

/**
 * The link row that ends the list.
 *
 * Two slots rather than a Cancel and Select pair: rows commit on click, so
 * there is nothing left to confirm, and the space belongs instead to the ways
 * out of the picker. Renders nothing when neither slot is filled, so a picker
 * with no links does not end in an empty rule.
 */
export function ResourcePickerFooter({ leading, trailing }: ResourcePickerFooterProps) {
  if (!leading && !trailing) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-popover px-3 py-2">
      <div className="flex min-w-0 items-center gap-1">{leading}</div>
      <div className="flex shrink-0 items-center gap-1">{trailing}</div>
    </div>
  );
}
