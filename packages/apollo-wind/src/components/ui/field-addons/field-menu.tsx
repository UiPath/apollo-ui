import { type LucideIcon, MoreHorizontal, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib';
import {
  builtInValueModes,
  isBuiltInValueMode,
  type ValueModeOption,
} from './built-in-value-modes';
import {
  DEFAULT_VALUE_MODE_STRINGS,
  type ValueMode,
  type ValueModeStrings,
} from './value-mode-strings';

/** A field-supplied action listed under the modes, such as Clear value. */
export interface FieldMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Icon as a data URI, used when `icon` is absent. */
  iconDataUri?: string;
  disabled?: boolean;
  onSelect: () => void;
}

/** A mode to list: a full option, or the id of a built-in mode that `Id` shares. */
export type FieldMenuMode<Id extends string> = ValueModeOption<Id> | Extract<Id, ValueMode>;

interface FieldMenuBaseProps<Id extends string> {
  mode: Id;
  onSelect: (mode: Id) => void;
  /** Listed before `modes` (or the built-in pair). */
  extraModes?: ValueModeOption<Id>[];
  /** Listed below the modes, behind a separator. */
  actions?: FieldMenuItem[];
  /** The item to mark active when it differs from `mode`; `'none'` marks neither. */
  checked?: Id | 'none';
  /** Hides the modes and shows only `actions`, under an overflow trigger rather than a mode glyph. */
  modesDisabled?: boolean;
  disabled?: boolean;
  /** Picks the built-in Fixed value description (`number`, `boolean`, anything else). */
  expectedType?: string;
  /** Overrides the built-in Fixed value description. */
  literalDescription?: string;
  /** Names the trigger while it offers modes. Defaults to the active mode's title. */
  triggerLabel?: string;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ValueModeStrings>;
}

/**
 * `modes` may be omitted when `Id` is the built-in modes, or one of them as `mode="literal"` infers,
 * or includes them all. The menu then falls back to Fixed value and Expression and calls `onSelect`
 * with either. Other ids, such as `'fixed' | 'expr'`, must bring their own `modes`; ids a vocabulary
 * shares with the built-ins may be listed by id alone.
 */
export type FieldMenuProps<Id extends string = ValueMode> = FieldMenuBaseProps<Id> &
  ([Id] extends [ValueMode]
    ? BuiltInModes<Id>
    : [ValueMode] extends [Id]
      ? BuiltInModes<Id>
      : OwnModes<Id>);

type BuiltInModes<Id extends string> = {
  /** The mode list. Omitted, it is the built-in Fixed value / Expression pair. */
  modes?: FieldMenuMode<Id>[];
};
type OwnModes<Id extends string> = {
  /** The mode list. */
  modes: FieldMenuMode<Id>[];
};

const DEFAULT_MODES: ValueMode[] = ['literal', 'expression'];

/**
 * One selectable mode in a value-mode dropdown: icon and label, with an optional description.
 * Shared with QuickFormField's mode dropdown, and not exported from the package.
 */
export function ValueModeMenuItem({
  icon: Icon,
  label,
  description,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      // A single choice among modes, which screen readers announce as checked or not, as a radio
      // item does. Radix's own radio item needs a radio group, which QuickFormField lacks.
      role="menuitemradio"
      aria-checked={active}
      className="flex-col items-start gap-0.5 py-2"
      data-active={active || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Icon size={13} className={active ? 'text-brand' : 'text-foreground-muted'} />
        <span className={cn('text-xs font-medium', active ? 'text-brand' : 'text-foreground')}>
          {label}
        </span>
      </div>
      {description && (
        <span className="pl-6 text-[11px] leading-4 text-foreground-subtle">{description}</span>
      )}
    </DropdownMenuItem>
  );
}

/**
 * A field's trailing menu: switches it between value modes, then lists its actions. The trigger
 * shows the current mode's icon and is named by its title; with the modes hidden it is the field's
 * overflow menu.
 */
export function FieldMenu<Id extends string = ValueMode>({
  mode,
  onSelect,
  modes,
  extraModes,
  actions,
  checked,
  modesDisabled,
  disabled,
  expectedType,
  literalDescription,
  triggerLabel: triggerLabelOverride,
  strings,
}: FieldMenuProps<Id>) {
  const text = { ...DEFAULT_VALUE_MODE_STRINGS, ...strings };
  const checkedMode = checked ?? mode;

  const builtIns = builtInValueModes(text, {
    expectedType,
    literalDescription,
  });
  // Without `modes`, `Id` is the built-in vocabulary (the props type enforces it).
  const entries = modes ?? (DEFAULT_MODES as FieldMenuMode<Id>[]);
  const baseModes = entries.map((entry) =>
    typeof entry === 'string' && isBuiltInValueMode(entry)
      ? (builtIns[entry] as ValueModeOption<string> as ValueModeOption<Id>)
      : (entry as ValueModeOption<Id>)
  );
  const resolvedModes = extraModes ? [...extraModes, ...baseModes] : baseModes;
  const activeMode = resolvedModes.find((item) => item.id === mode);

  // With the modes hidden this is the field's overflow menu, and a mode glyph on it would advertise
  // a switch it does not offer.
  const TriggerIcon = modesDisabled ? MoreHorizontal : (activeMode?.icon ?? Type);
  const triggerLabel = modesDisabled
    ? text.fieldActions
    : (triggerLabelOverride ?? activeMode?.title ?? text.literalTitle);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="3xs"
          disabled={disabled}
          aria-label={triggerLabel}
          // The square icon button an `InputGroupAddon` expects.
          className="size-6 shrink-0 rounded-md p-0 text-muted-foreground hover:bg-accent hover:text-foreground [&_svg]:size-3.5"
        >
          <TriggerIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {!modesDisabled &&
          resolvedModes.map((item) => (
            <ValueModeMenuItem
              key={item.id}
              icon={item.icon}
              label={item.title}
              description={item.description}
              active={checkedMode === item.id}
              disabled={item.disabled}
              onClick={() => onSelect(item.id)}
            />
          ))}
        {!modesDisabled && !!actions?.length && <DropdownMenuSeparator />}
        {actions?.map((action) => {
          const ActionIcon = action.icon;
          return (
            <DropdownMenuItem key={action.id} disabled={action.disabled} onClick={action.onSelect}>
              {ActionIcon ? (
                <ActionIcon />
              ) : (
                action.iconDataUri && (
                  <img src={action.iconDataUri} alt="" className="size-4 shrink-0" />
                )
              )}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
