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
import { useCallback, useMemo, useState } from 'react';
import {
  createNode as createMockNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import { ElementStatusValues } from '../../types/execution';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasEdge } from './CanvasEdge';
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
