import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node, OnNodeDrag } from '@uipath/apollo-react/canvas/xyflow/react';
import { BackgroundVariant, Panel, useViewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
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

function GuidanceCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

function AlignmentGuidesUxGuidance() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-4xl px-8 py-14">
        <div className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            UX guidance
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Alignment guides</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            Alignment guides should be available by default, but visible only at the moment they
            are useful. The experience should feel like quiet, contextual feedback—not a mode the
            user has to find, configure, or remember.
          </p>
        </div>

        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recommendation
          </p>
          <h2 className="mt-2 text-2xl font-semibold">On by default. Hidden until dragging.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Guides appear only while a node is being dragged near a meaningful alignment, then
            disappear immediately when the drag ends. This makes the capability naturally
            discoverable without adding permanent canvas UI.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-2 text-xl font-semibold">Design review map</h2>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            Use the colored markers in the Storybook sidebar to keep the discussion focused.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                marker: '🟢',
                label: 'Must review',
                stories: 'Baseline, Threshold Playground, Grid-snap Interplay',
                prompt: 'A decision is needed for the initial experience.',
              },
              {
                marker: '🔵',
                label: 'Validate',
                stories: 'Center vs Edge Styling, Highlighted Match, Multi-select Drag',
                prompt: 'Confirm whether these match current workflow needs.',
              },
              {
                marker: '🟠',
                label: 'Nice to have',
                stories: 'Spacing Labels, Magnetic Snap, Equal-spacing Detection',
                prompt: 'Useful future directions; no decision is required now.',
              },
              {
                marker: '⚪',
                label: 'Reference',
                stories: 'Static Guide Preview',
                prompt: 'Visual QA reference rather than a product decision.',
              },
            ].map(({ marker, label, stories, prompt }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">
                    {marker}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                </div>
                <div>
                  <p className="mt-0.5 text-sm text-foreground">{stories}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Recommended rollout</h2>
          <ol className="grid gap-3">
            {[
              'Ship contextual alignment guides on by default with conservative thresholds and minimal visuals.',
              'Observe whether guides help placement without distracting from common drag tasks.',
              'Tune match priority, visual weight, and flicker prevention from real usage.',
              'Introduce a preference only when evidence shows that user control is necessary.',
            ].map((item, index) => (
              <li key={item} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm leading-6 text-muted-foreground">{item}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Interaction principles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <GuidanceCard title="Contextual, not persistent">
              Render guides only during an active drag and only inside a small, zoom-aware match
              threshold. Nothing remains on the canvas afterward.
            </GuidanceCard>
            <GuidanceCard title="Helpful, not forceful">
              The baseline guides communicate alignment without moving the node. If magnetic
              snapping is added, it should be subtle and easy to override.
            </GuidanceCard>
            <GuidanceCard title="Minimal, not noisy">
              Prefer the smallest useful set of guide lines. Avoid showing every possible match,
              and reserve labels for spacing information that changes the user's decision.
            </GuidanceCard>
            <GuidanceCard title="Stable, not flickery">
              Apply a consistent threshold and match priority so nearby candidates do not cause
              lines or labels to jump rapidly during a drag.
            </GuidanceCard>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Why not add a canvas toggle?</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Consideration</th>
                  <th className="px-5 py-3 font-medium">UX impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                <tr>
                  <td className="px-5 py-4 font-medium text-foreground">Discoverability</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    Users who would benefit may never know to enable a feature they have not yet
                    experienced.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium text-foreground">Canvas simplicity</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    A persistent control adds weight to the canvas for feedback that appears only
                    during a temporary interaction.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium text-foreground">Mental model</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    “Tidy up” performs an explicit layout action; alignment guides are passive
                    feedback. They should not be grouped as equivalent modes.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Add a saved preference only if user research or product feedback shows that a
            meaningful group finds the default experience distracting. An advanced modifier key
            can later expose richer spacing detail or temporarily suppress snapping without
            making the basic feature harder to discover.
          </p>
        </section>

      </main>
    </div>
  );
}

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
    <BaseCanvas
      {...canvasProps}
      mode="design"
      multiSelectionKeyCode="Shift"
      selectionKeyCode={null}
      selectionOnDrag
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
    >
      <AlignmentGuidesOverlay guides={guides} />
      <GroupBoundsOverlay bounds={draggedGroupBounds} />
      <StoryInfoPanel title="Multi-select drag">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Shift-click multiple nodes, or drag a selection box over empty canvas, then drag the
          group. Guides compare the whole selection's bounding box, outlined here, against the
          rest of the canvas, not just one node in isolation.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

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

// Keep exports in review order. Storybook preserves CSF export order in the sidebar.
export const UxGuidance: Story = {
  name: 'UX Guidance',
  render: () => <AlignmentGuidesUxGuidance />,
};

export const AlignmentGuidesPrototype: Story = {
  name: '🟢 Alignment Guides (Baseline)',
  render: () => <AlignmentGuidesDemo />,
};

export const ThresholdPlayground: Story = {
  name: '🟢 Threshold Playground',
  render: () => <ThresholdPlaygroundDemo />,
};

export const GridSnapInterplay: Story = {
  name: '🟢 Grid-snap Interplay',
  render: () => <GridSnapInterplayDemo />,
};

export const CenterVsEdgeStyling: Story = {
  name: '🔵 Center vs Edge Styling',
  render: () => <CenterVsEdgeDemo />,
};

export const HighlightedMatch: Story = {
  name: '🔵 Highlighted Match',
  render: () => <HighlightedMatchDemo />,
};

export const MultiSelectDrag: Story = {
  name: '🔵 Multi-select Drag',
  render: () => <MultiSelectDemo />,
};

export const SpacingLabels: Story = {
  name: '🟠 Spacing Labels',
  render: () => <SpacingLabelsDemo />,
};

export const MagneticSnap: Story = {
  name: '🟠 Magnetic Snap',
  render: () => <MagneticSnapDemo />,
};

export const EqualSpacingDetection: Story = {
  name: '🟠 Equal-spacing Detection',
  render: () => <EqualSpacingDemo />,
};

export const StaticPreview: Story = {
  name: '⚪ Static Guide Preview',
  render: () => <StaticGuidesDemo />,
};
