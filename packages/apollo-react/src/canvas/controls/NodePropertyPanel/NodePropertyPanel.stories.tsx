import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { cn } from '@uipath/apollo-wind';
import { CanvasIcon } from '../../utils/icon-registry';
import { NodePropertyPanel } from './NodePropertyPanel';
import type {
  NodePropertyPanelBehavior,
  NodePropertyPanelItem,
  NodePropertyPanelLayout,
  NodePropertyPanelPreset,
} from './NodePropertyPanel';

const meta: Meta<typeof NodePropertyPanel> = {
  title: 'Components/Panels/Node Property Panel',
  component: NodePropertyPanel,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof NodePropertyPanel>;

const DEFAULT_PANELS: NodePropertyPanelItem[] = [
  { label: 'Parameters', enabled: false },
  { label: 'Input', enabled: false },
  { label: 'Output', enabled: false },
];

const CanvasBackground = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen flex items-center justify-center p-10"
    style={{ backgroundColor: 'var(--surface, var(--color-background))' }}
  >
    {children}
  </div>
);

const StateLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-3 block text-sm text-foreground-subtle">{children}</span>
);

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const [panels, setPanels] = useState<NodePropertyPanelItem[]>(DEFAULT_PANELS);
    const [behavior, setBehavior] = useState<NodePropertyPanelBehavior>('auto-hide');
    const [layout, setLayout] = useState<NodePropertyPanelLayout | undefined>(undefined);

    return (
      <CanvasBackground>
        <_Panel
          panels={panels}
          behavior={behavior}
          onBehaviorChange={setBehavior}
          onLayoutChange={setLayout}
          onPanelToggle={(lbl, enabled) =>
            setPanels((prev) => prev.map((p) => (p.label === lbl ? { ...p, enabled } : p)))
          }
        />
      </CanvasBackground>
    );
  },
};

// ─── States (doc layout) ─────────────────────────────────────────────────────

export const States: Story = {
  render: () => {
    const [panels, setPanels] = useState<NodePropertyPanelItem[]>(DEFAULT_PANELS);
    const [behavior, setBehavior] = useState<NodePropertyPanelBehavior>('auto-hide');
    const [layout, setLayout] = useState<NodePropertyPanelLayout | undefined>(undefined);

    return (
      <CanvasBackground>
        <div className="flex gap-24 items-start">
          <div>
            <StateLabel>Default State</StateLabel>
            <NodePropertyPanel label="Properties" />
          </div>
          <div>
            <StateLabel>Clicked State with popover</StateLabel>
            <_Panel
              initialOpen
              panels={panels}
              behavior={behavior}
              onBehaviorChange={setBehavior}
              onLayoutChange={setLayout}
              onPanelToggle={(lbl, enabled) =>
                setPanels((prev) => prev.map((p) => (p.label === lbl ? { ...p, enabled } : p)))
              }
            />
          </div>
        </div>
      </CanvasBackground>
    );
  },
};

// ─── With Presets ─────────────────────────────────────────────────────────────

export const WithPresets: Story = {
  render: () => {
    const [panels, setPanels] = useState<NodePropertyPanelItem[]>([
      { label: 'Parameters', enabled: true },
      { label: 'Input', enabled: false },
      { label: 'Output', enabled: true },
    ]);
    const [behavior, setBehavior] = useState<NodePropertyPanelBehavior>('always-persist');
    const [layout, setLayout] = useState<NodePropertyPanelLayout | undefined>('right');
    const [presets, setPresets] = useState<NodePropertyPanelPreset[]>([
      { id: '1', label: 'Compact view' },
      { id: '2', label: 'Debug layout' },
    ]);

    return (
      <CanvasBackground>
        <_Panel
          panels={panels}
          behavior={behavior}
          presets={presets}
          canSavePreset
          onBehaviorChange={setBehavior}
          onLayoutChange={setLayout}
          onPanelToggle={(lbl, enabled) =>
            setPanels((prev) => prev.map((p) => (p.label === lbl ? { ...p, enabled } : p)))
          }
          onPresetDelete={(id) => setPresets((prev) => prev.filter((p) => p.id !== id))}
          onSavePreset={() => alert('Save preset modal would open here')}
        />
      </CanvasBackground>
    );
  },
};

// ─── Shared interactive panel (pill + inline popover, toggleable) ─────────────

const SLIDERS_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" y1="4" x2="14" y2="4" />
    <line x1="10" y1="4" x2="3" y2="4" />
    <line x1="21" y1="12" x2="12" y2="12" />
    <line x1="8" y1="12" x2="3" y2="12" />
    <line x1="21" y1="20" x2="16" y2="20" />
    <line x1="12" y1="20" x2="3" y2="20" />
    <line x1="14" y1="2" x2="14" y2="6" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="16" y1="18" x2="16" y2="22" />
  </svg>
);

function _Panel({
  initialOpen = false,
  panels = [],
  behavior,
  presets = [],
  canSavePreset = false,
  onBehaviorChange,
  onLayoutChange,
  onPanelToggle,
  onPresetDelete,
  onSavePreset,
}: {
  initialOpen?: boolean;
  panels?: NodePropertyPanelItem[];
  behavior: NodePropertyPanelBehavior;
  presets?: NodePropertyPanelPreset[];
  canSavePreset?: boolean;
  onBehaviorChange: (b: NodePropertyPanelBehavior) => void;
  onLayoutChange: (l: NodePropertyPanelLayout) => void;
  onPanelToggle: (label: string, enabled: boolean) => void;
  onPresetDelete?: (id: string) => void;
  onSavePreset?: () => void;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Pill */}
      <div
        className="w-fit flex flex-row items-center rounded-xl border border-border-subtle bg-surface-raised p-1"
        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
      >
        <button
          type="button"
          className="flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
        >
          Properties
        </button>
        <div className="mx-0.5 h-4 w-px shrink-0 bg-border-subtle" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'grid size-8 place-items-center rounded-lg transition',
            open
              ? 'bg-surface-overlay text-foreground'
              : 'text-foreground-muted hover:bg-surface-overlay hover:text-foreground'
          )}
        >
          {SLIDERS_ICON}
        </button>
      </div>

      {/* Popover — inline, right-aligned, 8px below pill via gap-2 */}
      {open && (
        <div
          className="w-56 overflow-y-auto rounded-xl border border-border-subtle bg-surface-raised"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
        >
          {panels.length > 0 && (
            <div>
              {panels.map(({ label, enabled }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onPanelToggle(label, !enabled);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
                >
                  <span>{label}</span>
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
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
              Panel behavior
            </p>
            {[
              { value: 'auto-hide' as const, label: 'Auto hide' },
              { value: 'always-persist' as const, label: 'Always persist' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onBehaviorChange(value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
              >
                <span>{label}</span>
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
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
              Default layouts
            </p>
            {[
              { value: 'right' as const, name: 'Default — Right' },
              { value: 'bottom' as const, name: 'Default — Bottom' },
              { value: 'split' as const, name: 'Default — Split' },
            ].map(({ value, name }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onLayoutChange(value);
                  setOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
              >
                {name}
              </button>
            ))}
          </div>

          <div className="border-t border-border-subtle">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
              Saved presets
            </p>
            {presets.length === 0 && (
              <p className="px-3 pb-2 text-[11px] text-foreground-subtle">No saved presets yet.</p>
            )}
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-1 px-2 py-1">
                <span className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-xs text-foreground-muted">
                  {preset.label}
                </span>
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
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
              >
                <CanvasIcon icon="plus" size={12} />
                <span>Save as preset</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
