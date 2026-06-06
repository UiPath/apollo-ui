import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel, useReactFlow, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { ScanEye } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  createNode,
  NodePositions,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode';
import { ProbeCard } from '../ProbeCard';
import type { WatchResult } from '../ProbeCard';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { NodePropertiesPanel } from './NodePropertiesPanel';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof NodePropertiesPanel> = {
  title: 'Components/Panels/Node Flyout Panel',
  component: NodePropertiesPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof NodePropertiesPanel>;

// ============================================================================
// Initial Data
// ============================================================================

function createInitialNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'decision',
      type: 'uipath.control-flow.decision',
      position: NodePositions.row1col1,
      display: { label: 'Decision Point', subLabel: 'Select this node to configure' },
    }),
    createNode({
      id: 'agent',
      type: 'uipath.agent',
      position: NodePositions.row2col1,
      display: { label: 'Review Agent', subLabel: 'Reviews loan applications' },
    }),
    createNode({
      id: 'approval',
      type: 'uipath.human-task.approval',
      position: NodePositions.row1col2,
      display: { label: 'Manager Approval', subLabel: 'Requires manager sign-off' },
    }),
  ];
}

// ============================================================================
// Story Component
// ============================================================================

function PropertiesPanelStory() {
  const [isPinned, setIsPinned] = useState(false);
  const initialNodes = useMemo(() => createInitialNodes(), []);

  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodePropertiesPanel
        position="right"
        enableValidation={true}
        maintainSelection={true}
        defaultPinned={isPinned}
        onPinnedChange={setIsPinned}
        onChange={(nodeId, field, value) => console.log(`Node ${nodeId}: ${field} = ${value}`)}
      />
      <StoryInfoPanel
        title="Node Properties Panel"
        description={`Click on nodes to open properties panel. Panel is ${isPinned ? 'pinned to the right' : 'floating near node'}.`}
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  render: () => <PropertiesPanelStory />,
};

// ============================================================================
// Probe story
// ============================================================================

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

// Inner overlay — lives inside BaseCanvas so it has access to the ReactFlow store
function ProbeOverlay({
  visible,
  watches,
  offset,
  size,
  setVisible,
  setWatches,
  setOffset,
  setSize,
}: {
  visible: boolean;
  watches: WatchResult[];
  offset: { x: number; y: number };
  size: { width: number; height: number };
  setVisible: (v: boolean) => void;
  setWatches: React.Dispatch<React.SetStateAction<WatchResult[]>>;
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
}) {
  const tx = useStore((s) => s.transform[0]);
  const ty = useStore((s) => s.transform[1]);
  const zoom = useStore((s) => s.transform[2]);
  const { panBy } = useReactFlow();

  // Get anchor node's absolute canvas position from ReactFlow store
  const anchor = useStore((s) => {
    const n = s.nodeLookup?.get(PROBE_NODE_ID);
    if (!n) return null;
    // biome-ignore lint/suspicious/noExplicitAny: xyflow internal shape not exposed in public types
    const abs = (n as any).internals?.positionAbsolute ?? n.position;
    return {
      x: abs.x as number,
      y: abs.y as number,
      // biome-ignore lint/suspicious/noExplicitAny: xyflow internal shape not exposed in public types
      width: (n.measured?.width ?? (n as any).width ?? 96) as number,
      // biome-ignore lint/suspicious/noExplicitAny: xyflow internal shape not exposed in public types
      height: (n.measured?.height ?? (n as any).height ?? 64) as number,
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

  if (!anchor) return null;

  // Canvas → screen coordinate conversion
  const anchorCx = anchor.x + anchor.width / 2;
  const anchorCy = anchor.y + anchor.height / 2;
  const anchorScreenCx = anchorCx * zoom + tx;
  const anchorScreenCy = anchorCy * zoom + ty;

  const cardLeft = anchorScreenCx + offset.x * zoom;
  const cardTop = anchorScreenCy + offset.y * zoom;
  const cardCx = cardLeft + size.width / 2;
  const cardCy = cardTop + size.height / 2;

  // Ray-box intersection: find exit point from the anchor node toward the card
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
      {/* Dashed connector */}
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

      {/* Add probe button — positioned below the anchor node */}
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

      {/* ProbeCard */}
      {visible && (
        <div
          className="absolute pointer-events-auto"
          style={{ left: cardLeft, top: cardTop, width: size.width, height: size.height }}
        >
          <ProbeCard
            watches={watches}
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
          />
        </div>
      )}
    </div>
  );
}

function ProbeStoryCanvas() {
  const [visible, setVisible] = useState(false);
  const [watches, setWatches] = useState<WatchResult[]>(INITIAL_WATCHES);
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [size, setSize] = useState(INITIAL_SIZE);

  const initialNodes = useMemo(
    () => [
      createNode({
        id: PROBE_NODE_ID,
        type: 'uipath.agent',
        position: { x: 160, y: 240 },
        display: { label: 'AI Agent', subLabel: 'Review documents' },
      }),
    ],
    []
  );

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
        title="Probe"
        description="A floating debug card anchored to a node via a dashed connector. Click 'Add probe' below the node to attach one. Drag the header to reposition, corner handles to resize, + to add watches."
      />
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const Probe: Story = {
  render: () => <ProbeStoryCanvas />,
};
