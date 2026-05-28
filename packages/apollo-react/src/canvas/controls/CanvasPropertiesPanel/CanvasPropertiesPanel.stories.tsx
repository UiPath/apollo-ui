import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CanvasPropertiesPanel } from './CanvasPropertiesPanel';
import type {
  CanvasPropertiesPanelBehavior,
  CanvasPropertiesPanelItem,
  CanvasPropertiesPanelLayout,
  CanvasPropertiesPanelPreset,
} from './CanvasPropertiesPanel';

const meta: Meta<typeof CanvasPropertiesPanel> = {
  title: 'Components/Controls/CanvasPropertiesPanel',
  component: CanvasPropertiesPanel,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof CanvasPropertiesPanel>;

const DEFAULT_PANELS: CanvasPropertiesPanelItem[] = [
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

// ─── Default (interactive) ────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const [panels, setPanels] = useState<CanvasPropertiesPanelItem[]>(DEFAULT_PANELS);
    const [behavior, setBehavior] = useState<CanvasPropertiesPanelBehavior>('auto-hide');
    const [layout, setLayout] = useState<CanvasPropertiesPanelLayout | undefined>(undefined);

    return (
      <CanvasBackground>
        <CanvasPropertiesPanel
          label="Properties"
          panels={panels}
          behavior={behavior}
          layout={layout}
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
    const [panels, setPanels] = useState<CanvasPropertiesPanelItem[]>(DEFAULT_PANELS);
    const [behavior, setBehavior] = useState<CanvasPropertiesPanelBehavior>('auto-hide');
    const [layout, setLayout] = useState<CanvasPropertiesPanelLayout | undefined>(undefined);

    return (
      <CanvasBackground>
        <div className="flex gap-24 items-start">
          {/* Default State */}
          <div>
            <StateLabel>Default State</StateLabel>
            <CanvasPropertiesPanel label="Properties" />
          </div>

          {/* Clicked State — static doc snapshot */}
          <div>
            <StateLabel>Clicked State with popover</StateLabel>
            <_PropertiesPanelOpenSnapshot
              panels={panels}
              behavior={behavior}
              layout={layout}
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
    const [panels, setPanels] = useState<CanvasPropertiesPanelItem[]>([
      { label: 'Parameters', enabled: true },
      { label: 'Input', enabled: false },
      { label: 'Output', enabled: true },
    ]);
    const [behavior, setBehavior] = useState<CanvasPropertiesPanelBehavior>('always-persist');
    const [layout, setLayout] = useState<CanvasPropertiesPanelLayout | undefined>('right');
    const [presets, setPresets] = useState<CanvasPropertiesPanelPreset[]>([
      { id: '1', label: 'Compact view' },
      { id: '2', label: 'Debug layout' },
    ]);

    return (
      <CanvasBackground>
        <CanvasPropertiesPanel
          label="Properties"
          panels={panels}
          behavior={behavior}
          layout={layout}
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

// ─── Internal: static open-state snapshot for doc purposes ───────────────────

function _PropertiesPanelOpenSnapshot({
  panels,
  behavior,
  onBehaviorChange,
  onLayoutChange,
  onPanelToggle,
}: {
  panels: CanvasPropertiesPanelItem[];
  behavior: CanvasPropertiesPanelBehavior;
  layout: CanvasPropertiesPanelLayout | undefined;
  onBehaviorChange: (b: CanvasPropertiesPanelBehavior) => void;
  onLayoutChange: (l: CanvasPropertiesPanelLayout) => void;
  onPanelToggle: (label: string, enabled: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      {/* Trigger — in active/open state */}
      <div
        className="w-fit flex flex-row items-center rounded-xl border border-border-subtle bg-surface-raised p-1"
        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
      >
        <button
          type="button"
          className="flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-foreground-muted"
        >
          Properties
        </button>
        <div className="mx-0.5 h-4 w-px shrink-0 bg-border-subtle" />
        <button
          type="button"
          className="grid size-8 place-items-center rounded-lg bg-surface-overlay text-foreground"
        >
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
        </button>
      </div>

      {/* Menu — inline for static snapshot */}
      <div
        className="w-56 overflow-y-auto rounded-xl border border-border-subtle bg-surface-raised"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
      >
        {/* Panel toggles */}
        <div>
          {panels.map(({ label, enabled }) => (
            <button
              key={label}
              type="button"
              onClick={() => onPanelToggle(label, !enabled)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
            >
              <span>{label}</span>
              <span
                className={`size-2 rounded-full ${enabled ? 'bg-foreground-accent' : 'bg-surface-overlay'}`}
              />
            </button>
          ))}
        </div>

        {/* Panel Behavior */}
        <div className="border-t border-border-subtle">
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
              onClick={() => onBehaviorChange(value)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
            >
              <span>{label}</span>
              <span
                className={`size-2 rounded-full ${behavior === value ? 'bg-foreground-accent' : 'bg-surface-overlay'}`}
              />
            </button>
          ))}
        </div>

        {/* Default Layouts */}
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
              onClick={() => onLayoutChange(value)}
              className="flex w-full items-center px-3 py-2 text-xs text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
            >
              {name}
            </button>
          ))}
        </div>

        {/* Saved Presets */}
        <div className="border-t border-border-subtle">
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
            Saved presets
          </p>
          <p className="px-3 pb-2 text-[11px] text-foreground-subtle">No saved presets yet.</p>
        </div>
      </div>
    </div>
  );
}
