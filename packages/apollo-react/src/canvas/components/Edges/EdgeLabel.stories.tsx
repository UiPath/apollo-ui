/**
 * Edge Label Stories
 *
 * Reference page for `data.label` on CanvasEdge (and the SequenceEdge preset,
 * which composes CanvasEdge under the hood): orientation, diff states, and
 * the crossing-edge stacking behavior.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position, ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type { CSSProperties } from 'react';
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
          "Set `data.label` on a CanvasEdge (or SequenceEdge) to render a label at the midpoint of the path. The label portals through `EdgeLabelRenderer`, so it always paints after every edge's own line, and falls back to `--color-background` when a host does not theme its ancestor with one of the canvas theme classes. Labels are decorative: `pointer-events: none`, no hover state, not clickable.",
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
 * Small two-node/one-edge canvas used to compare the label across themes and
 * fallback scenarios. Each instance gets its own `ReactFlowProvider` so
 * several can sit side by side on one page.
 */
function MiniLabeledEdgeCanvas({ label = 'Success' }: { label?: string }) {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'mini-source',
        label: 'Source',
        x: 10,
        y: 50,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'mini-target',
        label: 'Target',
        x: 195,
        y: 50,
        targetPositions: [Position.Left],
      }),
    ],
    []
  );

  const initialEdges: Edge<CanvasEdgeData>[] = useMemo(
    () => [
      {
        id: 'mini-edge',
        source: 'mini-source',
        target: 'mini-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { label },
      },
    ],
    [label]
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
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
 * stroke color via `resolveEdgeColor`; the label renders unaffected.
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
          'Labels alongside diff styling. isDiffAdded and isDiffRemoved color the stroke, the label renders the same either way.',
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
          "Two labeled edges routed through the same center point. Both labels stay legible on top of the crossing line, regardless of array order. Before the EdgeLabelRenderer fix, whichever edge was later in the array could paint its line over the other edge's label.",
      },
    },
  },
};

/**
 * The same labeled edge under every canvas theme. Each cell forces its theme
 * class on a wrapping div (the same selectors variables.css matches on
 * `body.<theme>`), independent of the global Storybook theme toolbar, so all
 * nine render simultaneously for comparison.
 */
const THEME_CLASSES = [
  'light',
  'dark',
  'light-hc',
  'dark-hc',
  'future-light',
  'future-dark',
  'wireframe',
  'vertex',
  'canvas',
] as const;

function ThemesStory() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridAutoRows: '220px',
        gap: 16,
        padding: 16,
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {THEME_CLASSES.map((theme) => (
        <div
          key={theme}
          className={theme}
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(128, 128, 128, 0.3)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 12, opacity: 0.7, flex: '0 0 auto' }}>
            {theme}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ReactFlowProvider>
              <MiniLabeledEdgeCanvas />
            </ReactFlowProvider>
          </div>
        </div>
      ))}
    </div>
  );
}

export const Themes: Story = {
  render: () => <ThemesStory />,
  parameters: {
    docs: {
      description: {
        story:
          "The same labeled edge rendered under all nine canvas themes at once, to compare label contrast against each theme's background and border colors.",
      },
    },
  },
};

/**
 * Simulates a host that does not theme its canvas ancestor. `--canvas-background`
 * and `--color-background` are set to `initial` (the CSS-spec guaranteed-invalid
 * value) on a wrapping div, which is what actually happens when a host mounts
 * the canvas outside any `body.<theme>` / `.future-*` / `.vertex` / `.canvas`
 * ancestor (for example, a shadow-DOM host). Column 2 shows the fix's fallback
 * resolving; column 3 is the known remaining gap: when neither variable
 * resolves, the label background is transparent.
 */
function MissingThemeFallbackStory() {
  const columnStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
  };
  const canvasBoxStyle: CSSProperties = {
    flex: 1,
    border: '1px solid rgba(128, 128, 128, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, height: '100%', boxSizing: 'border-box' }}>
      <div style={columnStyle}>
        <p style={{ fontSize: 13, margin: 0 }}>
          Normal: the theme ancestor provides --canvas-background.
        </p>
        <div style={canvasBoxStyle}>
          <ReactFlowProvider>
            <MiniLabeledEdgeCanvas label="Resolved" />
          </ReactFlowProvider>
        </div>
      </div>
      <div style={{ ...columnStyle, '--canvas-background': 'initial' } as CSSProperties}>
        <p style={{ fontSize: 13, margin: 0 }}>
          --canvas-background unset (variables.css not imported): falls back to --color-background.
        </p>
        <div style={canvasBoxStyle}>
          <ReactFlowProvider>
            <MiniLabeledEdgeCanvas label="Fallback" />
          </ReactFlowProvider>
        </div>
      </div>
      <div
        style={
          {
            ...columnStyle,
            '--canvas-background': 'initial',
            '--color-background': 'initial',
          } as CSSProperties
        }
      >
        <p style={{ fontSize: 13, margin: 0 }}>
          Both unset, no themed ancestor at all: background is transparent. Known gap, not covered
          by the current fallback chain.
        </p>
        <div style={canvasBoxStyle}>
          <ReactFlowProvider>
            <MiniLabeledEdgeCanvas label="Transparent" />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export const MissingThemeFallback: Story = {
  render: () => <MissingThemeFallbackStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a host that never themes the canvas ancestor (e.g. a shadow-DOM host, or an app that forgot to theme body). Demonstrates the fallback chain added in EdgeLabel.tsx, and documents the remaining gap when neither variable resolves.',
      },
    },
  },
};

/**
 * Two known-limitation cases. The label is `whitespace-nowrap` with no
 * truncation, so long text simply overflows; and a short edge with close
 * nodes crowds the label against both node bodies.
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
          'Long label text overflows since the label has no truncation, and a short edge with close nodes crowds the label against both node bodies. Neither case is currently guarded against.',
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
 * Label rendering in readonly mode. Visually identical to design mode; no
 * editing chrome is available regardless.
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
        story: 'Label rendering in readonly mode, for edges representing a completed workflow run.',
      },
    },
  },
};

/**
 * Open question for review, not resolved here. Node labels support
 * double-click-to-edit (see BaseNode's NodeLabel and its EditableLabel
 * sub-component), but edge labels are pure display: EdgeLabel is
 * `pointer-events: none` and CanvasEdgeData has no `onLabelChange` field,
 * so there is no way to rename this label from the canvas. Click it; the
 * click passes straight through to the edge underneath and selects the
 * whole edge instead, since the label has no hit target of its own. Any
 * editing solution has to decide that click behavior too: enabling
 * pointer events on the label changes what clicking it does today.
 */
function NoInlineEditingStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: 'edit-source',
        label: 'Source',
        x: 100,
        y: 120,
        sourcePositions: [Position.Right],
      }),
      createNode({
        id: 'edit-target',
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
        id: 'e-not-editable',
        source: 'edit-source',
        target: 'edit-target',
        sourceHandle: `out-${Position.Right}`,
        targetHandle: `in-${Position.Left}`,
        type: 'canvas-edge',
        data: { label: 'Try clicking me' },
      },
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });
  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
}

export const NoInlineEditing: Story = {
  render: () => <NoInlineEditingStory />,
  parameters: {
    docs: {
      description: {
        story:
          "Open question for review: node labels support double-click-to-edit (BaseNode/NodeLabel's EditableLabel), but edge labels do not. EdgeLabel is pointer-events: none and CanvasEdgeData has no onLabelChange field. Click this label: the click passes through to the edge underneath and selects the whole edge instead, since the label isn't a hit target itself, the same root cause as the missing editing support. Enabling pointer events on the label to support editing also changes what clicking it does today, so the two questions have to be decided together.\n\nTwo paths forward. Path A, keep labels as pure display: clicking continues to select the edge, labels stay a rendered property of the edge rather than a directly editable element, no new interaction model or engineering risk, but renaming a label still requires going through whatever set data.label upstream (host app UI, not the canvas itself). Path B, add inline editing for parity with node labels: needs an onLabelChange callback on CanvasEdgeData, pointer-events: auto on the label (likely gated on a handler being provided, so consumers who don't opt in see no behavior change), an explicit decision on click semantics (does a single click still select the edge, does double-click enter edit mode like NodeLabel does), an inline textarea reusing that same editing pattern, and handling for empty labels, Escape-to-cancel, and Enter-to-commit.",
      },
    },
  },
};
