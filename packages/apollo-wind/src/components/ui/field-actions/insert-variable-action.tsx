import { Braces, ChevronDown } from 'lucide-react';
import { VariablePicker } from '@/components/ui/variable-picker';
import { cn } from '@/lib';
import { COLLAPSED_HIDDEN, COLLAPSED_ICON_PADDING } from './collapse';

export interface InsertVariableActionStrings {
  /** Visible text, hidden when the action collapses to its icon. */
  label: string;
  /** Accessible name and hover title. */
  ariaLabel: string;
}

export const DEFAULT_INSERT_VARIABLE_ACTION_STRINGS: InsertVariableActionStrings = {
  label: 'Insert',
  ariaLabel: 'Insert variable',
};

export interface InsertVariableActionProps {
  variables: { label: string; value: string }[];
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
  const inert = disabled || variables.length === 0 || !onInsert;
  const collapsedTextClass = cn(COLLAPSED_HIDDEN, compact && '!hidden');

  return (
    <VariablePicker
      disabled={inert}
      items={[
        {
          id: 'vars',
          label: '$vars',
          type: 'object',
          children: variables.map((variable) => ({
            id: variable.value,
            label: variable.label,
            value: variable.value,
            type: 'string',
          })),
        },
      ]}
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
