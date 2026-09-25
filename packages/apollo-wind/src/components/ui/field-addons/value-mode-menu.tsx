import { type LucideIcon, MoreHorizontal, SquareFunction, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib';
import { useValueModeStrings, type ValueMode, type ValueModeStrings } from './value-mode-strings';

/** One selectable mode. `id` is the consumer's own vocabulary. */
export interface ValueModeOption<Id extends string = string> {
  id: Id;
  title: string;
  description?: string;
  icon: LucideIcon;
  disabled?: boolean;
}

/** A field-supplied action listed under the modes, such as Clear value. */
export interface ValueModeMenuAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Icon as a data URI, used when `icon` is absent. */
  iconDataUri?: string;
  disabled?: boolean;
  onSelect: () => void;
}

interface ValueModeMenuBaseProps<Id extends string> {
  mode: Id;
  onSelect: (mode: Id) => void;
  /** Listed before `modes` (or the built-in pair). */
  extraModes?: ValueModeOption<Id>[];
  /** Listed below the modes, behind a separator. */
  actions?: ValueModeMenuAction[];
  /** The item to mark active when it differs from `mode`; `'none'` marks neither. */
  checked?: Id | 'none';
  /** Hides the modes and shows only `actions`, under an overflow trigger rather than a mode glyph. */
  modesDisabled?: boolean;
  disabled?: boolean;
  /** Picks the built-in Fixed value description (`number`, `boolean`, anything else). */
  expectedType?: string;
  /** Overrides the built-in Fixed value description. */
  literalDescription?: string;
}

/**
 * `modes` may be omitted when `Id` is the built-in modes, or one of them as `mode="literal"` infers,
 * or includes both. The menu then falls back to them and calls `onSelect` with either. Other ids,
 * such as `'fixed' | 'expr'`, must bring their own `modes`.
 */
export type ValueModeMenuProps<Id extends string = ValueMode> = ValueModeMenuBaseProps<Id> &
  ([Id] extends [ValueMode]
    ? BuiltInModes<Id>
    : [ValueMode] extends [Id]
      ? BuiltInModes<Id>
      : OwnModes<Id>);

type BuiltInModes<Id extends string> = {
  /** The mode list. Omitted, it is the built-in Fixed value / Expression pair. */
  modes?: ValueModeOption<Id>[];
};
type OwnModes<Id extends string> = {
  /** The mode list. */
  modes: ValueModeOption<Id>[];
};

function literalDescriptionFor(expectedType: string | undefined, strings: ValueModeStrings) {
  if (expectedType === 'number') return strings.literalNumberDescription;
  if (expectedType === 'boolean') return strings.literalBooleanDescription;
  return strings.literalDescription;
}

/**
 * One selectable mode in a value-mode dropdown: icon and label, with an optional description.
 * Shared with LockableValueField's mode dropdown, and not exported from the package.
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
      // item does. Radix's own radio item needs a radio group, which LockableValueField lacks.
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
 * Switches a field between value modes. The trigger shows the current mode's icon and is named by
 * its title; the menu lists each mode with its description, then any field actions.
 */
export function ValueModeMenu<Id extends string = ValueMode>({
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
}: ValueModeMenuProps<Id>) {
  const strings = useValueModeStrings();
  const checkedMode = checked ?? mode;

  const baseModes: ValueModeOption<Id>[] = modes ?? [
    {
      id: 'literal' as Id,
      title: strings.literalTitle,
      description: literalDescription ?? literalDescriptionFor(expectedType, strings),
      icon: Type,
    },
    {
      id: 'expression' as Id,
      title: strings.expressionTitle,
      description: strings.expressionDescription,
      icon: SquareFunction,
    },
  ];
  const resolvedModes = extraModes ? [...extraModes, ...baseModes] : baseModes;
  const activeMode = resolvedModes.find((item) => item.id === mode);

  // With the modes hidden this is the field's overflow menu, and a mode glyph on it would advertise
  // a switch it does not offer.
  const TriggerIcon = modesDisabled ? MoreHorizontal : (activeMode?.icon ?? Type);
  const triggerLabel = modesDisabled
    ? strings.fieldActions
    : (activeMode?.title ?? strings.literalTitle);

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
