/**
 * Edge Label Stories
 *
 * Reference page for `data.label` on CanvasEdge (and the SequenceEdge preset,
 * which composes CanvasEdge under the hood): orientation, diff states, and
 * the crossing-edge stacking behavior.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import {
  createNode as createMockNode,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasEdge } from './CanvasEdge';
import type { CanvasEdgeData, Waypoint } from './shared/types';

const meta: Meta = {
  title: 'Components/Edges/EdgeLabels',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Set `data.label` on a CanvasEdge (or SequenceEdge) to render a label at the midpoint of the path. The label portals through `EdgeLabelRenderer`, so it always paints after every edge's own line. Its border matches the resolved edge color across default, hover, selection, diff, validation, and execution states. Long text truncates with an ellipsis and reveals its full value in a tooltip. Hovering or clicking a label interacts with its owning edge; read-only canvases preserve hover tracing but disable selection.",
      },
    },
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const edgeTypes = { 'canvas-edge': CanvasEdge };

interface NodeConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  sourcePositions?: Position[];
  targetPositions?: Position[];
}

/** Thin sugar over the shared mock factory: positions → handleConfigurations. */
function createNode(config: NodeConfig): Node {
  const { id, label, x, y, sourcePositions = [], targetPositions = [] } = config;
  return createMockNode({
    id,
    type: 'uipath.blank-node',
    position: { x, y },
    display: { label },
    handleConfigurations: [
      ...sourcePositions.map((position) => ({
        position,
        handles: [
          { id: `out-${position}`, type: 'source' as const, handleType: 'output' as const },
        ],
      })),
      ...targetPositions.map((position) => ({
        position,
        handles: [{ id: `in-${position}`, type: 'target' as const, handleType: 'input' as const }],
      })),
    ],
  });
}

/**
 * A horizontal and a vertical edge, each labeled. Confirms the label centers
 * on the path midpoint regardless of routing direction.
 */
function OrientationStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'h-source',
        label: 'Source',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'h-target',
        label: 'Target',
        x: 450,
        y: 120,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'v-source',
        label: 'Start',
        x: 250,
        y: 280,
        sourcePositions: [Position.Bottom],
      }),
      createNode({ id: 'v-target', label: 'End', x: 250, y: 480, targetPositions: [Position.Top] }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e-horizontal',
        source: 'h-source',
        target: 'h-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { label: 'Success' },
      },
      {
        id: 'e-vertical',
        source: 'v-source',
        target: 'v-target',
        sourceHandle: `out-${Position.Bottom}`,
        targetHandle: `in-${Position.Top}`,
        type: 'canvas-edge',
        data: { label: 'Next step' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const Orientation: Story = {
  render: () => <OrientationStory />,
  parameters: {
    docs: {
      description: {
        story: 'Labels on a horizontal and a vertical edge, both centered on the path midpoint.',
      },
    },
  },
};

/**
 * Labels alongside diff styling. `isDiffAdded`/`isDiffRemoved` drive the
 * stroke and label-border color via `resolveEdgeColor`.
 */
function DiffStatesStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'added-source',
        label: 'Source',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'added-target',
        label: 'Target',
        x: 450,
        y: 120,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'removed-source',
        label: 'Source',
        x: 100,
        y: 260,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'removed-target',
        label: 'Target',
        x: 450,
        y: 260,
        targetPositions: [Position.Left],
      }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e-added',
        source: 'added-source',
        target: 'added-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { isDiffAdded: true, label: 'New connection' },
      },
      {
        id: 'e-removed',
        source: 'removed-source',
        target: 'removed-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { isDiffRemoved: true, label: 'Deprecated' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const DiffStates: Story = {
  render: () => <DiffStatesStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Labels alongside diff styling. isDiffAdded and isDiffRemoved color both the stroke and its associated label border.',
      },
    },
  },
};

/**
 * Regression coverage for the label/line stacking fix. `EdgeLabel` portals
 * through xyflow's `EdgeLabelRenderer`, which always paints after every
 * edge's own `<svg>`, so a label stays legible no matter which edge is
 * later in the array and would otherwise win the per-edge z-index/DOM-order
 * stacking contest. Both edges below route through the same center point so
 * their paths, and labels, land directly on top of each other.
 */
const CROSSING_WAYPOINT: Waypoint = { id: 'crossing-waypoint', x: 325, y: 250 };

function CrossingLabeledEdgesStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'a1',
        label: 'Start Alpha',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'b1',
        label: 'End Alpha',
        x: 550,
        y: 380,
        targetPositions: [Position.Left],
      }),
      createNode({
        id: 'a2',
        label: 'Start Beta',
        x: 100,
        y: 380,
        sourcePositions: [Position.Right],
      }),
      createNode({ id: 'b2', label: 'End Beta', x: 550, y: 120, targetPositions: [Position.Left] }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e1',
        source: 'a1',
        target: 'b1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { routing: 'waypoint', waypoints: [CROSSING_WAYPOINT], label: 'Alpha' },
      },
      {
        id: 'e2',
        source: 'a2',
        target: 'b2',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { routing: 'waypoint', waypoints: [CROSSING_WAYPOINT], label: 'Beta' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const CrossingLabeledEdges: Story = {
  render: () => <CrossingLabeledEdgesStory />,
  parameters: {
    docs: {
      description: {
        story:
          "Two labeled edges routed through the same center point. Both labels stay legible on top of the crossing line, regardless of array order. Hovering or selecting an edge gives its label a matching one-pixel border, making the path-to-label relationship clear. The hovered edge also rises above intersecting edges so its full path remains traceable. Before the EdgeLabelRenderer fix, whichever edge was later in the array could paint its line over the other edge's label.",
      },
    },
  },
};

/**
 * Two edge-label boundary cases: long text truncates with an ellipsis and
 * exposes its full value in a tooltip, while a short edge with close nodes
 * crowds the label against both node bodies.
 */
function OverflowStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'long-source',
        label: 'Source',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'long-target',
        label: 'Target',
        x: 500,
        y: 120,
        targetPositions: [Position.Left],
      }),

      createNode({
        id: 'short-source',
        label: 'A',
        x: 100,
        y: 300,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'short-target',
        label: 'B',
        x: 180,
        y: 300,
        targetPositions: [Position.Left],
      }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e-long-text',
        source: 'long-source',
        target: 'long-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { label: 'This label is intentionally long enough to overflow the edge' },
      },
      {
        id: 'e-short-edge',
        source: 'short-source',
        target: 'short-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { label: 'Crowded' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const Overflow: Story = {
  render: () => <OverflowStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Long labels are capped by pixel width and truncated with an ellipsis. Hover a truncated label to reveal its full value in a tooltip; hovering and clicking the label still interact with its owning edge. The short-edge example remains a separate crowding case because truncation cannot create space between nearby nodes.',
      },
    },
  },
};

/**
 * A label on an edge with `enableExecution: true`, confirming the label
 * renders unaffected alongside the animated in-progress dot and status color.
 */
function ExecutionStatusStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'exec-source',
        label: 'Start',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'exec-InProgress',
        label: 'In Progress',
        x: 450,
        y: 120,
        targetPositions: [Position.Left],
      }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'edge-InProgress-demo',
        source: 'exec-source',
        target: 'exec-InProgress',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableExecution: true, label: 'Running' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const ExecutionStatus: Story = {
  render: () => <ExecutionStatusStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Label composes with enableExecution: true. The animated in-progress dot and status stroke color are unaffected by the label, and vice versa.',
      },
    },
  },
};

/**
 * A label on a multi-segment waypoint-routed edge. `labelPoint` is the
 * arc-length midpoint of the whole path (see getPathArcMidpoint), so on a
 * bent path it lands wherever that midpoint falls, not necessarily at a
 * visually obvious spot.
 */
const BENT_PATH_WAYPOINTS: Waypoint[] = [
  { id: 'bent-wp-1', x: 300, y: 120 },
  { id: 'bent-wp-2', x: 300, y: 400 },
];

function BentPathStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'bent-source',
        label: 'Source',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'bent-target',
        label: 'Target',
        x: 500,
        y: 400,
        targetPositions: [Position.Left],
      }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e-bent',
        source: 'bent-source',
        target: 'bent-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: {
          routing: 'waypoint',
          waypoints: BENT_PATH_WAYPOINTS,
          enableEditing: true,
          label: 'Multi-segment',
        },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const BentPath: Story = {
  render: () => <BentPathStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Label on a multi-segment waypoint-routed edge. The label sits at the arc-length midpoint of the full path, which on a bent path is not necessarily the visual center of any one segment.',
      },
    },
  },
};

/**
 * Label rendering in readonly mode. Hover remains available for tracing the
 * edge and revealing truncated text, while neither the path nor label can be
 * selected and no editing chrome is available.
 */
function ReadOnlyStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'ro-source',
        label: 'Source',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'ro-target',
        label: 'Target',
        x: 450,
        y: 120,
        targetPositions: [Position.Left],
      }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e-readonly',
        source: 'ro-source',
        target: 'ro-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { label: 'Completed' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="readonly" />;
}

export const ReadOnly: Story = {
  render: () => <ReadOnlyStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Label rendering in readonly mode for a completed workflow run. Hover still traces the path, but clicking either the path or label does not create persistent selection or expose editing controls.',
      },
    },
  },
};
