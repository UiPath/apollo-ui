import { Braces, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { VariablePicker, type VariablePickerItem } from '@/components/ui/variable-picker';
import { cn } from '@/lib';
import { COLLAPSED_HIDDEN, COLLAPSED_ICON_PADDING } from './collapse';

export interface InsertVariableActionStrings {
  /** Visible text, hidden when the action collapses to its icon. */
  label: string;
  /** Accessible name and hover title. */
  ariaLabel: string;
  /** The picker's search box. */
  searchPlaceholder: string;
  /** The picker with nothing to show. */
  empty: string;
  /** Confirms replacing a value that cannot take the reference at a caret. */
  replaceTitle: string;
  replaceDescription: string;
  replaceConfirm: string;
}

export const DEFAULT_INSERT_VARIABLE_ACTION_STRINGS: InsertVariableActionStrings = {
  label: 'Insert',
  ariaLabel: 'Insert variable',
  searchPlaceholder: 'Search variables...',
  empty: 'No variables found.',
  replaceTitle: 'Replace the value?',
  replaceDescription: 'The variable will replace the current value. This cannot be undone.',
  replaceConfirm: 'Replace',
};

export interface InsertVariableActionProps {
  /**
   * The variables to offer, rendered as supplied: the picker adds no root and no types. A function
   * is called each time the picker opens, never during render, so a host can hand over a live
   * source without re-rendering the field whenever it changes.
   */
  variables: VariablePickerItem[] | (() => VariablePickerItem[]);
  /** Called with the picked variable's value. Omitted, the action is disabled. */
  onInsert?: (value: string) => void;
  disabled?: boolean;
  /** Icon only. Below a 260px `@container` the action also collapses to its icon by itself. */
  compact?: boolean;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<InsertVariableActionStrings>;
}

/** The Insert-variable header action: opens a variable picker and reports the pick. */
export function InsertVariableAction({
  variables,
  onInsert,
  disabled,
  compact,
  strings,
}: InsertVariableActionProps) {
  const text = { ...DEFAULT_INSERT_VARIABLE_ACTION_STRINGS, ...strings };
  const lazy = typeof variables === 'function';
  // A function's result is unknown until the picker opens, so only a supplied empty list disables.
  const inert = disabled || !onInsert || (!lazy && variables.length === 0);
  const [openedItems, setOpenedItems] = useState<VariablePickerItem[]>([]);
  const collapsedTextClass = cn(COLLAPSED_HIDDEN, compact && '!hidden');

  return (
    <VariablePicker
      disabled={inert}
      items={lazy ? openedItems : variables}
      placeholder={text.searchPlaceholder}
      emptyText={text.empty}
      onOpenChange={(open) => {
        if (open && lazy) setOpenedItems(variables());
      }}
      onSelect={(variable) => {
        if (variable.value) onInsert?.(variable.value);
      }}
    >
      <button
        type="button"
        aria-label={text.ariaLabel}
        title={text.ariaLabel}
        disabled={inert}
        className={cn(
          'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
          COLLAPSED_ICON_PADDING,
          compact && '!px-1.5'
        )}
      >
        <Braces size={12} />
        <span className={collapsedTextClass}>{text.label}</span>
        <ChevronDown size={9} className={collapsedTextClass} />
      </button>
    </VariablePicker>
  );
}
