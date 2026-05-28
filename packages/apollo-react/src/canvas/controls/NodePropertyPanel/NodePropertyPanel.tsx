import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@uipath/apollo-wind';
import { CanvasIcon } from '../../utils/icon-registry';

export type NodePropertyPanelItem = {
  label: string;
  enabled?: boolean;
};

export type NodePropertyPanelBehavior = 'auto-hide' | 'always-persist';
export type NodePropertyPanelLayout = 'right' | 'bottom' | 'split';
export type NodePropertyPanelPreset = { id: string; label: string };

export type NodePropertyPanelProps = {
  label?: string;
  panels?: NodePropertyPanelItem[];
  behavior?: NodePropertyPanelBehavior;
  layout?: NodePropertyPanelLayout;
  presets?: NodePropertyPanelPreset[];
  /** Called when the "Properties" label text is clicked. */
  onPropertiesClick?: () => void;
  onBehaviorChange?: (behavior: NodePropertyPanelBehavior) => void;
  onLayoutChange?: (layout: NodePropertyPanelLayout) => void;
  onPanelToggle?: (label: string, enabled: boolean) => void;
  onPresetApply?: (preset: NodePropertyPanelPreset) => void;
  onPresetDelete?: (id: string) => void;
  onSavePreset?: () => void;
  /** When true a "Save as preset" button is shown at the bottom of the presets section. */
  canSavePreset?: boolean;
};

type MenuPos = { right: number; top?: number; bottom?: number };

const ITEM_CLASS =
  'flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground';

const ITEM_NO_DOT_CLASS =
  'flex w-full items-center px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground';

const SECTION_HEADING_CLASS =
  'px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle';

export function NodePropertyPanel({
  label = 'Properties',
  panels = [],
  behavior = 'auto-hide',
  presets = [],
  onPropertiesClick,
  onBehaviorChange,
  onLayoutChange,
  onPanelToggle,
  onPresetApply,
  onPresetDelete,
  onSavePreset,
  canSavePreset = false,
}: NodePropertyPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    if (!menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const upward = rect.bottom + 420 > window.innerHeight;
      setMenuPos({
        right: window.innerWidth - rect.right,
        top: upward ? undefined : rect.bottom + 8,
        bottom: upward ? window.innerHeight - rect.top + 8 : undefined,
      });
    }
    setMenuOpen((v) => !v);
  }, [menuOpen]);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        btnRef.current &&
        !btnRef.current.closest('[data-node-property-panel-root]')?.contains(e.target as Node)
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
        className="w-56 overflow-y-auto max-h-[70vh] rounded-xl border border-border-subtle bg-surface-raised"
        style={{
          position: 'fixed',
          right: menuPos.right,
          top: menuPos.top,
          bottom: menuPos.bottom,
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        {panels.length > 0 && (
          <div>
            {panels.map(({ label: panelLabel, enabled }) => (
              <button
                key={panelLabel}
                type="button"
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
          {(
            [
              { value: 'auto-hide', label: 'Auto hide' },
              { value: 'always-persist', label: 'Always persist' },
            ] as { value: NodePropertyPanelBehavior; label: string }[]
          ).map(({ value, label: behaviorLabel }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onBehaviorChange?.(value);
                setMenuOpen(false);
              }}
              className={ITEM_CLASS}
            >
              <span>{behaviorLabel}</span>
              <span
                className={cn(
                  'size-2 rounded-full',
                  behavior === value ? 'bg-foreground-accent' : 'bg-surface-overlay'
                )}
              />
            </button>
          ))}
        </div>

        <div className="border-t border-border-subtle">
          <p className={SECTION_HEADING_CLASS}>Default layouts</p>
          {(
            [
              { value: 'right', name: 'Default — Right' },
              { value: 'bottom', name: 'Default — Bottom' },
              { value: 'split', name: 'Default — Split' },
            ] as { value: NodePropertyPanelLayout; name: string }[]
          ).map(({ value, name }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onLayoutChange?.(value);
                setMenuOpen(false);
              }}
              className={ITEM_NO_DOT_CLASS}
            >
              {name}
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
      data-node-property-panel-root
      className="w-fit flex flex-row items-center rounded-xl border border-border-subtle bg-surface-raised p-1"
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
          ref={btnRef}
          type="button"
          title="Panel options"
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

NodePropertyPanel.displayName = 'NodePropertyPanel';
