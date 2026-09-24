import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export interface FolderPickerFooterProps {
  /** Whatever the picker wants to say about the pending choice. */
  leading?: ReactNode;
  /** Omitted when there is nothing to dismiss, which hides the button. */
  onCancel?: () => void;
  onSelect: () => void;
  selectDisabled?: boolean;
  cancelLabel?: string;
  selectLabel?: string;
}

/**
 * The action row that ends the interaction.
 *
 * "Select", not "Apply": the button finishes choosing a value, where "Apply"
 * would belong on a form that has been edited. Cancel renders only when the
 * consumer supplies a handler, so an embedded surface with nothing to dismiss
 * does not show a button that does nothing.
 */
export function FolderPickerFooter({
  leading,
  onCancel,
  onSelect,
  selectDisabled = false,
  cancelLabel = 'Cancel',
  selectLabel = 'Select',
}: FolderPickerFooterProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-3 py-2">
      <div className="flex min-w-0 items-center gap-1">{leading}</div>
      <div className="flex shrink-0 items-center gap-1">
        {onCancel && (
          <Button variant="ghost" size="xs" type="button" className="h-7" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button
          variant="default"
          size="xs"
          type="button"
          className="h-7"
          disabled={selectDisabled}
          onClick={onSelect}
        >
          {selectLabel}
        </Button>
      </div>
    </div>
  );
}
