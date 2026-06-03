import type { Meta, StoryObj } from '@storybook/react-vite';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { BackgroundVariant, Panel, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@uipath/apollo-wind';
import { useMemo, useRef, useState } from 'react';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { BaseCanvas } from './BaseCanvas';
import type { BaseCanvasRef } from './BaseCanvas.types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof BaseCanvas> = {
  title: 'Components/Canvas/BaseCanvas',
  decorators: [withCanvasProviders()],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    mode: { control: { type: 'select' }, options: ['design', 'view', 'readonly'] },
    defaultEdgeOptions: { control: { type: 'object' } },
    backgroundColor: { control: { type: 'color' } },
    backgroundVariant: { control: { type: 'select' }, options: ['dots', 'lines', 'cross'] },
    backgroundGap: { control: { type: 'number' } },
    backgroundSize: { control: { type: 'number' } },
    minZoom: { control: { type: 'number', min: 0.1, max: 1, step: 0.1 } },
    maxZoom: { control: { type: 'number', min: 1, max: 10, step: 0.5 } },
    onNodesChange: { control: false },
    onEdgesChange: { control: false },
    onConnect: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared Data
// ============================================================================

function createPipelineNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'source',
      type: 'uipath.blank-node',
      position: { x: 50, y: 200 },
      display: { label: 'Data Source', subLabel: 'Input Stream', icon: 'cloud-upload' },
    }),
    createNode({
      id: 'processor1',
      type: 'uipath.blank-node',
      position: { x: 300, y: 100 },
      display: { label: 'Transform', subLabel: 'Data Processing', icon: 'settings' },
    }),
    createNode({
      id: 'processor2',
      type: 'uipath.blank-node',
      position: { x: 300, y: 300 },
      display: { label: 'Filter', subLabel: 'Validation Rules', icon: 'list-filter' },
    }),
    createNode({
      id: 'merger',
      type: 'uipath.blank-node',
      position: { x: 550, y: 200 },
      display: { label: 'Merge', subLabel: 'Combine Streams', icon: 'git-merge' },
    }),
    createNode({
      id: 'output',
      type: 'uipath.blank-node',
      position: { x: 800, y: 200 },
      display: { label: 'Storage', subLabel: 'Database', icon: 'database' },
    }),
    createNode({
      id: 'monitor',
      type: 'uipath.blank-node',
      position: { x: 1050, y: 200 },
      display: { label: 'Monitor', subLabel: 'Analytics', icon: 'chart-bar-big' },
    }),
  ];
}

const pipelineEdges: Edge[] = [
  {
    id: 'e-source-p1',
    source: 'source',
    sourceHandle: 'output',
    target: 'processor1',
    targetHandle: 'input',
  },
  {
    id: 'e-source-p2',
    source: 'source',
    sourceHandle: 'output',
    target: 'processor2',
    targetHandle: 'input',
  },
  {
    id: 'e-p1-merger',
    source: 'processor1',
    sourceHandle: 'output',
    target: 'merger',
    targetHandle: 'input',
  },
  {
    id: 'e-p2-merger',
    source: 'processor2',
    sourceHandle: 'output',
    target: 'merger',
    targetHandle: 'input',
  },
  {
    id: 'e-merger-output',
    source: 'merger',
    sourceHandle: 'output',
    target: 'output',
    targetHandle: 'input',
  },
  {
    id: 'e-output-monitor',
    source: 'output',
    sourceHandle: 'output',
    target: 'monitor',
    targetHandle: 'input',
  },
];

// ============================================================================
// Shared UI: CanvasPreviewButton
// ============================================================================

function CanvasPreviewButton({
  expanded,
  onExpand,
  onClose,
}: {
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
}) {
  return expanded ? (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 4.5l-6 6M10.5 1.5l-6 6M1.5 1.5l4 4M10.5 10.5l-4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Close
    </button>
  ) : (
    <button
      type="button"
      onClick={onExpand}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 4.5V1.5H7.5M1.5 7.5v3h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Expand
    </button>
  );
}

// ============================================================================
// Modes Page
// ============================================================================

const modeCards = [
  {
    mode: 'design' as const,
    value: "'design'",
    label: 'Design',
    description:
      'Full editing surface. Nodes can be moved, edges drawn, and elements added or deleted. Handle add-buttons and node toolbars are visible on hover.',
    capabilities: [
      'Move and drag nodes',
      'Draw edges between handles',
      'Add and delete elements',
      'Pan and zoom',
      'Select and multi-select',
    ],
    whenToUse: 'Flow authoring — Studio, Maestro canvas editors',
  },
  {
    mode: 'view' as const,
    value: "'view'",
    label: 'View',
    description:
      'Navigation only. Users can pan, zoom, select, and click nodes to trigger callbacks, but cannot modify the graph structure.',
    capabilities: [
      'Pan and zoom',
      'Click nodes (fires callbacks)',
      'Select and multi-select',
      'No structural edits',
    ],
    whenToUse: 'Read-only exploration, monitoring dashboards, embedded previews with click actions',
  },
  {
    mode: 'readonly' as const,
    value: "'readonly'",
    label: 'Readonly',
    description:
      'Completely frozen. No user interactions are processed. Use for static embeds, print layouts, or permission-gated disabled states.',
    capabilities: ['No interactions'],
    whenToUse: 'Thumbnails, print/export layouts, permission-gated disabled states',
  },
] as const;

const modeRows = [
  {
    mode: 'design',
    isDefault: false,
    interactions: 'Move nodes, draw edges, add/delete, pan, zoom, select',
    whenToUse: 'Flow authoring and editing',
  },
  {
    mode: 'view',
    isDefault: true,
    interactions: 'Pan, zoom, click, select — no structural edits',
    whenToUse: 'Read-only exploration and monitoring',
  },
  {
    mode: 'readonly',
    isDefault: false,
    interactions: 'None',
    whenToUse: 'Static embeds, thumbnails, disabled states',
  },
];

function ModesCanvas({ mode }: { mode: 'design' | 'view' | 'readonly' }) {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: pipelineEdges });
  return (
    <BaseCanvas {...canvasProps} mode={mode}>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function ModesPage({ globalTheme }: { globalTheme: string }) {
  const [activeMode, setActiveMode] = useState<'design' | 'view' | 'readonly'>('design');
  const [expanded, setExpanded] = useState(false);

  const activeModeCard = modeCards.find((c) => c.mode === activeMode)!;

  return (
    <div className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}>
      {/* ── Header ── */}
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Modes</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          BaseCanvas exposes a{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">mode</code> prop
          that controls the full interaction surface — what users can do, which UI affordances
          appear, and whether the graph can be modified. Every interaction is gated by the current
          mode. The default is{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">'view'</code>.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      {/* ── Preview ── */}
      <div className="pb-8">
        <div className="mx-auto mb-4 max-w-4xl px-8">
          <h2 className="mb-1 text-xl font-bold tracking-tight text-foreground">Preview</h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Switch between modes to see how interactions change on the same canvas.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {modeCards.map((card) => (
              <button
                key={card.mode}
                type="button"
                onClick={() => setActiveMode(card.mode)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                  activeMode === card.mode
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {card.label}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">{activeModeCard.description}</span>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[560px] w-[90vw] overflow-hidden rounded-xl border border-border">
            {!expanded && (
              <>
                <ModesCanvas mode={activeMode} />
                <CanvasPreviewButton
                  expanded={false}
                  onExpand={() => setExpanded(true)}
                  onClose={() => setExpanded(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-border"
            style={{ width: '90vw', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModesCanvas mode={activeMode} />
            <CanvasPreviewButton
              expanded={true}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      )}

      {/* ── Anatomy ── */}
      <div className="mx-auto max-w-4xl px-8 pb-8">
        <div className="mb-8 h-px bg-border" />
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Anatomy</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Each mode enables a distinct set of interactions. Choose the mode that reflects the user's
          permission level and intent for the canvas.
        </p>

        <div className="mb-8 grid grid-cols-3 gap-4">
          {modeCards.map((card) => (
            <div
              key={card.mode}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground">{card.label}</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
                    {card.value}
                  </code>
                </div>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  What users can do
                </p>
                <ul className="space-y-1">
                  {card.capabilities.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <span className="mt-0.5 text-[10px]">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">When to use: </span>
                {card.whenToUse}
              </p>
            </div>
          ))}
        </div>

        {/* Spec table */}
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  <code className="text-xs">mode</code>
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Default</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Enabled interactions
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  When to use
                </th>
              </tr>
            </thead>
            <tbody>
              {modeRows.map((row) => (
                <tr key={row.mode} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <code className="text-xs text-primary">'{row.mode}'</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.isDefault ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        default
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.interactions}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.whenToUse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="my-10 h-px bg-border" />

        {/* ── How to use ── */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">How to use</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Pass <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">mode</code>{' '}
          directly to{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">BaseCanvas</code>.
          It can be driven from state to react to permission changes at runtime.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
          {`// Static mode
<BaseCanvas mode="view" nodes={nodes} edges={edges} />

// Dynamic — driven by permissions or application state
const [mode, setMode] = useState<'design' | 'view' | 'readonly'>('view');

<BaseCanvas
  mode={canEdit ? 'design' : 'view'}
  nodes={nodes}
  edges={edges}
/>`}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// Behavior Page
// ============================================================================

const zoomRows = [
  { input: 'Ctrl / Cmd + scroll', result: 'Zoom in or out', notes: 'All platforms' },
  { input: 'Trackpad pinch', result: 'Zoom in or out', notes: 'All platforms' },
  { input: 'Double-click canvas', result: 'Zoom in one step', notes: 'design and view only' },
  {
    input: '+ / − controls',
    result: 'Zoom in or out by step',
    notes: 'Via CanvasPositionControls',
  },
  {
    input: 'Fit-to-view button',
    result: 'Zoom to fit all nodes',
    notes: 'Via CanvasPositionControls',
  },
  { input: 'minZoom / maxZoom props', result: 'Clamp the zoom range', notes: 'Defaults: 0.1 – 4' },
];

const panRows = [
  { input: 'Scroll wheel', result: 'Pan vertically', notes: 'Horizontal scroll pans horizontally' },
  {
    input: 'Two-finger trackpad drag',
    result: 'Pan in any direction',
    notes: 'macOS and Windows',
  },
  { input: 'Middle mouse button drag', result: 'Pan in any direction', notes: 'All platforms' },
  {
    input: 'Space + left mouse drag',
    result: 'Pan in any direction',
    notes: 'Shown via teaching UI on first use',
  },
];

const keyboardRows = [
  {
    shortcut: 'Backspace / Delete',
    action: 'Delete selected elements',
    modes: 'design',
  },
  { shortcut: 'Ctrl / Cmd + A', action: 'Select all nodes and edges', modes: 'design, view' },
  { shortcut: 'Escape', action: 'Deselect all', modes: 'design, view' },
  { shortcut: 'Space + drag', action: 'Pan canvas', modes: 'design, view' },
];

const backgroundVariantRows = [
  {
    variant: BackgroundVariant.Dots,
    label: 'Dots',
    defaultGap: 20,
    defaultSize: 1,
    description: 'Small dots on a grid. Subtle and unobtrusive at all zoom levels.',
  },
  {
    variant: BackgroundVariant.Lines,
    label: 'Lines',
    defaultGap: 20,
    defaultSize: 1,
    description: 'Grid lines. Provides a clear spatial reference for node alignment.',
  },
  {
    variant: BackgroundVariant.Cross,
    label: 'Cross',
    defaultGap: 20,
    defaultSize: 4,
    description: 'Plus marks at intersections. A midpoint between dots and full grid lines.',
  },
];

function BehaviorCanvas({ backgroundVariant }: { backgroundVariant?: BackgroundVariant }) {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: pipelineEdges });
  return (
    <BaseCanvas {...canvasProps} mode="view" backgroundVariant={backgroundVariant}>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function BehaviorPage({ globalTheme }: { globalTheme: string }) {
  const [expanded, setExpanded] = useState(false);
  const [activeVariant, setActiveVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);

  return (
    <div className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}>
      {/* ── Header ── */}
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Behavior</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          BaseCanvas responds to standard spatial navigation gestures across mouse, trackpad, and
          keyboard. All navigation behaviors are gated by the current{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">mode</code> — zoom
          and pan are disabled in{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">'readonly'</code>{' '}
          mode. The canvas normalises pointer input types so behaviors are consistent across
          platforms.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      {/* ── Preview ── */}
      <div className="pb-8">
        <div className="mx-auto mb-4 max-w-4xl px-8">
          <h2 className="mb-1 text-xl font-bold tracking-tight text-foreground">Preview</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The canvas below is in{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">'view'</code> mode.
            Try scrolling to pan, Ctrl+scroll or pinch to zoom, or Space+drag to pan freely.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[560px] w-[90vw] overflow-hidden rounded-xl border border-border">
            {!expanded && (
              <>
                <BehaviorCanvas />
                <CanvasPreviewButton
                  expanded={false}
                  onExpand={() => setExpanded(true)}
                  onClose={() => setExpanded(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-border"
            style={{ width: '90vw', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <BehaviorCanvas />
            <CanvasPreviewButton
              expanded={true}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-8 pb-8">
        {/* ── Navigation ── */}
        <div className="mb-8 h-px bg-border" />
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Navigation</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Zoom and pan work across all pointer input types. Scroll zooms via modifier key and pans
          natively — no configuration required.
        </p>

        <h3 className="mb-3 text-sm font-semibold text-foreground">Zoom</h3>
        <div className="mb-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Input</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Result</th>
              </tr>
            </thead>
            <tbody>
              {zoomRows.map((row) => (
                <tr key={row.input} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <code className="text-xs text-primary">{row.input}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.result}
                    {row.notes && (
                      <span className="ml-1 text-muted-foreground/60">— {row.notes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-3 text-sm font-semibold text-foreground">Pan</h3>
        <div className="mb-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Input</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Result</th>
              </tr>
            </thead>
            <tbody>
              {panRows.map((row) => (
                <tr key={row.input} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <code className="text-xs text-primary">{row.input}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.result}
                    {row.notes && (
                      <span className="ml-1 text-muted-foreground/60">— {row.notes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Keyboard shortcuts */}
        <h3 className="mb-3 text-sm font-semibold text-foreground">Keyboard shortcuts</h3>
        <div className="mb-8 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Shortcut
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Available in
                </th>
              </tr>
            </thead>
            <tbody>
              {keyboardRows.map((row) => (
                <tr key={row.shortcut} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <code className="text-xs text-primary">{row.shortcut}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.action}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-muted-foreground">{row.modes}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Position Controls ── */}
        <div className="mb-8 h-px bg-border" />
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Position Controls
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            CanvasPositionControls
          </code>{' '}
          is the standard UI affordance for viewport control. It renders zoom in, zoom out, and
          fit-to-view buttons and should be placed inside a ReactFlow{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">{'<Panel>'}</code>.
          Supports horizontal (default) and vertical orientations.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-semibold text-foreground">Horizontal</span>
            <p className="text-sm text-muted-foreground">
              Default. Suitable for bottom-right placement in full-screen canvases.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-semibold text-foreground">Vertical</span>
            <p className="text-sm text-muted-foreground">
              Use{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                orientation="vertical"
              </code>{' '}
              when horizontal space is constrained or the canvas sits beside a side panel.
            </p>
          </div>
        </div>

        <pre className="mb-8 overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
          {`import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { CanvasPositionControls } from '@uipath/apollo-react/canvas';
import { DefaultCanvasTranslations } from '@uipath/apollo-react/canvas/types';

<BaseCanvas mode="view" nodes={nodes} edges={edges}>
  <Panel position="bottom-right">
    <CanvasPositionControls
      translations={DefaultCanvasTranslations}
      orientation="horizontal" // or "vertical"
    />
  </Panel>
</BaseCanvas>`}
        </pre>

        {/* ── Background ── */}
        <div className="mb-8 h-px bg-border" />
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Background</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          BaseCanvas renders a background pattern by default (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            showBackground
          </code>{' '}
          defaults to{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">true</code>). Three
          variants are available via{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            backgroundVariant
          </code>
          . Density is controlled by{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">backgroundGap</code>{' '}
          and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            backgroundSize
          </code>
          .
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {backgroundVariantRows.map((v) => (
            <button
              key={v.variant}
              type="button"
              onClick={() => setActiveVariant(v.variant)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                activeVariant === v.variant
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {v.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground">
            {backgroundVariantRows.find((v) => v.variant === activeVariant)?.description}
          </span>
        </div>

        <div className="mb-6 h-[560px] overflow-hidden rounded-xl border border-border">
          <BehaviorCanvas backgroundVariant={activeVariant} />
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Variant</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Default gap
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Default size
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {backgroundVariantRows.map((row) => (
                <tr key={row.variant} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <code className="text-xs text-primary">'{row.label.toLowerCase()}'</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.defaultGap}px</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.defaultSize}px</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Legacy Story Components (kept for interactive exploration)
// ============================================================================

function EmptyCanvasStory() {
  const [nodeCount, setNodeCount] = useState(0);
  const { nodes, setNodes, edges, canvasProps } = useCanvasStory({ initialNodes: [] });

  const addNode = () => {
    const newNode = createNode({
      id: `node-${nodeCount + 1}`,
      type: 'uipath.blank-node',
      position: { x: 100 + (nodeCount % 3) * 200, y: 100 + Math.floor(nodeCount / 3) * 150 },
      display: { label: `Node ${nodeCount + 1}`, subLabel: 'Click to configure', icon: 'plus' },
    });
    setNodes((nds) => [...nds, newNode]);
    setNodeCount((c) => c + 1);
  };

  const clearCanvas = () => {
    setNodes([]);
    setNodeCount(0);
  };

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel title="Canvas actions">
        <Column gap={8} style={{ marginTop: 8 }}>
          <Button onClick={addNode} size="sm">
            Add Node
          </Button>
          <Button onClick={clearCanvas} size="sm" variant="secondary" disabled={nodes.length === 0}>
            Clear Canvas
          </Button>
          <span className="text-sm">
            Nodes: {nodes.length}, Edges: {edges.length}
          </span>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function DefaultStory() {
  const initialNodes = useMemo(() => createPipelineNodes(), []);
  const [defaultEdgeType, setDefaultEdgeType] = useState('default');
  const [animated, setAnimated] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [mode, setMode] = useState<'design' | 'view' | 'readonly'>('design');

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: pipelineEdges });

  return (
    <BaseCanvas
      {...canvasProps}
      mode={mode}
      defaultEdgeOptions={{
        type: defaultEdgeType === 'default' ? undefined : defaultEdgeType,
        animated,
        style: { strokeWidth },
      }}
    >
      <StoryInfoPanel title="Canvas configuration" collapsible defaultCollapsed>
        <Column gap={12} style={{ marginTop: 12, minWidth: 240 }}>
          <Column gap={8}>
            <span className="text-base">Mode:</span>
            <Row gap={8}>
              {(['design', 'view', 'readonly'] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? 'default' : 'secondary'}
                  onClick={() => setMode(m)}
                >
                  {m}
                </Button>
              ))}
            </Row>
            <span className="text-xs" style={{ fontStyle: 'italic' }}>
              {mode === 'design' && 'Full editing capabilities'}
              {mode === 'view' && 'Interactive viewing (pan, zoom, select, click)'}
              {mode === 'readonly' && 'No interactions allowed'}
            </span>
          </Column>

          <Select value={defaultEdgeType} onValueChange={setDefaultEdgeType}>
            <SelectTrigger>
              <SelectValue placeholder="Edge type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Bezier)</SelectItem>
              <SelectItem value="straight">Straight</SelectItem>
              <SelectItem value="step">Step</SelectItem>
              <SelectItem value="smoothstep">Smooth Step</SelectItem>
              <SelectItem value="bezier">Bezier</SelectItem>
            </SelectContent>
          </Select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={animated}
              onChange={(e) => setAnimated(e.target.checked)}
            />
            Animated Edges
          </label>

          <Column gap={8}>
            <span className="text-base">Stroke Width: {strokeWidth}px</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </Column>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function WithNodeFocusControlsStory() {
  const canvasRef = useRef<BaseCanvasRef>(null);

  const initialNodes = useMemo(
    () => [
      createNode({
        id: '1',
        type: 'uipath.blank-node',
        position: { x: 100, y: 100 },
        display: { label: 'Node 1', subLabel: 'Top Left', icon: 'circle' },
      }),
      createNode({
        id: '2',
        type: 'uipath.blank-node',
        position: { x: 800, y: 100 },
        display: { label: 'Node 2', subLabel: 'Top Right', icon: 'circle' },
      }),
      createNode({
        id: '3',
        type: 'uipath.blank-node',
        position: { x: 100, y: 600 },
        display: { label: 'Node 3', subLabel: 'Bottom Left', icon: 'circle' },
      }),
      createNode({
        id: '4',
        type: 'uipath.blank-node',
        position: { x: 800, y: 600 },
        display: { label: 'Node 4', subLabel: 'Bottom Right', icon: 'circle' },
      }),
      createNode({
        id: '5',
        type: 'uipath.blank-node',
        position: { x: 450, y: 350 },
        display: { label: 'Center Node', subLabel: 'Hub', icon: 'target' },
        handleConfigurations: [
          {
            position: Position.Top,
            handles: [
              { id: 'in1', type: 'target', handleType: 'input' },
              { id: 'in2', type: 'target', handleType: 'input' },
            ],
          },
          {
            position: Position.Bottom,
            handles: [
              { id: 'in3', type: 'target', handleType: 'input' },
              { id: 'in4', type: 'target', handleType: 'input' },
            ],
          },
        ],
      }),
    ],
    []
  );

  const initialEdges: Edge[] = [
    { id: 'e1-5', source: '1', sourceHandle: 'output', target: '5', targetHandle: 'in1' },
    { id: 'e2-5', source: '2', sourceHandle: 'output', target: '5', targetHandle: 'in2' },
    { id: 'e3-5', source: '3', sourceHandle: 'output', target: '5', targetHandle: 'in3' },
    { id: 'e4-5', source: '4', sourceHandle: 'output', target: '5', targetHandle: 'in4' },
  ];

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas ref={canvasRef} {...canvasProps} mode="view">
      <StoryInfoPanel title="Focus controls">
        <Column gap={8} style={{ marginTop: 8 }}>
          <Button size="sm" onClick={() => canvasRef.current?.ensureNodesInView(['1'])}>
            Focus Node 1
          </Button>
          <Button size="sm" onClick={() => canvasRef.current?.ensureNodesInView(['2'])}>
            Focus Node 2
          </Button>
          <Button size="sm" onClick={() => canvasRef.current?.ensureNodesInView(['3', '4'])}>
            Focus Nodes 3 & 4
          </Button>
          <Button size="sm" onClick={() => canvasRef.current?.centerNode('5')}>
            Center on Node 5
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => canvasRef.current?.ensureAllNodesInView()}
          >
            Show All Nodes
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => canvasRef.current?.ensureNodesInView(['1', '2'], { maintainZoom: true })}
          >
            Focus 1 & 2 (Keep Zoom)
          </Button>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls orientation="vertical" translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

function WithMaintainNodesInViewStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'important-1',
        type: 'uipath.blank-node',
        position: { x: 100, y: 100 },
        display: { label: 'Important Node 1', subLabel: 'Keep in view', icon: 'star' },
      }),
      createNode({
        id: 'important-2',
        type: 'uipath.blank-node',
        position: { x: 300, y: 100 },
        display: { label: 'Important Node 2', subLabel: 'Keep in view', icon: 'star' },
      }),
      createNode({
        id: 'other-1',
        type: 'uipath.blank-node',
        position: { x: 500, y: 200 },
        display: { label: 'Other Node 1', icon: 'square' },
      }),
      createNode({
        id: 'other-2',
        type: 'uipath.blank-node',
        position: { x: 100, y: 300 },
        display: { label: 'Other Node 2', icon: 'square' },
      }),
    ],
    []
  );

  const initialEdges: Edge[] = [
    {
      id: 'e1-2',
      source: 'important-1',
      sourceHandle: 'output',
      target: 'important-2',
      targetHandle: 'input',
    },
    {
      id: 'e2-3',
      source: 'important-2',
      sourceHandle: 'output',
      target: 'other-1',
      targetHandle: 'input',
    },
    {
      id: 'e1-4',
      source: 'important-1',
      sourceHandle: 'output',
      target: 'other-2',
      targetHandle: 'input',
    },
  ];

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  const [maintainNodes, setMaintainNodes] = useState<string[] | undefined>([
    'important-1',
    'important-2',
  ]);
  const [containerSize, setContainerSize] = useState({ width: '100%', height: '100%' });

  const cycleMaintainMode = () => {
    setMaintainNodes((current) => {
      if (current === undefined) return ['important-1', 'important-2'];
      if (current.length > 0) return [];
      return undefined;
    });
  };

  const getMaintainModeLabel = () => {
    if (maintainNodes === undefined) return 'Disabled';
    if (maintainNodes.length > 0) return 'Specific Nodes';
    return 'All Nodes';
  };

  return (
    <Column h="100%">
      <Column
        gap={8}
        p={20}
        style={{
          color: 'var(--canvas-foreground)',
          backgroundColor: 'var(--canvas-background-secondary)',
        }}
      >
        <span className="text-lg font-bold">Maintain Nodes in View Demo</span>
        <span className="text-base">
          Resize the container to see how important nodes stay in view
        </span>
        <Row gap={8} align="center">
          <Button onClick={() => setContainerSize({ width: '400px', height: '300px' })} size="sm">
            Small
          </Button>
          <Button onClick={() => setContainerSize({ width: '600px', height: '400px' })} size="sm">
            Medium
          </Button>
          <Button onClick={() => setContainerSize({ width: '100%', height: '100%' })} size="sm">
            Large
          </Button>
          <Button
            onClick={cycleMaintainMode}
            size="sm"
            variant={maintainNodes !== undefined ? 'default' : 'secondary'}
          >
            {getMaintainModeLabel()}
          </Button>
        </Row>
        {maintainNodes !== undefined && (
          <span className="text-sm">
            {maintainNodes.length > 0
              ? `Maintaining nodes: ${maintainNodes.join(', ')}`
              : 'Maintaining all nodes in view'}
          </span>
        )}
      </Column>
      <div
        style={{
          flex: 1,
          border: '1px solid var(--canvas-border)',
          transition: 'all 0.3s ease',
          ...containerSize,
        }}
      >
        <BaseCanvas {...canvasProps} mode="view" maintainNodesInView={maintainNodes}>
          <Panel position="bottom-right">
            <CanvasPositionControls
              orientation="vertical"
              translations={DefaultCanvasTranslations}
            />
          </Panel>
        </BaseCanvas>
      </div>
    </Column>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Modes: Story = {
  name: 'Modes',
  render: (_, { globals }) => <ModesPage globalTheme={globals.theme || 'future-dark'} />,
};

export const Behavior: Story = {
  name: 'Behavior',
  render: (_, { globals }) => <BehaviorPage globalTheme={globals.theme || 'future-dark'} />,
};

export const EmptyCanvas: Story = {
  name: 'Empty Canvas',
  render: () => <EmptyCanvasStory />,
};

export const Default: Story = {
  name: 'Playground',
  render: () => <DefaultStory />,
};

export const WithNodeFocusControls: Story = {
  name: 'Focus Controls',
  render: () => <WithNodeFocusControlsStory />,
};

export const WithMaintainNodesInView: Story = {
  name: 'Maintain Nodes In View',
  render: () => <WithMaintainNodesInViewStory />,
};
