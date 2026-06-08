import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { Panel, useReactFlow, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { ScanEye } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { ProbeCard } from '../ProbeCard';
import type { WatchResult } from '../ProbeCard';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Components/Panels/Node Flyout Probe',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared constants
// ============================================================================

// xyflow v12 stores computed position in `internals.positionAbsolute`; v11
// used top-level `width`/`height`. This narrow type covers both shapes so we
// avoid untyped `any` casts in the anchor selector below.
type NodeWithInternals = Node & {
  internals?: { positionAbsolute?: { x: number; y: number } };
  width?: number;
  height?: number;
};

const PROBE_NODE_ID = 'probe-anchor';

const INITIAL_WATCHES: WatchResult[] = [
  { id: '1', expression: 'output.status', value: 'completed', hasValue: true },
  {
    id: '2',
    expression: 'output.items',
    value: [
      { id: 'a1', name: 'Invoice #001' },
      { id: 'a2', name: 'Invoice #002' },
    ],
    hasValue: true,
  },
  { id: '3', expression: 'output.count', value: 42, hasValue: true },
];

const INITIAL_OFFSET = { x: 220, y: -60 };
const INITIAL_SIZE = { width: 256, height: 220 };
const MIN_W = 200;
const MIN_H = 80;

function makeAnchorNode(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: PROBE_NODE_ID,
      type: 'uipath.agent',
      position: { x: 160, y: 240 },
      display: { label: 'AI Agent', subLabel: 'Review documents' },
    }),
  ];
}

// ============================================================================
// ProbeOverlay — inner component that lives inside BaseCanvas
// so it has access to the ReactFlow store for coordinate tracking.
// ============================================================================

function ProbeOverlay({
  visible,
  watches,
  offset,
  size,
  setVisible,
  setWatches,
  setOffset,
  setSize,
  iterationControl,
}: {
  visible: boolean;
  watches: WatchResult[];
  offset: { x: number; y: number };
  size: { width: number; height: number };
  setVisible: (v: boolean) => void;
  setWatches: React.Dispatch<React.SetStateAction<WatchResult[]>>;
  setOffset: (
    v: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })
  ) => void;
  setSize: (
    v:
      | { width: number; height: number }
      | ((prev: { width: number; height: number }) => { width: number; height: number })
  ) => void;
  iterationControl?: { current: number; total: number; onPrev: () => void; onNext: () => void };
}) {
  const tx = useStore((s) => s.transform[0]);
  const ty = useStore((s) => s.transform[1]);
  const zoom = useStore((s) => s.transform[2]);
  const { panBy, getViewport, setViewport } = useReactFlow();

  const anchor = useStore((s) => {
    const n = s.nodeLookup?.get(PROBE_NODE_ID) as NodeWithInternals | undefined;
    if (!n) return null;
    const abs = n.internals?.positionAbsolute ?? n.position;
    return {
      x: abs.x,
      y: abs.y,
      width: n.measured?.width ?? n.width ?? 96,
      height: n.measured?.height ?? n.height ?? 64,
    };
  });

  const dragStartOffset = useRef(offset);
  const resizeStart = useRef({ size, offset });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const onDragStart = useCallback(() => {
    dragStartOffset.current = offset;
  }, [offset]);
  const onDrag = useCallback(
    (delta: { x: number; y: number }) => {
      setOffset({
        x: dragStartOffset.current.x + delta.x / zoomRef.current,
        y: dragStartOffset.current.y + delta.y / zoomRef.current,
      });
    },
    [setOffset]
  );
  const onDragEnd = useCallback(() => {}, []);

  const onResizeStart = useCallback(() => {
    resizeStart.current = { size, offset };
  }, [size, offset]);
  const onResize = useCallback(
    (
      delta: { x: number; y: number },
      edges: { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean }
    ) => {
      const s = resizeStart.current;
      let w = s.size.width,
        h = s.size.height,
        ox = s.offset.x,
        oy = s.offset.y;
      if (edges.right) w = Math.max(MIN_W, s.size.width + delta.x);
      if (edges.bottom) h = Math.max(MIN_H, s.size.height + delta.y);
      if (edges.left) {
        w = Math.max(MIN_W, s.size.width - delta.x);
        ox = s.offset.x + (s.size.width - w) / zoomRef.current;
      }
      if (edges.top) {
        h = Math.max(MIN_H, s.size.height - delta.y);
        oy = s.offset.y + (s.size.height - h) / zoomRef.current;
      }
      setSize({ width: w, height: h });
      setOffset({ x: ox, y: oy });
    },
    [setSize, setOffset]
  );
  const onResizeEnd = useCallback(() => {}, []);

  const onAddWatch = useCallback(() => {
    setWatches((prev) => [
      ...prev,
      { id: String(Date.now()), expression: '', value: undefined, hasValue: false },
    ]);
  }, [setWatches]);
  const onUpdateWatch = useCallback(
    (id: string, expression: string) => {
      setWatches((prev) => prev.map((w) => (w.id === id ? { ...w, expression } : w)));
    },
    [setWatches]
  );
  const onRemoveWatch = useCallback(
    (id: string) => {
      setWatches((prev) => prev.filter((w) => w.id !== id));
    },
    [setWatches]
  );
  const onCanvasPan = useCallback(
    (delta: { x: number; y: number }) => {
      panBy(delta);
    },
    [panBy]
  );
  const onCanvasZoom = useCallback(
    (params: {
      clientX: number;
      clientY: number;
      deltaY: number;
      deltaMode: number;
      ctrlKey: boolean;
    }) => {
      const { x, y, zoom: currentZoom } = getViewport();
      const delta = params.deltaMode === 1 ? params.deltaY * 30 : params.deltaY;
      const factor = Math.exp(-delta * 0.002);
      const newZoom = Math.max(0.1, Math.min(4, currentZoom * factor));
      setViewport({
        x: params.clientX - (params.clientX - x) * (newZoom / currentZoom),
        y: params.clientY - (params.clientY - y) * (newZoom / currentZoom),
        zoom: newZoom,
      });
    },
    [getViewport, setViewport]
  );

  if (!anchor) return null;

  const anchorCx = anchor.x + anchor.width / 2;
  const anchorCy = anchor.y + anchor.height / 2;
  const anchorScreenCx = anchorCx * zoom + tx;
  const anchorScreenCy = anchorCy * zoom + ty;
  const cardLeft = anchorScreenCx + offset.x * zoom;
  const cardTop = anchorScreenCy + offset.y * zoom;
  const cardCx = cardLeft + size.width / 2;
  const cardCy = cardTop + size.height / 2;
  const dx = cardCx - anchorScreenCx;
  const dy = cardCy - anchorScreenCy;
  const hw = (anchor.width * zoom) / 2;
  const hh = (anchor.height * zoom) / 2;
  const t =
    dx === 0 && dy === 0
      ? 1
      : Math.min(
          Math.abs(dx) === 0 ? Infinity : hw / Math.abs(dx),
          Math.abs(dy) === 0 ? Infinity : hh / Math.abs(dy)
        );
  const exitX = anchorScreenCx + t * dx;
  const exitY = anchorScreenCy + t * dy;
  const addBtnLeft = anchorScreenCx - (anchor.width * zoom) / 2;
  const addBtnTop = anchorScreenCy + (anchor.height * zoom) / 2 + 8;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
      {visible && (
        <svg className="absolute inset-0 w-full h-full" aria-hidden style={{ overflow: 'visible' }}>
          <path
            d={`M ${exitX} ${exitY} L ${cardCx} ${cardCy}`}
            stroke="var(--canvas-border)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            fill="none"
          />
        </svg>
      )}
      {!visible && (
        <button
          type="button"
          onClick={() => {
            setOffset(INITIAL_OFFSET);
            setSize(INITIAL_SIZE);
            setVisible(true);
          }}
          className="absolute flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-surface-hover hover:text-foreground pointer-events-auto"
          style={{ left: addBtnLeft, top: addBtnTop }}
        >
          <ScanEye size={12} />
          Add probe
        </button>
      )}
      {visible && (
        <div
          className="absolute pointer-events-auto"
          style={{ left: cardLeft, top: cardTop, width: size.width, height: size.height }}
        >
          <ProbeCard
            watches={watches}
            iterationControl={iterationControl}
            onAddWatch={onAddWatch}
            onUpdateWatch={onUpdateWatch}
            onRemoveWatch={onRemoveWatch}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onResizeStart={onResizeStart}
            onResize={onResize}
            onResizeEnd={onResizeEnd}
            onClose={() => setVisible(false)}
            onCanvasPan={onCanvasPan}
            onCanvasZoom={onCanvasZoom}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Overview — doc-layout page documenting anatomy, contract, and usage
// ============================================================================

const OVERVIEW_WATCHES: WatchResult[] = [
  { id: '1', expression: 'output.status', value: 'completed', hasValue: true },
  { id: '2', expression: 'output.count', value: 12, hasValue: true },
  { id: '3', expression: 'output.approved', value: true, hasValue: true },
];

const contractRows = [
  {
    card: 'Drag to reposition',
    you: 'offset { x, y } — canvas-coordinate offset from anchor center',
  },
  {
    card: 'Corner-handle resize',
    you: 'size { width, height } — card dimensions in screen pixels',
  },
  {
    card: 'Add / edit / remove watches',
    you: 'WatchResult[] — pre-evaluated expressions + values',
  },
  { card: 'Escape / Delete to dismiss', you: 'onClose() callback' },
  { card: 'Scroll / pinch forwarding', you: 'onCanvasPan / onCanvasZoom callbacks' },
  { card: 'Iteration cycling UI', you: 'IterationControl — current, total, onPrev, onNext' },
];

const anatomyCards = [
  {
    label: 'Drag handle',
    description:
      'Cursor-move header row. Fires onDragStart / onDrag / onDragEnd with cumulative screen-pixel deltas.',
  },
  {
    label: 'Watch list',
    description:
      'Scrollable list of editable expression inputs. Committed on blur or Enter. ArrowUp/Down moves between rows.',
  },
  {
    label: 'Resize handles',
    description:
      'Four corner dots shown on hover. Fire onResizeStart / onResize(delta, edges) / onResizeEnd.',
  },
  {
    label: 'Connector line',
    description:
      'SVG dashed line drawn by the caller (not the card) using canvas-to-screen coordinate math.',
  },
];

const usageSnippet = `import { ProbeCard } from '@uipath/apollo-react/canvas';
import type { WatchResult } from '@uipath/apollo-react/canvas';

// The caller owns position, size, and watches.
// ProbeCard owns all interaction (drag, resize, keyboard, scroll).
<div style={{ position: 'absolute', left: cardLeft, top: cardTop, width, height }}>
  <ProbeCard
    watches={watches}                          // WatchResult[] — pre-evaluated
    onAddWatch={() => addWatch(probeId)}
    onUpdateWatch={(id, expr) => updateWatch(probeId, id, expr)}
    onRemoveWatch={(id) => removeWatch(probeId, id)}
    onDragStart={() => captureOffset()}
    onDrag={(delta) => setOffset(prev => ({
      x: prev.x + delta.x / zoom,
      y: prev.y + delta.y / zoom,
    }))}
    onDragEnd={() => persistOffset()}
    onResizeStart={() => captureSize()}
    onResize={(delta, edges) => applyResize(delta, edges, zoom)}
    onResizeEnd={() => persistSize()}
    onClose={() => removeProbe(probeId)}
    onCanvasPan={(delta) => panBy(delta)}
    onCanvasZoom={(params) => zoomAtPoint(params)}
  />
</div>`.trim();

function OverviewPage({ globalTheme }: { globalTheme: string }) {
  return (
    <div className={cn(globalTheme, 'min-h-screen w-full bg-background text-foreground')}>
      {/* ── Header ── */}
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Node Flyout Probe
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          A floating debug card that anchors to a canvas node via a dashed connector. Engineers
          attach a Probe to inspect a node's runtime output values during execution — adding watch
          expressions, stepping through loop iterations, and dragging the card freely around the
          canvas. The card is <strong className="text-foreground">fully controlled</strong>:
          position, size, and watch data are owned by the caller. The card owns all interactions.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-8">
        {/* ── Preview ── */}
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Preview</h2>
        <div className="mb-10 flex items-start gap-16 rounded-xl border border-border bg-card p-8">
          {/* Mock node + connector */}
          <div className="relative flex shrink-0 flex-col items-center gap-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Anchor node</p>
            <div className="flex h-14 w-24 items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 shadow-sm">
              <div className="h-6 w-6 shrink-0 rounded bg-muted" />
              <div className="flex flex-col gap-1">
                <div className="h-1.5 w-10 rounded-full bg-muted" />
                <div className="h-1.5 w-7 rounded-full bg-muted opacity-50" />
              </div>
            </div>
            <svg className="absolute -right-14 top-8" width="56" height="2" aria-hidden>
              <line
                x1="0"
                y1="1"
                x2="56"
                y2="1"
                stroke="var(--canvas-border, var(--border))"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
            </svg>
          </div>

          {/* ProbeCard preview */}
          <div className="flex-1">
            <p className="mb-2 text-xs font-medium text-muted-foreground">ProbeCard</p>
            <div className="h-[220px] w-[256px]">
              <ProbeCard
                watches={OVERVIEW_WATCHES}
                onAddWatch={() => {}}
                onUpdateWatch={() => {}}
                onRemoveWatch={() => {}}
                onDragStart={() => {}}
                onDrag={() => {}}
                onDragEnd={() => {}}
                onResizeStart={() => {}}
                onResize={() => {}}
                onResizeEnd={() => {}}
                onClose={() => {}}
              />
            </div>
          </div>
        </div>

        {/* ── Anatomy ── */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Anatomy</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          The card is split into four functional zones. Only the watch list and resize handles are
          rendered by{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">ProbeCard</code> — the
          connector line is drawn by the caller using canvas-to-screen coordinates.
        </p>
        <div className="mb-10 grid grid-cols-2 gap-4">
          {anatomyCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5">
              <p className="mb-1.5 text-sm font-semibold text-foreground">{card.label}</p>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>

        {/* ── Consumer contract ── */}
        <div className="mb-8 h-px bg-border" />
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Consumer contract
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">ProbeCard</code>{' '}
          handles all visual interaction. The caller is responsible for state and canvas
          integration.
        </p>
        <div className="mb-10 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Card owns
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">You own</th>
              </tr>
            </thead>
            <tbody>
              {contractRows.map((row) => (
                <tr key={row.card} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.card}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <code className="text-xs text-primary">{row.you}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── How to use ── */}
        <div className="mb-8 h-px bg-border" />
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">How to use</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Render the card inside an{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
            absolute inset-0
          </code>{' '}
          overlay div within your canvas container. Calculate{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">cardLeft</code> /{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">cardTop</code> by
          converting the anchor node's canvas coordinates to screen coordinates using the ReactFlow
          viewport transform.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
          {usageSnippet}
        </pre>
      </div>
    </div>
  );
}

export const Overview: Story = {
  name: 'Overview',
  render: (_, { globals }) => <OverviewPage globalTheme={globals.theme || 'future-dark'} />,
};

// ============================================================================
// Default — pre-seeded watch expressions with resolved values
// ============================================================================

function DefaultStory() {
  const [visible, setVisible] = useState(false);
  const [watches, setWatches] = useState<WatchResult[]>(INITIAL_WATCHES);
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [size, setSize] = useState(INITIAL_SIZE);
  const initialNodes = useMemo(() => makeAnchorNode(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="view">
      <ProbeOverlay
        visible={visible}
        watches={watches}
        offset={offset}
        size={size}
        setVisible={setVisible}
        setWatches={setWatches}
        setOffset={setOffset}
        setSize={setSize}
      />
      <StoryInfoPanel
        title="Node Flyout Probe"
        description="A floating debug card anchored to a node via a dashed connector. Click 'Add probe' below the node to attach one. Drag the header to reposition, corner handles to resize, + to add watches. Press Escape to close, ↑↓ to navigate between watch inputs."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const Default: Story = {
  render: () => <DefaultStory />,
};

// ============================================================================
// Empty state — card before any watches are added
// ============================================================================

function EmptyStory() {
  const [visible, setVisible] = useState(false);
  const [watches, setWatches] = useState<WatchResult[]>([]);
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [size, setSize] = useState(INITIAL_SIZE);
  const initialNodes = useMemo(() => makeAnchorNode(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="view">
      <ProbeOverlay
        visible={visible}
        watches={watches}
        offset={offset}
        size={size}
        setVisible={setVisible}
        setWatches={setWatches}
        setOffset={setOffset}
        setSize={setSize}
      />
      <StoryInfoPanel
        title="Node Flyout Probe — Empty state"
        description="No watches added yet. Use + to add a watch expression."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const EmptyState: Story = {
  name: 'Empty state',
  render: () => <EmptyStory />,
};

// ============================================================================
// Iteration control — loop node with multiple captured iterations
// ============================================================================

const ITERATION_BASE: WatchResult[] = [
  { id: '1', expression: 'item.id', value: 'INV-042', hasValue: true },
  { id: '2', expression: 'item.amount', value: 8750, hasValue: true },
  { id: '3', expression: 'item.approved', value: true, hasValue: true },
];

function IterationStory() {
  const [current, setCurrent] = useState(0);
  const total = 5;

  const watches: WatchResult[] = ITERATION_BASE.map((w) => ({
    ...w,
    value:
      w.expression === 'item.id'
        ? `INV-04${current + 2}`
        : w.expression === 'item.amount'
          ? 1200 * (current + 1)
          : current % 2 === 0,
  }));

  const initialNodes = useMemo(
    () => [
      createNode({
        id: PROBE_NODE_ID,
        type: 'uipath.agent',
        position: { x: 160, y: 240 },
        display: { label: 'Process Invoices', subLabel: 'Loop node' },
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="view">
      <ProbeOverlay
        visible
        watches={watches}
        offset={{ x: 220, y: -80 }}
        size={{ width: 256, height: 240 }}
        setVisible={() => {}}
        setWatches={() => {}}
        setOffset={() => {}}
        setSize={() => {}}
        iterationControl={{
          current,
          total,
          onPrev: () => setCurrent((i) => Math.max(0, i - 1)),
          onNext: () => setCurrent((i) => Math.min(total - 1, i + 1)),
        }}
      />
      <StoryInfoPanel
        title="Node Flyout Probe — Iteration control"
        description="The cycler appears when a node inside a loop has multiple captured iterations. Use Previous / Next to step through each run and see how watch values change."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const IterationControl: Story = {
  name: 'Iteration control',
  render: () => <IterationStory />,
};
