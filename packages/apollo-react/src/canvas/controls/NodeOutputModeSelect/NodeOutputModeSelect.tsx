import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, CircleDot, CircleOff, FileBracesCorner, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';

export interface NodeOutputModeOption {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

// Single source of truth for the default modes: label/description carry the
// lingui descriptors so the constant (English) and the hook (localized)
// cannot drift. The ids are also hand-maintained in locales/en.json.
const MODE_DEFS = [
  {
    value: 'live',
    icon: CircleDot,
    label: { id: 'canvas.node_mode_select.live_label', message: 'Live' },
    description: {
      id: 'canvas.node_mode_select.live_description',
      message: 'Use the real response from this node',
    },
  },
  {
    value: 'static',
    icon: FileBracesCorner,
    label: { id: 'canvas.node_mode_select.static_label', message: 'Static mock' },
    description: {
      id: 'canvas.node_mode_select.static_description',
      message: 'Always return a value you define',
    },
  },
  {
    value: 'simulated',
    icon: Sparkles,
    label: { id: 'canvas.node_mode_select.simulated_label', message: 'Simulated' },
    description: {
      id: 'canvas.node_mode_select.simulated_description',
      message: 'Generate a response dynamically using an LLM',
    },
  },
  {
    value: 'disabled',
    icon: CircleOff,
    label: { id: 'canvas.node_mode_select.disabled_label', message: 'Skip node' },
    description: {
      id: 'canvas.node_mode_select.disabled_description',
      message: "Don't execute this node",
    },
  },
] as const;

/**
 * Default execution modes for a canvas node's output (English copy).
 * Prefer `useDefaultNodeOutputModes()` in React code — it returns the same options
 * with localized labels and descriptions.
 */
export const DEFAULT_NODE_OUTPUT_MODES: NodeOutputModeOption[] = MODE_DEFS.map((mode) => ({
  value: mode.value,
  label: mode.label.message,
  description: mode.description.message,
  icon: mode.icon,
}));

/** The default execution modes with localized labels and descriptions. */
export function useDefaultNodeOutputModes(): NodeOutputModeOption[] {
  const { _ } = useSafeLingui();
  return useMemo(
    () =>
      MODE_DEFS.map((mode) => ({
        value: mode.value,
        label: _(mode.label),
        description: _(mode.description),
        icon: mode.icon,
      })),
    [_]
  );
}

export interface NodeOutputModeSelectProps {
  /** Selected mode value. Falls back to the first option when unknown. */
  value: string;
  onChange: (value: string) => void;
  /** Selectable modes. Defaults to the localized `useDefaultNodeOutputModes()` options. */
  options?: NodeOutputModeOption[];
  disabled?: boolean;
  className?: string;
}

/** Pill-shaped dropdown for choosing how a node executes (live, mocked, simulated, skipped). */
export function NodeOutputModeSelect({
  value,
  onChange,
  options,
  disabled = false,
  className,
}: NodeOutputModeSelectProps) {
  const { _ } = useSafeLingui();
  const defaultModes = useDefaultNodeOutputModes();
  const resolvedOptions = options ?? defaultModes;
  const current = resolvedOptions.find((option) => option.value === value) ?? resolvedOptions[0];
  const CurrentIcon = current?.icon;
  // The trigger falls back to the first option when `value` matches none, so
  // the radio group and highlight track that same resolved value; otherwise an
  // unknown `value` would leave no item checked while the trigger shows one.
  const selectedValue = current?.value ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          aria-label={_({
            id: 'canvas.node_mode_select.node_mode',
            message: 'Node mode',
          })}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground',
            disabled &&
              'cursor-default opacity-60 hover:bg-transparent hover:text-foreground-muted',
            className
          )}
        >
          {CurrentIcon && <CurrentIcon size={10} className="text-foreground-subtle" />}
          <span>{current?.label}</span>
          <ChevronDown size={10} className="text-foreground-subtle" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Radio semantics so AT announces the selected mode (menuitemradio +
            aria-checked); the built-in left indicator marks the selected row
            in the accent color. */}
        <DropdownMenuRadioGroup value={selectedValue} onValueChange={onChange}>
          {resolvedOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className={cn(
                  'group flex items-center gap-2 [&>span:first-child]:text-foreground-accent',
                  selectedValue === option.value && 'text-foreground'
                )}
              >
                {Icon && <Icon size={13} className="shrink-0 text-foreground-subtle" />}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-xs font-medium">{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] leading-tight text-foreground-muted">
                      {option.description}
                    </span>
                  )}
                </div>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
