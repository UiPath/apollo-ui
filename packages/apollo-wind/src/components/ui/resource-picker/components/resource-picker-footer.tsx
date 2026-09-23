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
    // Keys stop here, so a focused footer control keeps them to itself: Enter
    // runs its own action rather than cmdk committing the active row, and the
    // arrows, Home and End neither move cmdk's cursor nor fold a group behind
    // it. Native activation still happens. Escape alone goes on, so the
    // picker can still clear its search from here.
    // biome-ignore lint/a11y/noStaticElementInteractions: only stops propagation; the controls inside are interactive
    <div
      className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-popover px-3 py-2"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
    >
      <div className="flex min-w-0 items-center gap-1">{leading}</div>
      <div className="flex shrink-0 items-center gap-1">{trailing}</div>
    </div>
  );
}
