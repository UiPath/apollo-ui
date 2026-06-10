import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@uipath/apollo-wind';
import { CanvasIcon } from '../../utils/icon-registry';

export type NodePropertyTriggerItem = {
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

const DEFAULT_BEHAVIOR_OPTIONS: NodePropertyTriggerBehaviorOption[] = [
  { value: 'auto-hide', label: 'Auto hide' },
  { value: 'always-persist', label: 'Always persist' },
];

const DEFAULT_LAYOUT_OPTIONS: NodePropertyTriggerLayoutOption[] = [
  { value: 'right', label: 'Default — Right' },
  { value: 'bottom', label: 'Default — Bottom' },
  { value: 'split', label: 'Default — Split' },
];

export type NodePropertyTriggerProps = {
  /** Text shown on the label button. Defaults to 'Properties'. */
  label?: string;
  /** Panels to display as toggleable items in the popover. */
  panels?: NodePropertyTriggerItem[];
  /** Currently active panel behaviour — reflected as a selection indicator in the popover. */
  behavior?: NodePropertyTriggerBehavior;
  /** Behaviour options shown in the popover. Defaults to Auto hide / Always persist. */
  behaviorOptions?: NodePropertyTriggerBehaviorOption[];
  /** Currently active layout — reflected as a selection indicator in the popover. */
  layout?: NodePropertyTriggerLayout;
  /** Layout options shown in the popover. Defaults to Right / Bottom / Split. */
  layoutOptions?: NodePropertyTriggerLayoutOption[];
  /** Saved presets to show in the popover. */
  presets?: NodePropertyTriggerPreset[];
  /** Additional class names applied to the trigger root element. */
  className?: string;
  /** Called when the label button is clicked. */
  onPropertiesClick?: () => void;
  onBehaviorChange?: (behavior: NodePropertyTriggerBehavior) => void;
  onLayoutChange?: (layout: NodePropertyTriggerLayout) => void;
  onPanelToggle?: (label: string, enabled: boolean) => void;
  onPresetApply?: (preset: NodePropertyTriggerPreset) => void;
  onPresetDelete?: (id: string) => void;
  onSavePreset?: () => void;
  /** When true a "Save as preset" button is shown at the bottom of the presets section. */
  canSavePreset?: boolean;
};

type MenuPos = { right: number; top?: number; bottom?: number };

/** Estimated max height of the popover menu — used to decide whether to open upward. */
const MENU_ESTIMATED_HEIGHT = 420;
/** Gap between the trigger pill and the popover. */
const MENU_GAP = 8;
/** z-index for the portalled menu — sits above canvas panels and toolbars. */
const MENU_Z_INDEX = 9999;

const ITEM_CLASS =
  'flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground';

const SECTION_HEADING_CLASS =
  'px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle';

export function NodePropertyTrigger({
  label = 'Properties',
  panels = [],
  behavior,
  behaviorOptions = DEFAULT_BEHAVIOR_OPTIONS,
  layout,
  layoutOptions = DEFAULT_LAYOUT_OPTIONS,
  presets = [],
  className,
  onPropertiesClick,
  onBehaviorChange,
  onLayoutChange,
  onPanelToggle,
  onPresetApply,
  onPresetDelete,
  onSavePreset,
  canSavePreset = false,
}: NodePropertyTriggerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Uncontrolled fallback — when behavior/layout are not driven by the consumer,
  // the component manages them internally so it works correctly out of the box.
  const [internalBehavior, setInternalBehavior] =
    useState<NodePropertyTriggerBehavior>('auto-hide');
  const [internalLayout, setInternalLayout] = useState<NodePropertyTriggerLayout | undefined>(
    undefined
  );
  const effectiveBehavior = behavior ?? internalBehavior;
  const effectiveLayout = layout ?? internalLayout;

  const handleBehaviorChange = useCallback(
    (val: NodePropertyTriggerBehavior) => {
      if (onBehaviorChange) {
        onBehaviorChange(val);
      } else {
        setInternalBehavior(val);
      }
    },
    [onBehaviorChange]
  );

  const handleLayoutChange = useCallback(
    (val: NodePropertyTriggerLayout) => {
      if (onLayoutChange) {
        onLayoutChange(val);
      } else {
        setInternalLayout(val);
      }
    },
    [onLayoutChange]
  );

  const handleToggle = useCallback(() => {
    if (!menuOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const upward = rect.bottom + MENU_ESTIMATED_HEIGHT > window.innerHeight;
      setMenuPos({
        right: window.innerWidth - rect.right,
        top: upward ? undefined : rect.bottom + MENU_GAP,
        bottom: upward ? window.innerHeight - rect.top + MENU_GAP : undefined,
      });
    }
    setMenuOpen((v) => !v);
  }, [menuOpen]);

  // Close on scroll or viewport resize so the fixed-position menu doesn't detach from its trigger
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('scroll', close, { capture: true, passive: true });
    window.addEventListener('resize', close, { passive: true });
    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('resize', close);
    };
  }, [menuOpen]);

  // Close on outside click — exclude both the trigger container and the portalled menu
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (
        target &&
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target.closest('[data-node-property-panel-menu]')
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [menuOpen]);

  const menuPortal =
    menuOpen &&
    menuPos &&
    createPortal(
      <div
        data-node-property-panel-menu
        role="menu"
        aria-label="Panel options"
        className="w-56 overflow-y-auto max-h-[70vh] rounded-xl border border-border-subtle bg-surface-raised"
        style={{
          position: 'fixed',
          right: menuPos.right,
          top: menuPos.top,
          bottom: menuPos.bottom,
          zIndex: MENU_Z_INDEX,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        {panels.length > 0 && (
          <div>
            {panels.map(({ label: panelLabel, enabled }) => (
              <button
                key={panelLabel}
                type="button"
                role="menuitemcheckbox"
                aria-checked={!!enabled}
                onClick={() => {
                  onPanelToggle?.(panelLabel, !enabled);
                  setMenuOpen(false);
                }}
                className={ITEM_CLASS}
              >
                <span>{panelLabel}</span>
                <span
                  className={cn(
                    'size-2 rounded-full',
                    enabled ? 'bg-foreground-accent' : 'bg-surface-overlay'
                  )}
                />
              </button>
            ))}
          </div>
        )}

        <div className={cn(panels.length > 0 && 'border-t border-border-subtle')}>
          <p className={SECTION_HEADING_CLASS}>Panel behavior</p>
          {behaviorOptions.map(({ value, label: behaviorLabel }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={effectiveBehavior === value}
              onClick={() => {
                handleBehaviorChange(value);
                setMenuOpen(false);
              }}
              className={ITEM_CLASS}
            >
              <span>{behaviorLabel}</span>
              <span
                className={cn(
                  'size-2 rounded-full',
                  effectiveBehavior === value ? 'bg-foreground-accent' : 'bg-surface-overlay'
                )}
              />
            </button>
          ))}
        </div>

        <div className="border-t border-border-subtle">
          <p className={SECTION_HEADING_CLASS}>Default layouts</p>
          {layoutOptions.map(({ value, label: layoutLabel }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={effectiveLayout === value}
              onClick={() => {
                handleLayoutChange(value);
                setMenuOpen(false);
              }}
              className={ITEM_CLASS}
            >
              <span>{layoutLabel}</span>
              <span
                className={cn(
                  'size-2 rounded-full',
                  effectiveLayout === value ? 'bg-foreground-accent' : 'bg-surface-overlay'
                )}
              />
            </button>
          ))}
        </div>

        <div className="border-t border-border-subtle">
          <p className={SECTION_HEADING_CLASS}>Saved presets</p>
          {presets.length === 0 && (
            <p className="px-3 pb-2 text-[11px] text-foreground-subtle">No saved presets yet.</p>
          )}
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-1 px-2 py-1">
              <button
                type="button"
                onClick={() => {
                  onPresetApply?.(preset);
                  setMenuOpen(false);
                }}
                className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
              >
                {preset.label}
              </button>
              <button
                type="button"
                title="Delete preset"
                aria-label="Delete preset"
                onClick={() => onPresetDelete?.(preset.id)}
                className="grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
              >
                <CanvasIcon icon="trash-2" size={11} />
              </button>
            </div>
          ))}
          {canSavePreset && (
            <button
              type="button"
              onClick={() => {
                onSavePreset?.();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
            >
              <CanvasIcon icon="plus" size={12} />
              <span>Save as preset</span>
            </button>
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div
      ref={containerRef}
      data-node-property-panel-root
      className={cn(
        'w-fit flex flex-row items-center rounded-xl border border-border-subtle bg-surface-raised p-1',
        className
      )}
      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
    >
      <button
        type="button"
        onClick={onPropertiesClick}
        className="flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
      >
        {label}
      </button>

      <div className="mx-0.5 h-4 w-px shrink-0 bg-border-subtle" />

      <div className="relative">
        <button
          type="button"
          title="Panel options"
          aria-label="Panel options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={handleToggle}
          className={cn(
            'grid size-8 place-items-center rounded-lg transition',
            menuOpen
              ? 'bg-surface-overlay text-foreground'
              : 'text-foreground-muted hover:bg-surface-overlay hover:text-foreground'
          )}
        >
          <CanvasIcon icon="sliders-horizontal" size={14} />
        </button>
        {menuPortal}
      </div>
    </div>
  );
}

NodePropertyTrigger.displayName = 'NodePropertyTrigger';
