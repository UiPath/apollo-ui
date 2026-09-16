import { cn } from '@uipath/apollo-wind';
import * as React from 'react';

export interface GuardrailPaletteItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<'button'>,
    // `onClick` too, so a caller spreading its own handler cannot reinstate the disabled guard.
    'children' | 'disabled' | 'onSelect' | 'onClick'
  > {
  name: string;
  /** Secondary line, wrapped rather than truncated: the palette is where it is read. */
  description?: string;
  chips?: React.ReactNode;
  /** Only the create-custom entry has one; definitions carry no icons. */
  icon?: React.ReactNode;
  /**
   * Visible but not choosable. `aria-disabled`, not `disabled`, so the entry stays focusable
   * and a keyboard user reaches the chip saying why it cannot be picked.
   */
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * One palette entry, presentational and unaware of grouping. A real button, where Agents' entry
 * is a `div` with `role="listitem"`, `tabIndex={0}` and its own key handler.
 */
const GuardrailPaletteItem = React.forwardRef<HTMLButtonElement, GuardrailPaletteItemProps>(
  ({ name, description, chips, icon, disabled = false, onSelect, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="guardrail-palette-item"
      aria-disabled={disabled || undefined}
      className={cn(
        'flex w-full items-start gap-2 rounded-md p-2 text-left ring-offset-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Gated on the enabled branch, like wind's `Button` ghost and `CommandItem`.
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-accent hover:text-accent-foreground',
        className
      )}
      onClick={disabled ? undefined : onSelect}
      {...props}
    >
      {icon && <span className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{name}</span>
          {chips}
        </span>
        {description && (
          <span className="whitespace-normal break-words text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </button>
  )
);
GuardrailPaletteItem.displayName = 'GuardrailPaletteItem';

export { GuardrailPaletteItem };
