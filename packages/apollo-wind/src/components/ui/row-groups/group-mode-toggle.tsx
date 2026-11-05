import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib';

export interface GroupModeOption<T extends string> {
  value: T;
  label: string;
}

/** How a group's conditions combine: every one (AND) or any one (OR). */
export type MatchMode = 'all' | 'any';

/** The modes of a condition group. Map the labels to translate them. */
export const MATCH_MODES: readonly GroupModeOption<MatchMode>[] = [
  { value: 'all', label: 'All (AND)' },
  { value: 'any', label: 'Any (OR)' },
];

export interface GroupModeToggleStrings {
  /** The toggle's accessible name. Name the group when there are several, e.g. "Group 1 match mode". */
  label: string;
}

export const DEFAULT_GROUP_MODE_TOGGLE_STRINGS: GroupModeToggleStrings = {
  label: 'Group mode',
};

export interface GroupModeToggleProps<T extends string> {
  /** Two or three short options. More than that belongs in a Select. */
  modes: readonly GroupModeOption<T>[];
  value: T;
  onValueChange?: (value: T) => void;
  disabled?: boolean;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<GroupModeToggleStrings>;
}

/**
 * A row group's mode switch, such as a condition group's All / Any. One per group, above its rows.
 */
export function GroupModeToggle<T extends string>({
  modes,
  value,
  onValueChange,
  disabled,
  strings,
}: GroupModeToggleProps<T>) {
  const text = { ...DEFAULT_GROUP_MODE_TOGGLE_STRINGS, ...strings };
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="xs"
      aria-label={text.label}
      value={value}
      disabled={disabled}
      // Radix reports '' when the pressed item is clicked again; a group always has a mode.
      onValueChange={(next) => {
        const mode = modes.find((option) => option.value === next);
        if (mode) onValueChange?.(mode.value);
      }}
    >
      {modes.map((mode, index) => (
        <ToggleGroupItem
          key={mode.value}
          value={mode.value}
          className={cn(
            'h-7 rounded-lg px-2.5',
            index > 0 && '-ml-px rounded-l-none',
            index < modes.length - 1 && 'rounded-r-none'
          )}
        >
          {mode.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
