import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropdownMenuItem, DropdownMenuRadioGroup } from '@uipath/apollo-wind';
import { useState } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';
import type {
  NodePropertyTriggerBehavior,
  NodePropertyTriggerItem,
  NodePropertyTriggerLayout,
  NodePropertyTriggerPreset,
} from './NodePropertyTrigger';
import {
  NodePropertyTrigger,
  NodePropertyTriggerCheckboxItem,
  NodePropertyTriggerRadioItem,
  NodePropertyTriggerSectionLabel,
  NodePropertyTriggerSeparator,
} from './NodePropertyTrigger';

const meta: Meta<typeof NodePropertyTrigger> = {
  title: 'Components/Panels/Node Property Trigger',
  component: NodePropertyTrigger,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof NodePropertyTrigger>;

const DEFAULT_PANELS: NodePropertyTriggerItem[] = [
  { id: 'button-1', label: 'Button 1', enabled: false },
  { id: 'button-2', label: 'Button 2', enabled: false },
  { id: 'button-3', label: 'Button 3', enabled: false },
];

const GENERIC_BEHAVIOR_OPTIONS = [
  { value: 'auto-hide' as const, label: 'Button 1' },
  { value: 'always-persist' as const, label: 'Button 2' },
];

const GENERIC_LAYOUT_OPTIONS = [
  { value: 'right' as const, label: 'Button 1' },
  { value: 'bottom' as const, label: 'Button 2' },
  { value: 'split' as const, label: 'Button 3' },
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
    const [panels, setPanels] = useState<NodePropertyTriggerItem[]>(DEFAULT_PANELS);
    const [behavior, setBehavior] = useState<NodePropertyTriggerBehavior>('auto-hide');
    const [layout, setLayout] = useState<NodePropertyTriggerLayout | undefined>(undefined);

    return (
      <CanvasBackground>
        <NodePropertyTrigger
          panels={panels}
          behavior={behavior}
          behaviorOptions={GENERIC_BEHAVIOR_OPTIONS}
          layout={layout}
          layoutOptions={GENERIC_LAYOUT_OPTIONS}
          onBehaviorChange={setBehavior}
          onLayoutChange={(l) => setLayout(l)}
          onPanelToggle={(id, enabled) =>
            setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
          }
        />
      </CanvasBackground>
    );
  },
};

// ─── States (doc layout) ─────────────────────────────────────────────────────
// The open state uses the controlled `open` prop — same component, no fakes.

export const States: Story = {
  render: () => {
    const [panels, setPanels] = useState<NodePropertyTriggerItem[]>(DEFAULT_PANELS);
    const [behavior, setBehavior] = useState<NodePropertyTriggerBehavior>('auto-hide');
    const [layout, setLayout] = useState<NodePropertyTriggerLayout | undefined>(undefined);
    const [open, setOpen] = useState(true);

    return (
      <CanvasBackground>
        <div className="flex gap-24 items-start">
          <div>
            <StateLabel>Default State</StateLabel>
            <NodePropertyTrigger
              label="Properties"
              panels={DEFAULT_PANELS}
              behaviorOptions={GENERIC_BEHAVIOR_OPTIONS}
              layoutOptions={GENERIC_LAYOUT_OPTIONS}
            />
          </div>
          <div className="pb-[420px]">
            <StateLabel>Clicked State with popover</StateLabel>
            <NodePropertyTrigger
              label="Properties"
              open={open}
              onOpenChange={setOpen}
              panels={panels}
              behavior={behavior}
              behaviorOptions={GENERIC_BEHAVIOR_OPTIONS}
              layout={layout}
              layoutOptions={GENERIC_LAYOUT_OPTIONS}
              onBehaviorChange={setBehavior}
              onLayoutChange={setLayout}
              onPanelToggle={(id, enabled) =>
                setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
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
    const [panels, setPanels] = useState<NodePropertyTriggerItem[]>([
      { id: 'button-1', label: 'Button 1', enabled: true },
      { id: 'button-2', label: 'Button 2', enabled: false },
      { id: 'button-3', label: 'Button 3', enabled: true },
    ]);
    const [behavior, setBehavior] = useState<NodePropertyTriggerBehavior>('always-persist');
    const [layout, setLayout] = useState<NodePropertyTriggerLayout | undefined>('right');
    const [presets, setPresets] = useState<NodePropertyTriggerPreset[]>([
      { id: '1', label: 'Preset 1' },
      { id: '2', label: 'Preset 2' },
    ]);

    return (
      <CanvasBackground>
        <NodePropertyTrigger
          panels={panels}
          behavior={behavior}
          behaviorOptions={GENERIC_BEHAVIOR_OPTIONS}
          layout={layout}
          layoutOptions={GENERIC_LAYOUT_OPTIONS}
          presets={presets}
          canSavePreset
          onBehaviorChange={setBehavior}
          onLayoutChange={(l) => setLayout(l)}
          onPanelToggle={(id, enabled) =>
            setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
          }
          onPresetDelete={(id) => setPresets((prev) => prev.filter((p) => p.id !== id))}
          onSavePreset={() =>
            setPresets((prev) => [
              ...prev,
              { id: String(prev.length + 1), label: `Preset ${prev.length + 1}` },
            ])
          }
        />
      </CanvasBackground>
    );
  },
};

// ─── Custom Options ───────────────────────────────────────────────────────────
// Demonstrates how swapping behaviorOptions / layoutOptions / panels affects
// the popover contents — useful for verifying extensibility.

export const CustomOptions: Story = {
  render: () => {
    const [panels, setPanels] = useState<NodePropertyTriggerItem[]>([
      { id: 'manifest', label: 'Manifest', enabled: true },
      { id: 'variables', label: 'Variables', enabled: false },
      { id: 'log', label: 'Log', enabled: false },
    ]);

    return (
      <CanvasBackground>
        <div className="flex flex-col gap-8 items-start">
          <div>
            <StateLabel>Custom behavior labels (3 options)</StateLabel>
            <NodePropertyTrigger
              behaviorOptions={[
                { value: 'auto-hide', label: 'Auto hide' },
                { value: 'always-persist', label: 'Always visible' },
                { value: 'minimized', label: 'Minimized' },
              ]}
              layoutOptions={[
                { value: 'right', label: 'Right panel' },
                { value: 'bottom', label: 'Bottom panel' },
              ]}
            />
          </div>

          <div>
            <StateLabel>Custom panels list — toggle enabled state</StateLabel>
            <NodePropertyTrigger
              panels={panels}
              onPanelToggle={(id, enabled) =>
                setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
              }
            />
          </div>

          <div>
            <StateLabel>No layout options (behavior only)</StateLabel>
            <NodePropertyTrigger layoutOptions={[]} />
          </div>
        </div>
      </CanvasBackground>
    );
  },
};

// ─── Label-only pill (showMenu={false}) ──────────────────────────────────────
// Secondary trigger variant — e.g. a second pill next to the main trigger —
// that only fires onPropertiesClick. No divider, sliders, or popover.

export const LabelOnlyPill: Story = {
  render: () => (
    <CanvasBackground>
      <div className="flex items-center gap-2">
        <NodePropertyTrigger
          label="Button 1"
          panels={DEFAULT_PANELS}
          behaviorOptions={GENERIC_BEHAVIOR_OPTIONS}
          layoutOptions={GENERIC_LAYOUT_OPTIONS}
        />
        <NodePropertyTrigger label="Button 2" showMenu={false} onPropertiesClick={() => {}} />
      </div>
    </CanvasBackground>
  ),
};

// ─── Composed (children API) ──────────────────────────────────────────────────
// Full consumer control: children replace the built-in sections entirely.
// Compose with the exported NodePropertyTrigger* items and any apollo-wind
// DropdownMenu primitive — order, headings, and text are all consumer-owned
// (this is also the i18n path).

export const Composed: Story = {
  render: () => {
    const [toggles, setToggles] = useState({ one: true, two: false });
    const [density, setDensity] = useState('comfortable');

    return (
      <CanvasBackground>
        <NodePropertyTrigger label="Properties">
          <NodePropertyTriggerCheckboxItem
            checked={toggles.one}
            onCheckedChange={(checked) => setToggles((t) => ({ ...t, one: checked === true }))}
          >
            Button 1
          </NodePropertyTriggerCheckboxItem>
          <NodePropertyTriggerCheckboxItem
            checked={toggles.two}
            onCheckedChange={(checked) => setToggles((t) => ({ ...t, two: checked === true }))}
          >
            Button 2
          </NodePropertyTriggerCheckboxItem>
          <NodePropertyTriggerSeparator />
          <NodePropertyTriggerSectionLabel>Custom section</NodePropertyTriggerSectionLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
            <NodePropertyTriggerRadioItem value="comfortable">
              Button 1
            </NodePropertyTriggerRadioItem>
            <NodePropertyTriggerRadioItem value="compact">Button 2</NodePropertyTriggerRadioItem>
          </DropdownMenuRadioGroup>
          <NodePropertyTriggerSeparator />
          <DropdownMenuItem className="gap-2 px-3 py-2 text-xs text-foreground-muted">
            <CanvasIcon icon="rotate-ccw" size={12} />
            <span>Custom action</span>
          </DropdownMenuItem>
        </NodePropertyTrigger>
      </CanvasBackground>
    );
  },
};
