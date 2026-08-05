import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { BackgroundVariant, Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  type Dispatch,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  createNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { AlignmentGuidesOverlay } from './AlignmentGuidesOverlay';
import type { AlignmentPositionUpdate } from './useAlignmentGuides';
import { useAlignmentGuides } from './useAlignmentGuides';

const meta: Meta = {
  title: 'Components/Canvas/AlignmentGuides',
  decorators: [withCanvasProviders()],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

function useApplyAlignmentSnap(setNodes: Dispatch<SetStateAction<Node[]>>) {
  return useCallback(
    (updates: AlignmentPositionUpdate[]) => {
      const positions = new Map(updates.map(({ id, position }) => [id, position]));
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const position = positions.get(node.id);
          return position ? { ...node, position } : node;
        })
      );
    },
    [setNodes]
  );
}

function GuidanceCard({ title, children }: { title: string; children: ReactNode }) {
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
            Alignment guides should be available by default, but visible only at the moment they are
            useful. The experience should feel like quiet, contextual feedback—not a mode the user
            has to find, configure, or remember.
          </p>
        </div>

        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recommendation
          </p>
          <h2 className="mt-2 text-2xl font-semibold">On by default. Hidden until dragging.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Guides appear only while one node or a multi-selection is dragged near a meaningful
            alignment. The same winning candidate draws the guide and applies the exact snapped
            position, then all temporary feedback disappears when the drag ends.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Reviewed behavior</h2>
          <ol className="grid gap-3">
            {[
              'Use restrained, contextual guide lines with a conservative zoom-aware threshold.',
              'Snap to the exact edge or center represented by the visible guide.',
              'Treat a multi-selection as one rigid group and preserve its internal layout.',
              'Apply grid positioning first, then alignment as the final node-to-node correction.',
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
            <GuidanceCard title="One visible promise">
              The guide and magnetic placement use the same resolved candidate. A node always
              finishes exactly where the line indicated.
            </GuidanceCard>
            <GuidanceCard title="Group-aware">
              Multi-selected nodes move as one rigid shape. The group boundary communicates what is
              moving, while one shared delta preserves spacing between selected nodes.
            </GuidanceCard>
            <GuidanceCard title="Stable, not flickery">
              Prefer the closest eligible match with deterministic center and edge priorities, then
              commit it again on release to prevent final-position drift.
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
                    Alignment guides improve placement during dragging. “Tidy up” and
                    align-selection commands intentionally rearrange existing layouts and remain
                    separate actions.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Add a saved preference only if user research or product feedback shows that a meaningful
            group finds the default experience distracting. A modifier key can later temporarily
            suppress snapping without making the basic feature harder to discover.
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
  {
    id: 'e-trigger-fetch',
    source: 'trigger',
    sourceHandle: 'output',
    target: 'fetch',
    targetHandle: 'input',
  },
  {
    id: 'e-trigger-validate',
    source: 'trigger',
    sourceHandle: 'output',
    target: 'validate',
    targetHandle: 'input',
  },
  {
    id: 'e-fetch-decision',
    source: 'fetch',
    sourceHandle: 'output',
    target: 'decision',
    targetHandle: 'input',
  },
  {
    id: 'e-validate-decision',
    source: 'validate',
    sourceHandle: 'output',
    target: 'decision',
    targetHandle: 'input',
  },
  {
    id: 'e-decision-approve',
    source: 'decision',
    sourceHandle: 'output',
    target: 'approve',
    targetHandle: 'input',
  },
  {
    id: 'e-decision-reject',
    source: 'decision',
    sourceHandle: 'output',
    target: 'reject',
    targetHandle: 'input',
  },
  {
    id: 'e-approve-notify',
    source: 'approve',
    sourceHandle: 'output',
    target: 'notify',
    targetHandle: 'input',
  },
  {
    id: 'e-reject-notify',
    source: 'reject',
    sourceHandle: 'output',
    target: 'notify',
    targetHandle: 'input',
  },
];

// ============================================================================
// Canonical behavior: restrained guides and exact magnetic placement share one
// resolver, with zoom-aware thresholds and multi-selection support.
// ============================================================================

function AlignmentGuidesDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, setNodes, canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: workflowEdges,
  });
  const onSnap = useApplyAlignmentSnap(setNodes);
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes, { onSnap });

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
      <StoryInfoPanel title="Alignment guides">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Drag one node or a multi-selection. A restrained guide shows the winning edge or center
          alignment, and the same candidate applies the exact snapped position on drag and release.
        </p>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} />
      </Panel>
    </BaseCanvas>
  );
}

// Variant: Multi-select Drag. Dragging a multi-selected group compares the
// group's combined bounding box against the rest of the canvas, not just one
// node in isolation.
// ============================================================================

function MultiSelectDemo() {
  const initialNodes = useMemo(() => createWorkflowNodes(), []);
  const { nodes, setNodes, canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: workflowEdges,
  });
  const onSnap = useApplyAlignmentSnap(setNodes);
  const { guides, draggedBounds, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes, {
    onSnap,
  });
  const onNodeClick = useCallback(
    (event: MouseEvent, clickedNode: Node) => {
      if (!event.shiftKey) return;

      const selectedIds = new Set(nodes.filter(({ selected }) => selected).map(({ id }) => id));
      selectedIds.add(clickedNode.id);
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({ ...node, selected: selectedIds.has(node.id) }))
      );
    },
    [nodes, setNodes]
  );

  return (
    <BaseCanvas
      {...canvasProps}
      mode="design"
      multiSelectionKeyCode="Shift"
      selectionKeyCode={null}
      selectionOnDrag
      selectNodesOnDrag={false}
      onNodeClick={onNodeClick}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
    >
      <AlignmentGuidesOverlay guides={guides} draggedBounds={draggedBounds} />
      <StoryInfoPanel title="Multi-select drag">
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Shift-click multiple nodes, or drag a selection box over empty canvas, then drag the
          group. Its combined bounds snap against the rest of the canvas, applying one identical
          delta to every selected node so their internal layout never changes.
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
  const { nodes, setNodes, canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: workflowEdges,
  });
  const onSnap = useApplyAlignmentSnap(setNodes);
  const { guides, onNodeDrag, onNodeDragStop } = useAlignmentGuides(nodes, { onSnap });

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
            Grid snap keeps every node on consistent 16px canvas increments, but it does not by
            itself guarantee that two node handles or centers align. Alignment guides detect the
            relationship between nodes, while magnetic snap can apply the exact aligned position.
            Keep this story to ensure grid positioning and node-to-node alignment compose without
            fighting each other.
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

// Keep exports in review order. Storybook preserves CSF export order in the sidebar.
export const UxGuidance: Story = {
  name: 'UX Guidance',
  render: () => <AlignmentGuidesUxGuidance />,
};

export const AlignmentGuidesPrototype: Story = {
  name: 'Alignment Guides',
  render: () => <AlignmentGuidesDemo />,
};

export const GridSnapInterplay: Story = {
  name: 'Grid-snap Interplay',
  render: () => <GridSnapInterplayDemo />,
};

export const MultiSelectDrag: Story = {
  name: 'Multi-select Drag',
  render: () => <MultiSelectDemo />,
};
