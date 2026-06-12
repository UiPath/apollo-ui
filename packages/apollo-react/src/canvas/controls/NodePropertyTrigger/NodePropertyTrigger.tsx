import {
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import {
  type ComponentPropsWithoutRef,
  Fragment,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasIcon } from '../../utils/icon-registry';

export type NodePropertyTriggerItem = {
  /**
   * Stable identity passed to `onPanelToggle`. Falls back to `label` when
   * omitted — supply an `id` whenever labels are localized or can change.
   */
  id?: string;
  label: string;
  enabled?: boolean;
};

// Literal suggestions are provided for IntelliSense but the type accepts any
// string so consumers can introduce custom behaviors without casting.
export type NodePropertyTriggerBehavior = 'auto-hide' | 'always-persist' | (string & {});
export type NodePropertyTriggerLayout = 'right' | 'bottom' | 'split' | (string & {});
export type NodePropertyTriggerPreset = { id: string; label: string };

export type NodePropertyTriggerBehaviorOption = {
  value: NodePropertyTriggerBehavior;
  label: string;
};

export type NodePropertyTriggerLayoutOption = {
  value: NodePropertyTriggerLayout;
  label: string;
};

type Translate = ReturnType<typeof useSafeLingui>['_'];

/**
 * Clamps an uncontrolled selection to the current option set at render time,
 * so a later options change can never strand the radio group on a value that
 * no longer exists. No effect/state-sync needed.
 */
function clampToOptions<T extends string>(value: T, options: { value: T }[]): T {
  return options.some((option) => option.value === value) ? value : (options[0]?.value ?? value);
}

// Built lazily so the default labels go through Lingui (English message as
// fallback when no I18nProvider is mounted) — same pattern as the other
// canvas components (CanvasZoomControls, StageNode).
const defaultBehaviorOptions = (_: Translate): NodePropertyTriggerBehaviorOption[] => [
  {
    value: 'auto-hide',
    label: _({ id: 'canvas.property_trigger.auto_hide', message: 'Auto hide' }),
  },
  {
    value: 'always-persist',
    label: _({ id: 'canvas.property_trigger.always_persist', message: 'Always persist' }),
  },
];

const defaultLayoutOptions = (_: Translate): NodePropertyTriggerLayoutOption[] => [
  {
    value: 'right',
    label: _({ id: 'canvas.property_trigger.layout_right', message: 'Default — Right' }),
  },
  {
    value: 'bottom',
    label: _({ id: 'canvas.property_trigger.layout_bottom', message: 'Default — Bottom' }),
  },
  {
    value: 'split',
    label: _({ id: 'canvas.property_trigger.layout_split', message: 'Default — Split' }),
  },
];

export type NodePropertyTriggerProps = {
  /** Text shown on the label button. Defaults to 'Properties'. */
  label?: string;
  /** Additional class names applied to the trigger root element. */
  className?: string;
  /**
   * When false the trigger renders as a plain label pill — no divider, no
   * sliders button, no popover. Lets the same component serve secondary
   * triggers (e.g. a Variables pill) that only need `onPropertiesClick`.
   * @default true
   */
  showMenu?: boolean;
  /** Controlled popover state. Omit for uncontrolled (Radix-managed). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the sliders button. Defaults to 'Panel options'. */
  menuAriaLabel?: string;
  /**
   * Custom popover content. When provided it fully replaces the built-in
   * sections — compose with `NodePropertyTriggerCheckboxItem`,
   * `NodePropertyTriggerRadioItem`, `NodePropertyTriggerSectionLabel`,
   * `NodePropertyTriggerSeparator`, and any `@uipath/apollo-wind`
   * DropdownMenu primitives. This is the i18n/extension path: all text in
   * composed content is consumer-rendered.
   */
  children?: ReactNode;
  /** Called when the label button is clicked. */
  onPropertiesClick?: () => void;

  // ── Built-in sections (used only when `children` is not provided) ──
  /** Panels to display as toggleable items in the popover. */
  panels?: NodePropertyTriggerItem[];
  /** Currently active panel behavior — reflected as a selection indicator in the popover. */
  behavior?: NodePropertyTriggerBehavior;
  /** Behavior options shown in the popover. Defaults to Auto hide / Always persist. */
  behaviorOptions?: NodePropertyTriggerBehaviorOption[];
  /** Currently active layout — reflected as a selection indicator in the popover. */
  layout?: NodePropertyTriggerLayout;
  /** Layout options shown in the popover. Defaults to Right / Bottom / Split. */
  layoutOptions?: NodePropertyTriggerLayoutOption[];
  /** Saved presets to show in the popover. */
  presets?: NodePropertyTriggerPreset[];
  onBehaviorChange?: (behavior: NodePropertyTriggerBehavior) => void;
  onLayoutChange?: (layout: NodePropertyTriggerLayout) => void;
  /** Receives the panel's `id` (or its `label` when no id was supplied). */
  onPanelToggle?: (id: string, enabled: boolean) => void;
  onPresetApply?: (preset: NodePropertyTriggerPreset) => void;
  /** When provided, each preset row shows a rename (pencil) button. */
  onPresetRename?: (preset: NodePropertyTriggerPreset) => void;
  onPresetDelete?: (id: string) => void;
  onSavePreset?: () => void;
  /** When true a "Save as preset" button is shown at the bottom of the presets section. */
  canSavePreset?: boolean;
};

const ROW_CLASS =
  'group justify-between gap-2 rounded-none px-3 py-2 text-xs text-foreground-muted focus:bg-surface-overlay focus:text-foreground';

/** Right-aligned state dot driven by Radix's `data-state` on the parent row. */
const DOT_CLASS =
  'size-2 shrink-0 rounded-full bg-surface-overlay group-data-[state=checked]:bg-foreground-accent';

/** Hides the built-in left ItemIndicator from the apollo-wind item wrappers. */
const HIDE_LEFT_INDICATOR_CLASS = '[&>span:first-child]:hidden';

/** Uppercase section heading matching the canvas panel-options design. */
export function NodePropertyTriggerSectionLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuLabel>) {
  return (
    <DropdownMenuLabel
      className={cn(
        'px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle',
        className
      )}
      {...props}
    />
  );
}

/** Full-width section separator matching the canvas panel-options design. */
export function NodePropertyTriggerSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator className={cn('mx-0 my-0 bg-border-subtle', className)} {...props} />
  );
}

export type NodePropertyTriggerCheckboxItemProps = ComponentPropsWithoutRef<
  typeof DropdownMenuCheckboxItem
> & {
  /**
   * Checkbox rows keep the menu open by default so several panels can be
   * toggled in one visit. Set true to close on select instead.
   * @default false
   */
  closeOnSelect?: boolean;
};

/** Checkbox row with a right-aligned state dot (canvas panel-options design). */
export function NodePropertyTriggerCheckboxItem({
  className,
  children,
  closeOnSelect = false,
  onSelect,
  ...props
}: NodePropertyTriggerCheckboxItemProps) {
  return (
    <DropdownMenuCheckboxItem
      className={cn(ROW_CLASS, HIDE_LEFT_INDICATOR_CLASS, className)}
      onSelect={(e) => {
        if (!closeOnSelect) e.preventDefault();
        onSelect?.(e);
      }}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <span className={DOT_CLASS} />
    </DropdownMenuCheckboxItem>
  );
}

/** Radio row with a right-aligned state dot (canvas panel-options design). */
export function NodePropertyTriggerRadioItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuRadioItem>) {
  return (
    <DropdownMenuRadioItem
      className={cn(ROW_CLASS, HIDE_LEFT_INDICATOR_CLASS, className)}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <span className={DOT_CLASS} />
    </DropdownMenuRadioItem>
  );
}

export function NodePropertyTrigger({
  label,
  className,
  showMenu = true,
  open,
  onOpenChange,
  menuAriaLabel,
  children,
  onPropertiesClick,
  panels = [],
  behavior,
  behaviorOptions,
  layout,
  layoutOptions,
  presets = [],
  onBehaviorChange,
  onLayoutChange,
  onPanelToggle,
  onPresetApply,
  onPresetRename,
  onPresetDelete,
  onSavePreset,
  canSavePreset = false,
}: NodePropertyTriggerProps) {
  const { _ } = useSafeLingui();
  const resolvedLabel =
    label ?? _({ id: 'canvas.property_trigger.properties', message: 'Properties' });
  const resolvedMenuAriaLabel =
    menuAriaLabel ?? _({ id: 'canvas.property_trigger.panel_options', message: 'Panel options' });
  const resolvedBehaviorOptions = behaviorOptions ?? defaultBehaviorOptions(_);
  const resolvedLayoutOptions = layoutOptions ?? defaultLayoutOptions(_);
  const labelBaseClassName =
    'flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-foreground-muted transition';

  // Uncontrolled fallback — when behavior/layout are not driven by the consumer,
  // the component manages them internally so it works correctly out of the box.
  const [internalBehavior, setInternalBehavior] = useState<NodePropertyTriggerBehavior>(
    () => resolvedBehaviorOptions[0]?.value ?? 'auto-hide'
  );
  const [internalLayout, setInternalLayout] = useState<NodePropertyTriggerLayout>(
    () => resolvedLayoutOptions[0]?.value ?? 'right'
  );
  const effectiveBehavior = behavior ?? clampToOptions(internalBehavior, resolvedBehaviorOptions);
  const effectiveLayout = layout ?? clampToOptions(internalLayout, resolvedLayoutOptions);

  const handleBehaviorChange = useCallback(
    (val: string) => {
      if (onBehaviorChange) {
        onBehaviorChange(val);
      } else {
        setInternalBehavior(val);
      }
    },
    [onBehaviorChange]
  );

  const handleLayoutChange = useCallback(
    (val: string) => {
      if (onLayoutChange) {
        onLayoutChange(val);
      } else {
        setInternalLayout(val);
      }
    },
    [onLayoutChange]
  );

  // Empty sections collapse entirely (heading included) so consumers that
  // don't use a feature get a lean menu. Exception: the presets empty state
  // renders while `canSavePreset` is true — it teaches that presets exist.
  const sections: { key: string; node: ReactNode }[] = [];

  if (panels.length > 0) {
    sections.push({
      key: 'panels',
      node: panels.map(({ id, label: panelLabel, enabled }) => (
        <NodePropertyTriggerCheckboxItem
          key={id ?? panelLabel}
          checked={!!enabled}
          onCheckedChange={(checked) => onPanelToggle?.(id ?? panelLabel, checked === true)}
        >
          {panelLabel}
        </NodePropertyTriggerCheckboxItem>
      )),
    });
  }

  if (resolvedBehaviorOptions.length > 0) {
    sections.push({
      key: 'behavior',
      node: (
        <>
          <NodePropertyTriggerSectionLabel>
            {_({ id: 'canvas.property_trigger.panel_behavior', message: 'Panel behavior' })}
          </NodePropertyTriggerSectionLabel>
          <DropdownMenuRadioGroup value={effectiveBehavior} onValueChange={handleBehaviorChange}>
            {resolvedBehaviorOptions.map(({ value, label: behaviorLabel }) => (
              <NodePropertyTriggerRadioItem key={value} value={value}>
                {behaviorLabel}
              </NodePropertyTriggerRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </>
      ),
    });
  }

  if (resolvedLayoutOptions.length > 0) {
    sections.push({
      key: 'layouts',
      node: (
        <>
          <NodePropertyTriggerSectionLabel>
            {_({ id: 'canvas.property_trigger.default_layouts', message: 'Default layouts' })}
          </NodePropertyTriggerSectionLabel>
          <DropdownMenuRadioGroup value={effectiveLayout} onValueChange={handleLayoutChange}>
            {resolvedLayoutOptions.map(({ value, label: layoutLabel }) => (
              <NodePropertyTriggerRadioItem key={value} value={value}>
                {layoutLabel}
              </NodePropertyTriggerRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </>
      ),
    });
  }

  if (presets.length > 0 || canSavePreset) {
    sections.push({
      key: 'presets',
      node: (
        <>
          <NodePropertyTriggerSectionLabel>
            {_({ id: 'canvas.property_trigger.saved_presets', message: 'Saved presets' })}
          </NodePropertyTriggerSectionLabel>
          {presets.length === 0 && (
            <p className="px-3 pb-2 text-[11px] text-foreground-subtle">
              {_({
                id: 'canvas.property_trigger.no_saved_presets',
                message: 'No saved presets yet.',
              })}
            </p>
          )}
          {presets.map((preset) => (
            <Fragment key={preset.id}>
              <DropdownMenuItem
                aria-label={_({
                  id: 'canvas.property_trigger.apply_preset_with_label',
                  message: 'Apply {label}',
                  values: { label: preset.label },
                })}
                className={ROW_CLASS}
                onSelect={() => onPresetApply?.(preset)}
              >
                <span className="min-w-0 flex-1 truncate">{preset.label}</span>
              </DropdownMenuItem>
              {onPresetRename && (
                <DropdownMenuItem
                  className={cn(ROW_CLASS, 'justify-start pl-6')}
                  onSelect={(e) => {
                    e.preventDefault();
                    onPresetRename(preset);
                  }}
                >
                  <CanvasIcon icon="pencil" size={11} />
                  <span className="min-w-0 flex-1 truncate">
                    {_({
                      id: 'canvas.property_trigger.rename_preset_with_label',
                      message: 'Rename {label}',
                      values: { label: preset.label },
                    })}
                  </span>
                </DropdownMenuItem>
              )}
              {onPresetDelete && (
                <DropdownMenuItem
                  className={cn(ROW_CLASS, 'justify-start pl-6')}
                  onSelect={(e) => {
                    e.preventDefault();
                    onPresetDelete(preset.id);
                  }}
                >
                  <CanvasIcon icon="trash-2" size={11} />
                  <span className="min-w-0 flex-1 truncate">
                    {_({
                      id: 'canvas.property_trigger.delete_preset_with_label',
                      message: 'Delete {label}',
                      values: { label: preset.label },
                    })}
                  </span>
                </DropdownMenuItem>
              )}
            </Fragment>
          ))}
          {canSavePreset && (
            <DropdownMenuItem
              className={cn(ROW_CLASS, 'justify-start')}
              onSelect={() => onSavePreset?.()}
            >
              <CanvasIcon icon="plus" size={12} />
              <span>
                {_({ id: 'canvas.property_trigger.save_as_preset', message: 'Save as preset' })}
              </span>
            </DropdownMenuItem>
          )}
        </>
      ),
    });
  }

  const defaultSections = sections.map(({ key, node }, index) => (
    <Fragment key={key}>
      {index > 0 && <NodePropertyTriggerSeparator />}
      {node}
    </Fragment>
  ));

  return (
    <div
      data-node-property-panel-root
      className={cn(
        'w-fit flex flex-row items-center rounded-xl border border-border-subtle bg-surface-raised p-1',
        className
      )}
      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
    >
      {onPropertiesClick ? (
        <button
          type="button"
          onClick={onPropertiesClick}
          className={cn(labelBaseClassName, 'hover:bg-surface-overlay hover:text-foreground')}
        >
          {resolvedLabel}
        </button>
      ) : (
        <span className={labelBaseClassName}>{resolvedLabel}</span>
      )}

      {showMenu && (
        <>
          <div className="mx-0.5 h-4 w-px shrink-0 bg-border-subtle" />

          {/* modal={false}: Radix's modal overlay sets pointer-events:none on body,
              which doesn't play well with React Flow's foreignObject canvases —
              same rationale as CanvasDropdownMenu. */}
          <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title={resolvedMenuAriaLabel}
                aria-label={resolvedMenuAriaLabel}
                className="grid size-8 place-items-center rounded-lg text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground data-[state=open]:bg-surface-overlay data-[state=open]:text-foreground"
              >
                <CanvasIcon icon="sliders-horizontal" size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-node-property-panel-menu
              align="end"
              sideOffset={8}
              className="w-56 rounded-xl border-border-subtle bg-surface-raised p-0 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
            >
              {children ?? defaultSections}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

NodePropertyTrigger.displayName = 'NodePropertyTrigger';
