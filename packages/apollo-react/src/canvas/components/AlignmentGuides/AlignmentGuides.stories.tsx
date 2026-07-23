import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node, OnNodeDrag } from '@uipath/apollo-react/canvas/xyflow/react';
import { BackgroundVariant, Panel, useViewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { createNode, StoryInfoPanel, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import type { AlignmentGuideLine, NodeBounds } from './AlignmentGuides.types';
import { AlignmentGuidesOverlay } from './AlignmentGuidesOverlay';
import { computeAlignmentGuides, toBounds, useAlignmentGuides } from './useAlignmentGuides';

const meta: Meta = {
  title: 'Components/Canvas/AlignmentGuides',
  decorators: [withCanvasProviders()],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

// ============================================================================
// Shared workflow fixture. Every variant below drags nodes on the same layout
// so the pages are directly comparable.
// ============================================================================

function createWorkflowNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'trigger',
      type: 'uipath.manual-trigger',
      position: { x: 80, y: 280 },
      display: { label: 'Start', subLabel: 'Manual trigger', icon: 'play' },
    }),
    createNode({
      id: 'fetch',
      type: 'uipath.blank-node',
      position: { x: 340, y: 120 },
      display: { label: 'Fetch Data', subLabel: 'HTTP request', icon: 'cloud-download' },
    }),
    createNode({
      id: 'validate',
      type: 'uipath.blank-node',
      position: { x: 340, y: 440 },
      display: { label: 'Validate', subLabel: 'Schema check', icon: 'shield-check' },
    }),
    createNode({
      id: 'decision',
      type: 'uipath.blank-node',
      position: { x: 620, y: 280 },
      display: { label: 'Route', subLabel: 'Decision', icon: 'git-branch' },
    }),
    createNode({
      id: 'approve',
      type: 'uipath.blank-node',
      position: { x: 900, y: 120 },
      display: { label: 'Approve', subLabel: 'Human review', icon: 'user-check' },
    }),
    createNode({
      id: 'reject',
      type: 'uipath.blank-node',
      position: { x: 900, y: 440 },
      display: { label: 'Reject', subLabel: 'Auto reject', icon: 'x-circle' },
    }),
    createNode({
      id: 'notify',
      type: 'uipath.blank-node',
      position: { x: 1180, y: 280 },
      display: { label: 'Notify', subLabel: 'Send email', icon: 'mail' },
    }),
  ];
}

const workflowEdges: Edge[] = [
  { id: 'e-trigger-fetch', source: 'trigger', sourceHandle: 'output', target: 'fetch', targetHandle: 'input' },
  { id: 'e-trigger-validate', source: 'trigger', sourceHandle: 'output', target: 'validate', targetHandle: 'input' },
  { id: 'e-fetch-decision', source: 'fetch', sourceHandle: 'output', target: 'decision', targetHandle: 'input' },
  { id: 'e-validate-decision', source: 'validate', sourceHandle: 'output', target: 'decision', targetHandle: 'input' },
  { id: 'e-decision-approve', source: 'decision', sourceHandle: 'output', target: 'approve', targetHandle: 'input' },
  { id: 'e-decision-reject', source: 'decision', sourceHandle: 'output', target: 'reject', targetHandle: 'input' },
  { id: 'e-approve-notify', source: 'approve', sourceHandle: 'output', target: 'notify', targetHandle: 'input' },
  { id: 'e-reject-notify', source: 'reject', sourceHandle: 'output', target: 'notify', targetHandle: 'input' },
];

// ============================================================================
// Baseline: dashed lines, edge + center detection, zoom-aware threshold.
// ============================================================================

function AlignmentGuidesDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes);

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <AlignmentGuidesOverlay guides={guides} />
      <StoryInfoPanel title="Alignment guides (baseline)">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Drag any node. Dashed guide lines appear when its edges or center line up with another
          node's edges or center. Guides are visual only, nothing snaps into place.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const AlignmentGuidesPrototype: Story = {
  name: 'Alignment Guides (Baseline)',
  render: () => <AlignmentGuidesDemo />,
};

// ============================================================================
// Static preview: hardcoded guides, no drag required. Useful as a fixed
// reference when comparing screenshots or reviewing async.
// ============================================================================

const staticGuides: AlignmentGuideLine[] = [
  {
    id: 'vertical-620',
    orientation: 'vertical',
    position: 620,
    start: 80,
    end: 536,
    kind: 'edge',
    matchedNodeIds: ['trigger', 'notify'],
  },
  {
    id: 'horizontal-120',
    orientation: 'horizontal',
    position: 120,
    start: 80,
    end: 996,
    kind: 'edge',
    matchedNodeIds: ['fetch', 'approve'],
  },
];

function StaticGuidesDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });

  return (
    <BaseCanvas {...canvasProps} mode="view">
      <AlignmentGuidesOverlay guides={staticGuides} />
      <StoryInfoPanel title="Static guide preview">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Hardcoded guide lines (no drag required) for visual QA of both the vertical and
          horizontal line styles at once.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const StaticPreview: Story = {
  name: 'Static Guide Preview',
  render: () => <StaticGuidesDemo />,
};

// ============================================================================
// Variant: Center vs. Edge Styling. Center-only matches render as a thicker
// dotted line in a distinct color, so it's clear which kind of match fired.
// ============================================================================

function CenterVsEdgeOverlay({ guides }: { guides: AlignmentGuideLine[] }) {
  const { x: viewportX, y: viewportY, zoom } = useViewport();

  if (guides.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {guides.map((guide) => {
        const isVertical = guide.orientation === 'vertical';
        const isCenter = guide.kind === 'center';
        const style = isVertical
          ? {
              left: guide.position * zoom + viewportX,
              top: guide.start * zoom + viewportY,
              height: (guide.end - guide.start) * zoom,
            }
          : {
              top: guide.position * zoom + viewportY,
              left: guide.start * zoom + viewportX,
              width: (guide.end - guide.start) * zoom,
            };
        const className = isVertical
          ? isCenter
            ? 'absolute border-l-2 border-dotted'
            : 'absolute border-l border-dashed'
          : isCenter
            ? 'absolute border-t-2 border-dotted'
            : 'absolute border-t border-dashed';

        return (
          <div
            key={guide.id}
            className={className}
            style={{
              ...style,
              borderColor: isCenter ? 'var(--canvas-warning-icon)' : 'var(--canvas-selection-indicator)',
            }}
          />
        );
      })}
    </div>
  );
}

function CenterVsEdgeDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes);

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <CenterVsEdgeOverlay guides={guides} />
      <StoryInfoPanel title="Center vs. edge styling">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Same detection as the baseline, but a center-to-center match renders as a thicker
          dotted amber line instead of the default dashed line, so you can tell at a glance
          whether you're aligned on an edge or a center.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const CenterVsEdgeStyling: Story = {
  name: 'Variant: Center vs Edge Styling',
  render: () => <CenterVsEdgeDemo />,
};

// ============================================================================
// Variant: Spacing Labels. Shows the gap (in px) between the dragged node
// and the matched span while a guide is active.
// ============================================================================

function SpacingLabelsOverlay({
  guides,
  nodes,
  draggedNodeId,
}: {
  guides: AlignmentGuideLine[];
  nodes: Node[];
  draggedNodeId: string | null;
}) {
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  const draggedNode = draggedNodeId ? nodes.find((n) => n.id === draggedNodeId) : undefined;

  if (guides.length === 0 || !draggedNode) return null;

  const dragged = toBounds(draggedNode);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {guides.map((guide) => {
        const isVertical = guide.orientation === 'vertical';
        const lineStyle = isVertical
          ? {
              left: guide.position * zoom + viewportX,
              top: guide.start * zoom + viewportY,
              height: (guide.end - guide.start) * zoom,
            }
          : {
              top: guide.position * zoom + viewportY,
              left: guide.start * zoom + viewportX,
              width: (guide.end - guide.start) * zoom,
            };

        // Gap between the dragged node and the nearer end of the matched span,
        // a simplification of "distance to nearest object", not full equal-spacing detection.
        const gapFlow = isVertical
          ? Math.min(Math.abs(dragged.y1 - guide.start), Math.abs(guide.end - dragged.y2))
          : Math.min(Math.abs(dragged.x1 - guide.start), Math.abs(guide.end - dragged.x2));
        const gapPx = Math.round(gapFlow * zoom);

        const labelStyle = isVertical
          ? {
              left: guide.position * zoom + viewportX + 6,
              top: (guide.start + (guide.end - guide.start) / 2) * zoom + viewportY - 10,
            }
          : {
              top: guide.position * zoom + viewportY - 20,
              left: guide.start * zoom + viewportX + ((guide.end - guide.start) * zoom) / 2 - 16,
            };

        return (
          <div key={guide.id}>
            <div
              className={isVertical ? 'absolute border-l border-dashed' : 'absolute border-t border-dashed'}
              style={{ ...lineStyle, borderColor: 'var(--canvas-selection-indicator)' }}
            />
            <div
              className="absolute rounded bg-[var(--canvas-selection-indicator)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--canvas-foreground-inverse)]"
              style={labelStyle}
            >
              {gapPx}px
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpacingLabelsDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const { guides, onNodeDrag: baseOnNodeDrag, onNodeDragStop: baseOnNodeDragStop } = useAlignmentGuides(nodes);

  const onNodeDrag = useCallback<OnNodeDrag>(
    (event, node, draggedNodes) => {
      setDraggedNodeId(node.id);
      baseOnNodeDrag(event, node, draggedNodes);
    },
    [baseOnNodeDrag]
  );

  const onNodeDragStop = useCallback<OnNodeDrag>(
    (event, node, draggedNodes) => {
      setDraggedNodeId(null);
      baseOnNodeDragStop(event, node, draggedNodes);
    },
    [baseOnNodeDragStop]
  );

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <SpacingLabelsOverlay guides={guides} nodes={nodes} draggedNodeId={draggedNodeId} />
      <StoryInfoPanel title="Spacing labels">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Shows the gap in px between the dragged node and the matched span while a guide is
          active. A fuller "equal spacing between 3+ nodes" indicator, like Figma's tick marks,
          is a natural next step but isn't built here yet.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const SpacingLabels: Story = {
  name: 'Variant: Spacing Labels',
  render: () => <SpacingLabelsDemo />,
};

// ============================================================================
// Variant: Highlighted Match. The guide line plus a ring highlight around
// every node the line is actually aligned with.
// ============================================================================

function HighlightedMatchOverlay({ guides, nodes }: { guides: AlignmentGuideLine[]; nodes: Node[] }) {
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  const matchedIds = useMemo(() => new Set(guides.flatMap((g) => g.matchedNodeIds)), [guides]);

  if (guides.length === 0) return null;

  return (
    <>
      <AlignmentGuidesOverlay guides={guides} />
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {nodes
          .filter((n) => matchedIds.has(n.id))
          .map((n) => {
            const bounds = toBounds(n);
            return (
              <div
                key={n.id}
                className="absolute rounded-md ring-2 ring-[var(--canvas-selection-indicator)]"
                style={{
                  left: bounds.x1 * zoom + viewportX - 4,
                  top: bounds.y1 * zoom + viewportY - 4,
                  width: (bounds.x2 - bounds.x1) * zoom + 8,
                  height: (bounds.y2 - bounds.y1) * zoom + 8,
                }}
              />
            );
          })}
      </div>
    </>
  );
}

function HighlightedMatchDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes);

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <HighlightedMatchOverlay guides={guides} nodes={nodes} />
      <StoryInfoPanel title="Highlighted match">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          In addition to the guide line, the specific node(s) you're aligned with get a subtle
          ring highlight, useful once there are many nodes and it's not obvious at a glance
          which one a line is relative to.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const HighlightedMatch: Story = {
  name: 'Variant: Highlighted Match',
  render: () => <HighlightedMatchDemo />,
};

// ============================================================================
// Variant: Magnetic Snap. Same detection, but the dragged node's position
// snaps onto the matched edge/center instead of only drawing a line.
// ============================================================================

function useMagneticSnap(
  nodes: Node[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  thresholdPx = 8
) {
  const { zoom } = useViewport();
  const [guides, setGuides] = useState<AlignmentGuideLine[]>([]);

  const onNodeDrag = useCallback<OnNodeDrag>(
    (_event, draggedNode) => {
      const threshold = thresholdPx / zoom;
      const dragged = toBounds(draggedNode);
      const others = nodes.filter((n) => n.id !== draggedNode.id).map(toBounds);
      const computed = computeAlignmentGuides(dragged, others, threshold);
      setGuides(computed);

      const vGuide = computed.find((g) => g.orientation === 'vertical');
      const hGuide = computed.find((g) => g.orientation === 'horizontal');
      if (!vGuide && !hGuide) return;

      const snapDelta = (guide: AlignmentGuideLine | undefined, values: number[]) => {
        if (!guide) return 0;
        const closest = values.reduce((a, b) =>
          Math.abs(b - guide.position) < Math.abs(a - guide.position) ? b : a
        );
        return guide.position - closest;
      };

      const dx = snapDelta(vGuide, [dragged.x1, dragged.cx, dragged.x2]);
      const dy = snapDelta(hGuide, [dragged.y1, dragged.cy, dragged.y2]);
      if (dx === 0 && dy === 0) return;

      setNodes((nds) =>
        nds.map((n) =>
          n.id === draggedNode.id
            ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
            : n
        )
      );
    },
    [nodes, setNodes, thresholdPx, zoom]
  );

  const onNodeDragStop = useCallback<OnNodeDrag>(() => setGuides([]), []);

  return useMemo(() => ({ guides, onNodeDrag, onNodeDragStop }), [guides, onNodeDrag, onNodeDragStop]);
}

function MagneticSnapDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, setNodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, onNodeDrag, onNodeDragStop } = useMagneticSnap(nodes, setNodes);

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <AlignmentGuidesOverlay guides={guides} />
      <StoryInfoPanel title="Magnetic snap">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Same detection as the baseline, but once within range the node's position snaps
          exactly onto the aligned edge or center instead of only showing a line. Trade-off:
          less control over sub-pixel placement, and it can fight slightly with the raw mouse
          position while dragging.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const MagneticSnap: Story = {
  name: 'Variant: Magnetic Snap',
  render: () => <MagneticSnapDemo />,
};

// ============================================================================
// Variant: Threshold Playground. Tune the match distance live to compare
// how forgiving or precise the guides feel.
// ============================================================================

function ThresholdPlaygroundDemo() {
  const [thresholdPx, setThresholdPx] = useState(8);
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes, { thresholdPx });

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <AlignmentGuidesOverlay guides={guides} />
      <StoryInfoPanel title="Threshold playground">
        <div className="mt-2 flex max-w-xs flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Tune the match distance live to compare how forgiving or precise the guides feel at
            different zoom levels.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="w-14 shrink-0">{thresholdPx}px</span>
            <input
              type="range"
              min={2}
              max={32}
              value={thresholdPx}
              onChange={(e) => setThresholdPx(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const ThresholdPlayground: Story = {
  name: 'Variant: Threshold Playground',
  render: () => <ThresholdPlaygroundDemo />,
};

// ============================================================================
// Variant: Multi-select Drag. Dragging a multi-selected group compares the
// group's combined bounding box against the rest of the canvas, not just one
// node in isolation.
// ============================================================================

function groupBounds(boundsList: NodeBounds[]): NodeBounds {
  const x1 = Math.min(...boundsList.map((b) => b.x1));
  const y1 = Math.min(...boundsList.map((b) => b.y1));
  const x2 = Math.max(...boundsList.map((b) => b.x2));
  const y2 = Math.max(...boundsList.map((b) => b.y2));
  return { id: '__group__', x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

function GroupBoundsOverlay({ bounds }: { bounds: NodeBounds | null }) {
  const { x: viewportX, y: viewportY, zoom } = useViewport();

  if (!bounds) return null;

  return (
    <div
      className="pointer-events-none absolute rounded-md border border-dashed"
      style={{
        left: bounds.x1 * zoom + viewportX - 8,
        top: bounds.y1 * zoom + viewportY - 8,
        width: (bounds.x2 - bounds.x1) * zoom + 16,
        height: (bounds.y2 - bounds.y1) * zoom + 16,
        borderColor: 'var(--canvas-selection-indicator)',
      }}
    />
  );
}

function useMultiSelectAlignmentGuides(nodes: Node[], thresholdPx = 8) {
  const { zoom } = useViewport();
  const [guides, setGuides] = useState<AlignmentGuideLine[]>([]);
  const [draggedGroupBounds, setDraggedGroupBounds] = useState<NodeBounds | null>(null);

  const onNodeDrag = useCallback<OnNodeDrag>(
    (_event, _node, draggedNodes) => {
      const draggedIds = new Set(draggedNodes.map((n) => n.id));
      const others = nodes.filter((n) => !draggedIds.has(n.id)).map(toBounds);
      const group = groupBounds(draggedNodes.map(toBounds));
      setDraggedGroupBounds(group);
      setGuides(computeAlignmentGuides(group, others, thresholdPx / zoom));
    },
    [nodes, thresholdPx, zoom]
  );

  const onNodeDragStop = useCallback<OnNodeDrag>(() => {
    setGuides([]);
    setDraggedGroupBounds(null);
  }, []);

  return useMemo(
    () => ({ guides, draggedGroupBounds, onNodeDrag, onNodeDragStop }),
    [guides, draggedGroupBounds, onNodeDrag, onNodeDragStop]
  );
}

function MultiSelectDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, draggedGroupBounds, onNodeDrag, onNodeDragStop } = useMultiSelectAlignmentGuides(nodes);

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <AlignmentGuidesOverlay guides={guides} />
      <GroupBoundsOverlay bounds={draggedGroupBounds} />
      <StoryInfoPanel title="Multi-select drag">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Shift-click multiple nodes (or Shift-drag a selection box over empty canvas), then drag
          the group. Guides compare the whole selection's bounding box, outlined here, against
          the rest of the canvas, not just one node in isolation.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const MultiSelectDrag: Story = {
  name: 'Variant: Multi-select Drag',
  render: () => <MultiSelectDemo />,
};

// ============================================================================
// Variant: Grid-snap Interplay. Node-to-node guides and xyflow's native
// snapToGrid are independent systems that already compose: grid-snap
// quantizes the raw drag position, guides just read whatever position
// results and compare it to the rest of the canvas.
// ============================================================================

function GridSnapInterplayDemo() {
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes);

  return (
    <BaseCanvas
      {...canvasProps}
      mode="design"
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      snapToGrid={gridSnapEnabled}
      snapGrid={[16, 16]}
      backgroundVariant={gridSnapEnabled ? BackgroundVariant.Lines : undefined}
      backgroundGap={16}
    >
      <AlignmentGuidesOverlay guides={guides} />
      <StoryInfoPanel title="Grid-snap interplay">
        <div className="mt-2 flex max-w-xs flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Grid snap, xyflow's native snapToGrid, and these node-to-node guides are independent
            of each other. Grid-snap quantizes the raw drag position to 16px, and guides simply
            compare whatever position results against the rest of the canvas. No special
            integration code is needed for the two to coexist.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gridSnapEnabled}
              onChange={(e) => setGridSnapEnabled(e.target.checked)}
            />
            Grid snap (16px)
          </label>
        </div>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const GridSnapInterplay: Story = {
  name: 'Variant: Grid-snap Interplay',
  render: () => <GridSnapInterplayDemo />,
};

// ============================================================================
// Variant: Equal-spacing Detection. When the dragged node has a neighbor on
// each side, roughly aligned on the other axis, with matching gaps, both
// gaps are highlighted with a shared label. Limited to the dragged node's
// immediate neighbors, not full n-way spacing detection across the canvas.
// ============================================================================

interface EqualSpacingMatch {
  orientation: 'horizontal' | 'vertical';
  gap: number;
  firstGapStart: number;
  firstGapEnd: number;
  secondGapStart: number;
  secondGapEnd: number;
  /** Position along the perpendicular axis to draw the indicator at (dragged node's center). */
  crossPosition: number;
}

function findEqualSpacing(dragged: NodeBounds, others: NodeBounds[], tolerance: number): EqualSpacingMatch[] {
  const matches: EqualSpacingMatch[] = [];

  const rowOthers = others.filter((o) => o.y1 < dragged.y2 && o.y2 > dragged.y1);
  const left = rowOthers.filter((o) => o.x2 <= dragged.x1).sort((a, b) => b.x2 - a.x2)[0];
  const right = rowOthers.filter((o) => o.x1 >= dragged.x2).sort((a, b) => a.x1 - b.x1)[0];
  if (left && right) {
    const leftGap = dragged.x1 - left.x2;
    const rightGap = right.x1 - dragged.x2;
    if (leftGap > 0 && rightGap > 0 && Math.abs(leftGap - rightGap) <= tolerance) {
      matches.push({
        orientation: 'horizontal',
        gap: Math.round((leftGap + rightGap) / 2),
        firstGapStart: left.x2,
        firstGapEnd: dragged.x1,
        secondGapStart: dragged.x2,
        secondGapEnd: right.x1,
        crossPosition: dragged.cy,
      });
    }
  }

  const columnOthers = others.filter((o) => o.x1 < dragged.x2 && o.x2 > dragged.x1);
  const above = columnOthers.filter((o) => o.y2 <= dragged.y1).sort((a, b) => b.y2 - a.y2)[0];
  const below = columnOthers.filter((o) => o.y1 >= dragged.y2).sort((a, b) => a.y1 - b.y1)[0];
  if (above && below) {
    const aboveGap = dragged.y1 - above.y2;
    const belowGap = below.y1 - dragged.y2;
    if (aboveGap > 0 && belowGap > 0 && Math.abs(aboveGap - belowGap) <= tolerance) {
      matches.push({
        orientation: 'vertical',
        gap: Math.round((aboveGap + belowGap) / 2),
        firstGapStart: above.y2,
        firstGapEnd: dragged.y1,
        secondGapStart: dragged.y2,
        secondGapEnd: below.y1,
        crossPosition: dragged.cx,
      });
    }
  }

  return matches;
}

function EqualSpacingOverlay({ matches }: { matches: EqualSpacingMatch[] }) {
  const { x: viewportX, y: viewportY, zoom } = useViewport();

  if (matches.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {matches.map((match) => {
        const isHorizontal = match.orientation === 'horizontal';
        const barStyle = (start: number, end: number) =>
          isHorizontal
            ? {
                top: match.crossPosition * zoom + viewportY - 1,
                left: start * zoom + viewportX,
                width: (end - start) * zoom,
                height: 2,
              }
            : {
                left: match.crossPosition * zoom + viewportX - 1,
                top: start * zoom + viewportY,
                width: 2,
                height: (end - start) * zoom,
              };
        const labelStyle = isHorizontal
          ? {
              top: match.crossPosition * zoom + viewportY - 20,
              left: ((match.firstGapEnd + match.secondGapStart) / 2) * zoom + viewportX - 20,
            }
          : {
              left: match.crossPosition * zoom + viewportX + 6,
              top: ((match.firstGapEnd + match.secondGapStart) / 2) * zoom + viewportY - 10,
            };

        return (
          <div key={match.orientation}>
            <div
              className="absolute rounded-full bg-[var(--canvas-warning-icon)]"
              style={barStyle(match.firstGapStart, match.firstGapEnd)}
            />
            <div
              className="absolute rounded-full bg-[var(--canvas-warning-icon)]"
              style={barStyle(match.secondGapStart, match.secondGapEnd)}
            />
            <div
              className="absolute rounded bg-[var(--canvas-warning-icon)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--canvas-foreground-inverse)]"
              style={labelStyle}
            >
              {match.gap}px equal
            </div>
          </div>
        );
      })}
    </div>
  );
}

function useEqualSpacing(nodes: Node[], draggedNodeId: string | null, thresholdPx = 8): EqualSpacingMatch[] {
  const { zoom } = useViewport();

  return useMemo(() => {
    if (!draggedNodeId) return [];
    const draggedNode = nodes.find((n) => n.id === draggedNodeId);
    if (!draggedNode) return [];
    const dragged = toBounds(draggedNode);
    const others = nodes.filter((n) => n.id !== draggedNodeId).map(toBounds);
    return findEqualSpacing(dragged, others, thresholdPx / zoom);
  }, [nodes, draggedNodeId, thresholdPx, zoom]);
}

function EqualSpacingDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, canvasProps } = useCanvasStory({ initialNodes, initialEdges: workflowEdges });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const { guides, onNodeDrag: baseOnNodeDrag, onNodeDragStop: baseOnNodeDragStop } = useAlignmentGuides(nodes);
  const equalSpacingMatches = useEqualSpacing(nodes, draggedNodeId);

  const onNodeDrag = useCallback<OnNodeDrag>(
    (event, node, draggedNodes) => {
      setDraggedNodeId(node.id);
      baseOnNodeDrag(event, node, draggedNodes);
    },
    [baseOnNodeDrag]
  );

  const onNodeDragStop = useCallback<OnNodeDrag>(
    (event, node, draggedNodes) => {
      setDraggedNodeId(null);
      baseOnNodeDragStop(event, node, draggedNodes);
    },
    [baseOnNodeDragStop]
  );

  return (
    <BaseCanvas {...canvasProps} mode="design" onNodeDrag={onNodeDrag} onNodeDragStop={onNodeDragStop}>
      <AlignmentGuidesOverlay guides={guides} />
      <EqualSpacingOverlay matches={equalSpacingMatches} />
      <StoryInfoPanel title="Equal-spacing detection">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Drag "Route" between the Start/Notify columns. When its gap to the left neighbor
          matches its gap to the right neighbor within tolerance, both gaps get a highlighted
          tick and a shared "Npx equal" label, similar to Figma. Limited to the dragged node's
          immediate left/right or top/bottom neighbor, not full n-way spacing across the canvas.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

export const EqualSpacingDetection: Story = {
  name: 'Variant: Equal-spacing Detection',
  render: () => <EqualSpacingDemo />,
};
