import { cn } from '@uipath/apollo-wind';
import * as React from 'react';

export interface GuardrailPaletteItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<'button'>,
    // `onClick` is omitted alongside `onSelect` so the disabled guard below cannot be
    // reinstated by a caller spreading its own handler over it.
    'children' | 'disabled' | 'onSelect' | 'onClick'
  > {
  /** Primary line: a definition's display name, or the create-custom label. */
  name: string;
  /** Secondary line, wrapped rather than truncated: the palette is where it is read. */
  description?: string;
  /** Chips rendered after the name (connector, lifecycle, status). */
  chips?: React.ReactNode;
  /** Leading glyph. Only the create-custom entry has one; definitions carry no icons. */
  icon?: React.ReactNode;
  /**
   * Visible but not choosable (an `Unauthorised` definition). Implemented as `aria-disabled`
   * rather than `disabled`, so the entry stays focusable and a keyboard user arrowing through
   * the palette still reaches the chip that says why it cannot be picked.
   */
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * One palette entry: a real button, so it is reachable and operable from the keyboard.
 *
 * Presentational, and unaware of grouping. Agents' entry today is a `div` with
 * `role="listitem"`, `tabIndex={0}` and its own key handler, which both puts a list item
 * outside a list and reimplements what a button already does.
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
        // Hover is gated on `!disabled` rather than set unconditionally and undone: wind's own
        // interactive-item hover (`Button` ghost, `CommandItem`), and no counter-rule.
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
