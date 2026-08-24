import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, CircleDot, FileBracesCorner } from 'lucide-react';
import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasIcon } from '../../utils/icon-registry';

/**
 * A mode's icon: either a Lucide component, or a canvas icon-registry name.
 *
 * Names exist because not every canvas icon is a Lucide one — Apollo's own
 * registry entries (`file-sparkles-corner`, the project glyphs) are plain
 * components taking `{ w, h, color }`, so they are not assignable to
 * `LucideIcon`. Passing the name lets a consumer use the same identifier here
 * that it passes to `CanvasIcon` elsewhere, instead of keeping a parallel
 * component map that can drift from it.
 */
export type NodeOutputModeIcon = LucideIcon | string;

export interface NodeOutputModeOption {
  value: string;
  label: string;
  description?: string;
  icon?: NodeOutputModeIcon;
}

/**
 * Renders either icon shape. Registry icons ignore `className` and default to
 * `currentColor`, so a name goes in a span that carries the colour class for the
 * glyph to inherit, rather than being handed the class directly.
 */
function ModeIcon({
  icon,
  size,
  className,
}: {
  icon: NodeOutputModeIcon;
  size?: number;
  className?: string;
}) {
  if (typeof icon === 'string') {
    return (
      <span className={cn('inline-flex', className)}>
        <CanvasIcon icon={icon} size={size} />
      </span>
    );
  }
  const Icon = icon;
  return <Icon size={size} className={className} />;
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
    // The one registry name here: generated output has no Lucide equivalent, and
    // this is the icon the canvas node adornment uses for the same state, so the
    // dropdown and the node read as one family. The others stay components,
    // which are typo-proof.
    value: 'simulated',
    icon: 'file-sparkles-corner',
    label: { id: 'canvas.node_mode_select.simulated_label', message: 'Simulated' },
    description: {
      id: 'canvas.node_mode_select.simulated_description',
      message: 'Generate a response dynamically using an LLM',
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

/** Pill-shaped dropdown for choosing how a node produces output (live, mocked, generated). */
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
        <Button
          variant="ghost"
          size="3xs"
          disabled={disabled}
          aria-label={_({
            id: 'canvas.node_mode_select.node_mode',
            message: 'Node output mode',
          })}
          className={cn(
            'min-w-12 gap-1.5 rounded-full border border-border px-2 text-[11px] font-medium text-foreground-muted hover:bg-surface-overlay hover:text-foreground [&_svg]:size-2.5',
            className
          )}
        >
          {CurrentIcon && (
            <ModeIcon icon={CurrentIcon} className="text-foreground-subtle" size={10} />
          )}
          <span className="min-w-0 flex-1 truncate shrink-0">{current?.label}</span>
          <ChevronDown className="text-foreground-subtle" />
        </Button>
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
                {Icon && (
                  <ModeIcon icon={Icon} size={13} className="shrink-0 text-foreground-subtle" />
                )}
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
