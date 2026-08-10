/**
 * CanvasEdge Stories
 *
 * The unified canvas edge — visual styling renders unconditionally,
 * and behaviors (waypoint editing, future execution/toolbar) opt in via
 * `enable*` flags on the edge data.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { Label, Switch } from '@uipath/apollo-wind';
import { useCallback, useMemo, useState } from 'react';
import {
  createNode as createMockNode,
  StoryCard,
  StoryCode,
  StoryCodeBlock,
  StoryInfoPanel,
  StoryPage,
  StoryPreview,
  StorySection,
  type StorySpecColumn,
  StorySpecTable,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { ElementStatusValues } from '../../types/execution';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasEdge } from './CanvasEdge';
import { EDGE_CONSTANTS } from './shared/constants';
import type { EdgeRouter, RoutedEdge, RouteRequest } from './shared/routing';
import { useGraphRouter } from './shared/routing';
import type { CanvasEdgeData, Waypoint } from './shared/types';
import { generateWaypointId, waypointsEqual } from './shared/waypoints';

const meta: Meta = {
  title: 'Components/Edges/CanvasEdge',
  parameters: { layout: 'fullscreen' },
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
 * Interactive demo. Editable edges set `enableEditing: true`. Hover an edge
 * to surface segment drag handles, double-click a segment to add a waypoint,
 * drag waypoints to move them, double-click a waypoint to remove it.
 */
function InteractiveStory() {
  const initialNodes = useMemo(
    () => [
      createNode({ id: 'a1', label: 'A1', x: 100, y: 100, sourcePositions: [Position.Right] }),
      createNode({ id: 'b1', label: 'B1', x: 400, y: 100, targetPositions: [Position.Left] }),

      createNode({ id: 'a2', label: 'A2', x: 100, y: 200, sourcePositions: [Position.Right] }),
      createNode({ id: 'b2', label: 'B2', x: 400, y: 300, targetPositions: [Position.Left] }),

      createNode({ id: 'c1', label: 'C1', x: 100, y: 450, sourcePositions: [Position.Right] }),
      createNode({ id: 'd1', label: 'D1', x: 400, y: 550, targetPositions: [Position.Left] }),

      createNode({ id: 'e1', label: 'Solid', x: 550, y: 100, sourcePositions: [Position.Right] }),
      createNode({ id: 'f1', label: 'Target', x: 850, y: 100, targetPositions: [Position.Left] }),

      createNode({ id: 'e2', label: 'Dashed', x: 550, y: 200, sourcePositions: [Position.Right] }),
      createNode({ id: 'f2', label: 'Target', x: 850, y: 200, targetPositions: [Position.Left] }),

      createNode({ id: 'e3', label: 'Invalid', x: 550, y: 300, sourcePositions: [Position.Right] }),
      createNode({ id: 'f3', label: 'Target', x: 850, y: 300, targetPositions: [Position.Left] }),

      createNode({
        id: 'e4',
        label: 'No Arrow',
        x: 550,
        y: 400,
        sourcePositions: [Position.Right],
      }),
      createNode({ id: 'f4', label: 'Target', x: 850, y: 400, targetPositions: [Position.Left] }),
    ],
    []
  );

  const presetWaypoints: Waypoint[] = [
    { id: 'wp-1', x: 300, y: 498 },
    { id: 'wp-2', x: 300, y: 598 },
  ];

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e1',
        source: 'a1',
        target: 'b1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true },
      },
      {
        id: 'e2',
        source: 'a2',
        target: 'b2',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true },
      },
      {
        id: 'e3',
        source: 'c1',
        target: 'd1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true, waypoints: presetWaypoints },
      },
      {
        id: 'e4',
        source: 'e1',
        target: 'f1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true, strokeStyle: 'solid' },
      },
      {
        id: 'e5',
        source: 'e2',
        target: 'f2',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true, strokeStyle: 'dashed' },
      },
      {
        id: 'e6',
        source: 'e3',
        target: 'f3',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true, isInvalid: true },
      },
      {
        id: 'e7',
        source: 'e4',
        target: 'f4',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true, hideArrowHead: true },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const Default: Story = {
  render: () => <InteractiveStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Single edge type with composed behaviors. Edges with `enableEditing: true` expose waypoint editing; visual variants (solid/dashed/invalid/no-arrow) render the same way regardless of editing state.',
      },
    },
  },
};

/**
 * Same edges with editing turned OFF. Visual rendering is identical;
 * waypoint handles and segment drag affordances are absent.
 */
function ReadOnlyStory() {
  const initialNodes = useMemo(
    () => [
      createNode({ id: 'a1', label: 'A1', x: 100, y: 100, sourcePositions: [Position.Right] }),
      createNode({ id: 'b1', label: 'B1', x: 400, y: 100, targetPositions: [Position.Left] }),
      createNode({ id: 'c1', label: 'C1', x: 100, y: 250, sourcePositions: [Position.Right] }),
      createNode({ id: 'd1', label: 'D1', x: 400, y: 350, targetPositions: [Position.Left] }),
    ],
    []
  );

  const presetWaypoints: Waypoint[] = [
    { id: 'wp-1', x: 250, y: 298 },
    { id: 'wp-2', x: 250, y: 398 },
  ];

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e1',
        source: 'a1',
        target: 'b1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: {},
      },
      {
        id: 'e2',
        source: 'c1',
        target: 'd1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { waypoints: presetWaypoints },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const NonEditable: Story = {
  render: () => <ReadOnlyStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Edges without `enableEditing` render the same path but expose no editing affordances.',
      },
    },
  },
};

/**
 * Handle routing + execution + toolbar — the workflow use case. This is what
 * `SequenceEdge` ships as a preset, expressed directly with CanvasEdge flags.
 */
function HandleRoutingStory() {
  const initialNodes = useMemo(
    () => [
      createNode({ id: 'a1', label: 'Start', x: 100, y: 100, sourcePositions: [Position.Right] }),
      createNode({
        id: 'b1',
        label: 'Step',
        x: 400,
        y: 100,
        sourcePositions: [Position.Right],
        targetPositions: [Position.Left],
      }),
      createNode({ id: 'c1', label: 'End', x: 700, y: 100, targetPositions: [Position.Left] }),
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
        data: { routing: 'handle', enableExecution: true, enableToolbar: true, label: 'Run' },
      },
      {
        id: 'e2',
        source: 'b1',
        target: 'c1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { routing: 'handle', enableExecution: true, enableToolbar: true },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const HandleRouting: Story = {
  render: () => <HandleRoutingStory />,
  parameters: {
    docs: {
      description: {
        story:
          'CanvasEdge with `routing: "handle"`, `enableExecution: true`, `enableToolbar: true`. This is the workflow preset that `SequenceEdge` wraps.',
      },
    },
  },
};

/**
 * The full composition: waypoint editing + add-node toolbar on the same edge.
 * Hover an edge to see both affordances at once — segment drag handles and
 * waypoint dots from the editor, plus the add-node "+" button from the
 * toolbar that follows the cursor along the path.
 */
function EditingPlusToolbarStory() {
  const initialNodes = useMemo(
    () => [
      createNode({ id: 'a1', label: 'A1', x: 100, y: 100, sourcePositions: [Position.Right] }),
      createNode({ id: 'b1', label: 'B1', x: 500, y: 100, targetPositions: [Position.Left] }),

      createNode({ id: 'a2', label: 'A2', x: 100, y: 280, sourcePositions: [Position.Right] }),
      createNode({ id: 'b2', label: 'B2', x: 500, y: 380, targetPositions: [Position.Left] }),

      createNode({ id: 'a3', label: 'A3', x: 100, y: 520, sourcePositions: [Position.Right] }),
      createNode({ id: 'b3', label: 'B3', x: 500, y: 620, targetPositions: [Position.Left] }),
    ],
    []
  );

  const presetWaypointsA: Waypoint[] = [
    { id: 'wp-a-1', x: 300, y: 328 },
    { id: 'wp-a-2', x: 300, y: 428 },
  ];
  const presetWaypointsB: Waypoint[] = [
    { id: 'wp-b-1', x: 250, y: 568 },
    { id: 'wp-b-2', x: 350, y: 568 },
    { id: 'wp-b-3', x: 350, y: 668 },
  ];

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      // Auto-routed, editing + toolbar both enabled
      {
        id: 'e1',
        source: 'a1',
        target: 'b1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true, enableToolbar: true, label: 'Edit + Toolbar' },
      },
      // With existing waypoints — drag segments OR use toolbar to add a node
      {
        id: 'e2',
        source: 'a2',
        target: 'b2',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: {
          enableEditing: true,
          enableToolbar: true,
          waypoints: presetWaypointsA,
        },
      },
      // Multi-segment path — full composition
      {
        id: 'e3',
        source: 'a3',
        target: 'b3',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: {
          enableEditing: true,
          enableToolbar: true,
          enableExecution: true,
          waypoints: presetWaypointsB,
          label: 'All three',
        },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

/**
 * Controlled mode — `onWaypointsChange` lets the consumer intercept every
 * waypoint update. The consumer still has to push the new value back into
 * React Flow's edge state (same pattern as React's controlled `<input>`)
 * — the callback alone doesn't move the line. This story records each
 * change in a history stack and supports undo.
 */
function ControlledStory() {
  const initialNodes = useMemo(
    () => [
      createNode({ id: 'a1', label: 'A', x: 100, y: 200, sourcePositions: [Position.Right] }),
      createNode({ id: 'b1', label: 'B', x: 600, y: 300, targetPositions: [Position.Left] }),
    ],
    []
  );

  const initialWaypoints: Waypoint[] = useMemo(
    () => [
      { id: 'wp-1', x: 350, y: 248 },
      { id: 'wp-2', x: 350, y: 348 },
    ],
    []
  );

  // History seeded with the initial state so undo is a no-op until the first
  // change; `history.length - 1` reads as "user-driven changes so far".
  const [history, setHistory] = useState<Waypoint[][]>([initialWaypoints]);

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'e1',
        source: 'a1',
        target: 'b1',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableEditing: true, waypoints: initialWaypoints },
      },
    ],
    [initialWaypoints]
  );

  const { canvasProps, edges, setEdges } = useCanvasStory({ initialNodes, initialEdges });

  const handleChange = useCallback(
    (next: Waypoint[]) => {
      setHistory((h) => (waypointsEqual(h.at(-1) ?? [], next) ? h : [...h, next]));
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === 'e1' ? { ...edge, data: { ...edge.data, waypoints: next } } : edge
        )
      );
    },
    [setEdges]
  );

  // The callback lives on `data` because React Flow only forwards `data` to
  // custom edge components — there's no `onChange` prop slot. Re-injecting
  // each render keeps the closure pointing at fresh state.
  const edgesWithCallback = useMemo(
    () =>
      edges.map((edge) =>
        edge.id === 'e1'
          ? { ...edge, data: { ...edge.data, onWaypointsChange: handleChange } }
          : edge
      ),
    [edges, handleChange]
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const next = h.slice(0, -1);
      const prev = next.at(-1) ?? [];
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === 'e1' ? { ...edge, data: { ...edge.data, waypoints: prev } } : edge
        )
      );
      return next;
    });
  }, [setEdges]);

  const currentWaypoints = history.at(-1) ?? [];

  return (
    <>
      <BaseCanvas {...canvasProps} edges={edgesWithCallback} edgeTypes={edgeTypes} mode="design" />
      <StoryInfoPanel title="Controlled waypoints" description={`${history.length - 1} change(s)`}>
        <button
          type="button"
          onClick={undo}
          disabled={history.length <= 1}
          style={{ marginTop: 8, marginBottom: 8 }}
        >
          Undo
        </button>
        <pre
          style={{
            margin: 0,
            fontSize: 11,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            color: 'var(--canvas-foreground)',
          }}
        >
          {JSON.stringify(currentWaypoints, null, 2)}
        </pre>
      </StoryInfoPanel>
    </>
  );
}

export const Controlled: Story = {
  render: () => <ControlledStory />,
  parameters: {
    docs: {
      description: {
        story:
          "`onWaypointsChange` lets the consumer intercept every waypoint update before it lands in React Flow state. **The callback alone does NOT move the edge** — the consumer must call `setEdges` themselves with the new value, mirroring React's controlled-input pattern. This story records each change in a history stack and demonstrates undo.",
      },
    },
  },
};

export const EditingPlusToolbar: Story = {
  render: () => <EditingPlusToolbarStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Waypoint editing AND add-node toolbar on the same edge. Hover to surface both affordances — drag segments/waypoints to reshape the path, or use the add-node button to insert a node along it. The third edge layers execution status on top, demonstrating full behavior composition.',
      },
    },
  },
};

/**
 * Distinctive "shelf" router — every edge takes a 90° detour through a
 * horizontal highway at y=600. The shape is intentionally not what the
 * built-in auto-router would produce, so it's visually obvious that the
 * pluggable router is in effect.
 *
 * Drag a segment on a routed edge: the routed waypoints materialize into
 * `data.waypoints` and the edge becomes manual — user intent overrides the
 * router from that point on.
 */
const shelfRouter: EdgeRouter = {
  route(req: RouteRequest): RoutedEdge[] {
    const HIGHWAY_Y = 600;
    return req.edges.map((edge) => ({
      edgeId: edge.edgeId,
      waypoints: [
        { id: generateWaypointId(), x: edge.source.x + 32, y: edge.source.y },
        { id: generateWaypointId(), x: edge.source.x + 32, y: HIGHWAY_Y },
        { id: generateWaypointId(), x: edge.target.x - 32, y: HIGHWAY_Y },
        { id: generateWaypointId(), x: edge.target.x - 32, y: edge.target.y },
      ],
    }));
  },
};

function PluggableRouterStory() {
  const initialNodes = useMemo(
    () => [
      createNode({ id: 'a1', label: 'A1', x: 100, y: 100, sourcePositions: [Position.Right] }),
      createNode({ id: 'b1', label: 'B1', x: 600, y: 100, targetPositions: [Position.Left] }),

      createNode({ id: 'a2', label: 'A2', x: 100, y: 250, sourcePositions: [Position.Right] }),
      createNode({ id: 'b2', label: 'B2', x: 600, y: 250, targetPositions: [Position.Left] }),

      createNode({ id: 'a3', label: 'A3', x: 100, y: 400, sourcePositions: [Position.Right] }),
      createNode({ id: 'b3', label: 'B3', x: 600, y: 400, targetPositions: [Position.Left] }),
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
        // routing: 'waypoint' is the explicit opt-in useGraphRouter requires —
        // undeclared edges are never router-fed (or polluted with routedWaypoints)
        data: { routing: 'waypoint', enableEditing: true },
      },
      {
        id: 'e2',
        source: 'a2',
        target: 'b2',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { routing: 'waypoint', enableEditing: true },
      },
      {
        id: 'e3',
        source: 'a3',
        target: 'b3',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { routing: 'waypoint', enableEditing: true },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  useGraphRouter(shelfRouter);

  return (
    <>
      <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />
      <StoryInfoPanel
        title="Pluggable router"
        description="A custom EdgeRouter routes every edge through y=600. Drag a segment to override — that edge becomes manual."
      />
    </>
  );
}

export const PluggableRouter: Story = {
  render: () => <PluggableRouterStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the `EdgeRouter` contract. The story wires up `useGraphRouter(shelfRouter)`, a custom router that forces every edge through a distinctive y=600 horizontal highway. Drag any segment to override — manual waypoints take priority over routed output, so the user can always escape the router.',
      },
    },
  },
};

/** One row per execution status worth distinguishing visually. `None` and
 * `Terminated`/`UserCancelled` reuse colors already shown, so they're omitted. */
const EXECUTION_STATES = [
  ElementStatusValues.InProgress,
  ElementStatusValues.Completed,
  ElementStatusValues.Failed,
  ElementStatusValues.Paused,
  ElementStatusValues.ActionNeeded,
  ElementStatusValues.Cancelled,
  ElementStatusValues.Warning,
  ElementStatusValues.NotExecuted,
] as const;

/**
 * Execution states on CanvasEdge. `enableExecution: true` subscribes the edge
 * to execution + validation status, which drives the stroke color and — for
 * `InProgress` — a dot animating along the path. The storybook providers
 * resolve status from the edge id (`edge-<Status>`), standing in for a host
 * app supplying real state through `ExecutionStatusContext`.
 */
function ExecutionStatesStory() {
  // One Start → Step → End chain per status, mirroring the HandleRouting
  // story's layout. The middle node carries the status — both in its label
  // and in its own execution state (the storybook provider reads it from id
  // segment [1], `mid-<Status>`), so node and edges show one coherent state.
  const initialNodes = useMemo(
    () =>
      EXECUTION_STATES.flatMap((status, i) => {
        const y = 100 + i * 160;
        return [
          createNode({
            id: `src${i}`,
            label: 'Start',
            x: 100,
            y,
            sourcePositions: [Position.Right],
          }),
          createNode({
            id: `mid-${status}`,
            label: status,
            x: 400,
            y,
            sourcePositions: [Position.Right],
            targetPositions: [Position.Left],
          }),
          createNode({ id: `tgt${i}`, label: 'End', x: 700, y, targetPositions: [Position.Left] }),
        ];
      }),
    []
  );

  // The storybook execution provider reads the status from id segment [1]
  // (`edge-<Status>-…`), so both edges in a row resolve to the same state.
  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () =>
      EXECUTION_STATES.flatMap((status, i) => [
        {
          id: `edge-${status}-in`,
          source: `src${i}`,
          target: `mid-${status}`,
          sourceHandle: `out-${Position.Right}`,
          targetHandle: `in-${Position.Left}`,
          type: 'canvas-edge',
          data: { enableExecution: true, enableEditing: true },
        },
        {
          id: `edge-${status}-out`,
          source: `mid-${status}`,
          target: `tgt${i}`,
          sourceHandle: `out-${Position.Right}`,
          targetHandle: `in-${Position.Left}`,
          type: 'canvas-edge',
          data: { enableExecution: true, enableEditing: true },
        },
      ]),
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const ExecutionStates: Story = {
  render: () => <ExecutionStatesStory />,
  parameters: {
    docs: {
      description: {
        story:
          "Each Start → Step → End chain shows one execution state: the middle node carries the status (its label and its own node execution state), and both edges set `enableExecution: true`, coloring their stroke to match and animating a traveling dot while `InProgress`. Edges also set `enableEditing: true` to show the behaviors compose — hover an edge to drag segments or double-click to add waypoints. Status is mocked from element ids (`edge-<Status>-…`, `mid-<Status>`); host apps provide it via `ExecutionStatusContext`. Selection and hover intentionally override status colors (see `resolveEdgeColor` priority). The same flags work with `routing: 'handle'` — that combination is the `SequenceEdge` preset shown in HandleRouting.",
      },
    },
  },
};

// ============================================================================
// Line Jumps Page
// ============================================================================

const JUMP_RADIUS = EDGE_CONSTANTS.LINE_JUMP_RADIUS;

/**
 * Three horizontal edges run under two vertical ones, so every row crosses
 * every lane. Dragging a node keeps the crossings live, which is the point of
 * deriving jumps from the rendered polylines rather than baking them in.
 */
function LineJumpsCanvas() {
  const initialNodes = useMemo(() => {
    // Rows are node y positions; lanes are node x positions. Each vertical
    // edge runs through its lane node's center, crossing all three rows. The
    // grid is sized to sit beside the info panel at 1:1, so the arcs render at
    // the size a real canvas draws them rather than a zoomed-in approximation.
    const rows = [40, 160, 280];
    const lanes = [280, 520];
    return [
      ...rows.flatMap((y, i) => [
        createNode({
          id: `h${i}-src`,
          label: `Row ${i + 1}`,
          x: 40,
          y,
          sourcePositions: [Position.Right],
        }),
        createNode({
          id: `h${i}-tgt`,
          label: 'Target',
          x: 640,
          y,
          targetPositions: [Position.Left],
        }),
      ]),
      ...lanes.flatMap((x, i) => [
        createNode({
          id: `v${i}-src`,
          label: `Lane ${i + 1}`,
          x,
          y: -80,
          sourcePositions: [Position.Bottom],
        }),
        createNode({
          id: `v${i}-tgt`,
          label: 'Target',
          x,
          y: 360,
          targetPositions: [Position.Top],
        }),
      ]),
    ];
  }, []);

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      ...[0, 1, 2].map((i) => ({
        id: `h${i}`,
        source: `h${i}-src`,
        target: `h${i}-tgt`,
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { enableLineJumps: true, enableEditing: true },
      })),
      ...[0, 1].map((i) => ({
        id: `v${i}`,
        source: `v${i}-src`,
        target: `v${i}-tgt`,
        sourceHandle: `out-${Position.Bottom}`,
        targetHandle: `in-${Position.Top}`,
        type: 'canvas-edge',
        data: { enableLineJumps: true, enableEditing: true },
      })),
    ],
    []
  );

  const { canvasProps, setEdges } = useCanvasStory({ initialNodes, initialEdges });
  const [enabled, setEnabled] = useState(true);

  const toggle = useCallback(
    (next: boolean) => {
      setEnabled(next);
      setEdges((eds) =>
        eds.map((edge) => ({ ...edge, data: { ...edge.data, enableLineJumps: next } }))
      );
    },
    [setEdges]
  );

  return (
    <BaseCanvas
      {...canvasProps}
      edgeTypes={edgeTypes}
      mode="design"
      defaultViewport={{ x: 360, y: 140, zoom: 1 }}
    >
      <StoryInfoPanel
        title="Line jumps"
        description={enabled ? 'Crossings arc over' : 'Crossings drawn flat'}
      >
        <div className="mt-3 flex items-center gap-2">
          <Switch id="line-jumps-toggle" checked={enabled} onCheckedChange={toggle} />
          <Label htmlFor="line-jumps-toggle" className="text-xs">
            enableLineJumps
          </Label>
        </div>
      </StoryInfoPanel>
    </BaseCanvas>
  );
}

/** Schematic frame for the crossing diagrams, sized to the anatomy card slot. */
function Diagram({
  children,
  width = 168,
  height = 92,
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** The edge that hops. */
const HOP = 'text-primary';
/** The edge that is hopped over, and any other supporting geometry. */
const UNDER = 'text-muted-foreground';

function AnnotatedJump() {
  return (
    <svg
      viewBox="0 0 420 170"
      className="h-auto w-full max-w-[420px]"
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* The crossing edge, drawn straight through */}
      <path d="M 210 32 L 210 150" className={UNDER} stroke="currentColor" strokeWidth="2" />
      {/* The hopping edge, arcing over it. Radius is exaggerated for legibility. */}
      <path
        d="M 30 96 L 188 96 A 22 22 0 0 1 232 96 L 390 96"
        className={HOP}
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Radius, drawn under the arc where neither edge is stroked */}
      <path
        d="M 188 96 L 210 96"
        className={UNDER}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle cx="188" cy="96" r="3" className={HOP} fill="currentColor" />
      <circle cx="232" cy="96" r="3" className={HOP} fill="currentColor" />

      {/* Leaders out to the entry and exit labels, clear of the crossing edge */}
      <g className={UNDER} stroke="currentColor" strokeWidth="1">
        <path d="M 186 102 L 140 126" />
        <path d="M 234 102 L 280 126" />
      </g>

      <g className="fill-current text-[11px] text-muted-foreground">
        <text x="132" y="140" textAnchor="middle">
          entry
        </text>
        <text x="288" y="140" textAnchor="middle">
          exit
        </text>
        <text x="197" y="90" textAnchor="middle">
          r
        </text>
        <text x="210" y="22" textAnchor="middle">
          crossing edge, drawn through
        </text>
        <text x="30" y="86">
          hopping edge
        </text>
      </g>
    </svg>
  );
}

const crossingCases = [
  {
    title: 'Crossing',
    outcome: 'Arc',
    description:
      'The intersection falls strictly inside both segments, so the horizontal one hops over.',
    diagram: (
      <Diagram>
        <path d="M 84 12 L 84 80" className={UNDER} stroke="currentColor" />
        <path
          d="M 16 46 L 74 46 A 10 10 0 0 1 94 46 L 152 46"
          className={HOP}
          stroke="currentColor"
        />
      </Diagram>
    ),
  },
  {
    title: 'T-junction',
    outcome: 'Flat',
    description:
      'One line ends on the other rather than passing through it. That reads as a join, so nothing is drawn over it.',
    diagram: (
      <Diagram>
        <path d="M 84 12 L 84 46" className={UNDER} stroke="currentColor" />
        <path d="M 16 46 L 152 46" className={HOP} stroke="currentColor" />
      </Diagram>
    ),
  },
  {
    title: 'Shared handle',
    outcome: 'Flat',
    description:
      'Two edges fanning out of one handle touch at their ends. Arcing there would suggest they are unrelated.',
    diagram: (
      <Diagram>
        {/* Both leave the same point, then branch at different x so the pair reads as two edges */}
        <path d="M 14 46 L 62 46 L 62 14" className={UNDER} stroke="currentColor" />
        <path d="M 14 46 L 104 46 L 104 80" className={HOP} stroke="currentColor" />
        <circle cx="14" cy="46" r="3.5" className={HOP} fill="currentColor" stroke="none" />
      </Diagram>
    ),
  },
  {
    title: 'Shared lane',
    outcome: 'Flat',
    description:
      'Collinear edges overlap rather than cross. There is no over and under to communicate.',
    diagram: (
      <Diagram>
        <path d="M 16 46 L 120 46" className={UNDER} stroke="currentColor" />
        <path d="M 48 46 L 152 46" className={HOP} stroke="currentColor" strokeDasharray="6 5" />
      </Diagram>
    ),
  },
] as const;

const dropCases = [
  {
    title: 'Inside a corner',
    description:
      'A crossing within one radius of a bend has no straight run to sit on. The arc would deform the corner curve, so the line stays flat through it.',
    diagram: (
      <Diagram>
        <path d="M 120 10 L 120 60" className={UNDER} stroke="currentColor" />
        <path d="M 16 30 L 112 30 Q 126 30 126 44 L 126 82" className={HOP} stroke="currentColor" />
        <circle
          cx="120"
          cy="30"
          r="12"
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </Diagram>
    ),
  },
  {
    title: 'Too close together',
    description:
      'Crossings nearer than one arc width would scallop the line instead of notching it, so only the first of the cluster is drawn.',
    diagram: (
      <Diagram>
        <path d="M 78 12 L 78 80" className={UNDER} stroke="currentColor" />
        <path d="M 92 12 L 92 80" className={UNDER} stroke="currentColor" />
        <path
          d="M 16 46 L 68 46 A 10 10 0 0 1 88 46 L 152 46"
          className={HOP}
          stroke="currentColor"
        />
      </Diagram>
    ),
  },
] as const;

type CrossingRuleRow = {
  situation: string;
  drawn: string;
  reason: string;
};

const crossingRuleRows: readonly CrossingRuleRow[] = [
  {
    situation: 'Horizontal crosses vertical',
    drawn: 'Arc on the horizontal',
    reason: 'Orientation alone decides, so the pattern holds still while nodes move.',
  },
  {
    situation: 'Vertical crosses horizontal',
    drawn: 'Straight through',
    reason: 'Only one side of a crossing may hop, otherwise both lines break.',
  },
  {
    situation: 'One line ends on another',
    drawn: 'Flat',
    reason: 'The intersection must be strictly interior to both segments.',
  },
  {
    situation: 'Edges share a handle',
    drawn: 'Flat',
    reason: 'They meet at a segment end, which reads as a join.',
  },
  {
    situation: 'Edges share a lane',
    drawn: 'Flat',
    reason: 'Collinear overlap is not a crossing.',
  },
  {
    situation: 'An edge crosses itself',
    drawn: 'Flat',
    reason: 'One path passing over its own elbow reads as a knot, not a crossing.',
  },
  {
    situation: 'Several edges stacked on one lane',
    drawn: 'One arc',
    reason: 'Identical crossings would otherwise stack arcs on the same spot.',
  },
  {
    situation: 'The other edge has not opted in',
    drawn: 'Flat',
    reason: 'Only edges that set the flag publish geometry, so set it uniformly.',
  },
];

const crossingRuleColumns: readonly StorySpecColumn<CrossingRuleRow>[] = [
  { key: 'situation', header: 'Situation', variant: 'strong' },
  { key: 'drawn', header: 'What is drawn' },
  { key: 'reason', header: 'Why' },
];

function LineJumpsPage({ globalTheme }: { globalTheme: string }) {
  return (
    <StoryPage
      theme={globalTheme}
      title="Line Jumps"
      description={
        <>
          Where two edges cross, the horizontal one hops over the vertical with a small arc instead
          of drawing straight through it, so the crossing reads as a pass-over rather than a join.
          Edges opt in with <StoryCode>enableLineJumps</StoryCode> and the jumps are derived from
          the rendered geometry, so they track node drags and waypoint edits live. Waypoint routing
          only.
        </>
      }
    >
      <StoryPreview
        height={700}
        description={
          <>
            <p>
              Three rows crossing two lanes. Every crossing sits on a horizontal segment, so every
              arc lands on a row edge while the lane edges run unbroken.
            </p>
            <p>
              Toggle the flag to compare against flat crossings, and drag any node to watch the
              notches follow.
            </p>
          </>
        }
      >
        <LineJumpsCanvas />
      </StoryPreview>

      <StorySection
        title="Anatomy"
        description={
          <>
            A jump replaces a stretch of the straight run with a half-circle of{' '}
            <StoryCode>{`EDGE_CONSTANTS.LINE_JUMP_RADIUS`}</StoryCode> ({JUMP_RADIUS}px). The arc
            enters one radius before the crossing and leaves one radius after it, and always bulges
            to the same side whichever way the line runs.
          </>
        }
      >
        <div className="mb-8 flex justify-center rounded-xl border border-border bg-card py-6">
          <AnnotatedJump />
        </div>

        <h3 className="mb-2 text-base font-semibold text-foreground">What counts as a crossing</h3>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Two lines have to genuinely pass over one another. Lines that merely meet keep their flat
          intersection, so a notch always means the paths are unrelated.
        </p>
        <div className="mb-8 grid grid-cols-2 gap-4">
          {crossingCases.map((item) => (
            <StoryCard
              key={item.title}
              preview={item.diagram}
              title={item.title}
              code={item.outcome}
              description={item.description}
            />
          ))}
        </div>

        <StorySpecTable columns={crossingRuleColumns} rows={crossingRuleRows} />
      </StorySection>

      <StorySection
        title="When a jump is dropped"
        description="A crossing that has nowhere clean to sit is drawn flat rather than approximated. Dense stretches degrade to fewer notches instead of a rippled line."
      >
        <div className="grid grid-cols-2 gap-4">
          {dropCases.map((item) => (
            <StoryCard
              key={item.title}
              preview={item.diagram}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </StorySection>

      <StorySection
        title="How to use"
        description={
          <>
            <p>
              Set <StoryCode>enableLineJumps</StoryCode> on the edge data. Because both sides of a
              crossing have to opt in, apply it across the whole graph rather than to single edges:{' '}
              <StoryCode>defaultEdgeOptions</StoryCode> is the least error-prone place.
            </p>
            <p>
              The store that collects the geometry is mounted by <StoryCode>BaseCanvas</StoryCode>.
              A canvas assembled by hand needs <StoryCode>EdgeCrossingsProvider</StoryCode> above
              its edges, otherwise the flag is inert and every crossing draws flat.
            </p>
          </>
        }
      >
        <StoryCodeBlock>
          {`// Whole graph (recommended): every edge participates
<BaseCanvas
  defaultEdgeOptions={{
    type: 'canvas-edge',
    data: { enableLineJumps: true },
  }}
/>

// Per edge, when only part of a graph should hop
const edge: Edge<CanvasEdgeData> = {
  id: 'e1',
  source: 'a',
  target: 'b',
  type: 'canvas-edge',
  data: { enableLineJumps: true },
};`}
        </StoryCodeBlock>
      </StorySection>
    </StoryPage>
  );
}

export const LineJumps: Story = {
  name: 'Line Jumps',
  render: (_, { globals }) => <LineJumpsPage globalTheme={globals.theme || 'future-dark'} />,
};
