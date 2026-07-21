/**
 * SequentialConnectorEdge stories.
 *
 * Hardcoded bar fixtures (no dependency on the projection engine or the bar
 * node) that exercise the four connector kinds, branch label pills, and the
 * always-visible centered insert affordance.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { SEQ_BAR_HEIGHT, SEQ_BAR_WIDTH } from '../../../constants';
import {
  createNode as createMockNode,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../../../storybook-utils';
import { AddNodeManager } from '../../AddNodePanel';
import { BaseCanvas } from '../../BaseCanvas';
import type { Waypoint } from '../../Edges/shared/types';
import { SequentialConnectorEdge } from './SequentialConnectorEdge';
import type { SequentialConnectorData } from './SequentialConnectorEdge.types';
import { SEQUENTIAL_IGNORED_NODE_TYPES, sequentialOnBeforeNodeAdded } from './sequentialInsert';

const meta: Meta = {
  title: 'Components/SequentialCanvas/SequentialConnectorEdge',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const STORY_BAR_TYPE = 'story-bar';
const edgeTypes = { sequentialConnector: SequentialConnectorEdge };

/** Minimal bar-shaped node used only by these edge stories. */
function StoryBarNode({ data }: NodeProps) {
  const label = (data as { label?: string }).label ?? '';
  return (
    <div className="relative flex h-full w-full items-center gap-3 rounded-2xl border border-border bg-surface-overlay px-4 shadow-(--canvas-node-shadow-rest)">
      <Handle type="target" position={Position.Top} id="in" style={{ opacity: 0 }} />
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Handle type="source" position={Position.Bottom} id="output" style={{ opacity: 0 }} />
    </div>
  );
}

const additionalNodeTypes = { [STORY_BAR_TYPE]: StoryBarNode };

function bar(id: string, label: string, x: number, y: number): Node {
  return {
    id,
    type: STORY_BAR_TYPE,
    position: { x, y },
    width: SEQ_BAR_WIDTH,
    height: SEQ_BAR_HEIGHT,
    draggable: false,
    data: { label },
  };
}

function connector(
  id: string,
  source: string,
  target: string,
  data: SequentialConnectorData
): Edge<SequentialConnectorData> {
  return {
    id,
    source,
    target,
    sourceHandle: 'output',
    targetHandle: 'in',
    type: 'sequentialConnector',
    data,
  };
}

function AllKindsStory() {
  const initialNodes = useMemo(
    () => [
      bar('http', 'HTTP Request', 0, 0),
      bar('decision', 'Decision', 0, 160),
      bar('then', 'Post to Slack', 64, 320),
      bar('else', 'Log warning', 64, 480),
      bar('merge', 'Return result', 0, 672),
    ],
    []
  );

  const mergeWaypoints: Waypoint[] = useMemo(
    () => [
      { id: 'mb-1', x: 512, y: 600 },
      { id: 'mb-2', x: 448, y: 600 },
    ],
    []
  );

  const gotoWaypoints: Waypoint[] = useMemo(
    () => [
      { id: 'gt-1', x: 1000, y: 552 },
      { id: 'gt-2', x: 1000, y: 160 },
    ],
    []
  );

  const initialEdges = useMemo(
    () => [
      connector('e-step', 'http', 'decision', {
        kind: 'step',
        slot: { id: 's-step', graphEdgeId: 'e-step' },
      }),
      connector('e-then', 'decision', 'then', {
        kind: 'branch-entry',
        label: 'Then',
        slot: { id: 's-then', graphEdgeId: 'e-then' },
      }),
      connector('e-else', 'decision', 'else', {
        kind: 'branch-entry',
        label: 'Else',
        slot: { id: 's-else', graphEdgeId: 'e-else' },
      }),
      connector('e-merge', 'then', 'merge', {
        kind: 'merge-back',
        waypoints: mergeWaypoints,
      }),
      connector('e-goto', 'else', 'decision', {
        kind: 'goto',
        waypoints: gotoWaypoints,
      }),
    ],
    [mergeWaypoints, gotoWaypoints]
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges, additionalNodeTypes });

  return (
    <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design">
      <StoryInfoPanel title="Connector kinds">
        Solid step and branch-entry connectors carry an arrow and a centered insert affordance.
        Branch entries add a "Then" or "Else" pill. Dashed merge-back and goto connectors render
        their layout waypoints verbatim and carry no insert affordance.
      </StoryInfoPanel>
    </BaseCanvas>
  );
}

export const AllConnectorKinds: Story = {
  render: () => <AllKindsStory />,
};

function InsertFlowStory() {
  // Real registered manifest nodes so the Add Node panel's constraint filtering
  // (registry.getManifest / getNodeOptions) works end-to-end. Bar visuals are
  // out of scope here; nodes render as the default node so the connector + pipeline are
  // what's under test.
  const initialNodes = useMemo(
    () => [
      createMockNode({
        id: 'a',
        type: 'uipath.blank-node',
        position: { x: 0, y: 0 },
        display: { label: 'HTTP Request' },
        handleConfigurations: [
          {
            position: Position.Bottom,
            handles: [{ id: 'output', type: 'source' as const, handleType: 'output' as const }],
          },
        ],
      }),
      createMockNode({
        id: 'b',
        type: 'uipath.blank-node',
        position: { x: 0, y: 160 },
        display: { label: 'Return result' },
        handleConfigurations: [
          {
            position: Position.Top,
            handles: [{ id: 'in', type: 'target' as const, handleType: 'input' as const }],
          },
        ],
      }),
    ],
    []
  );

  const initialEdges = useMemo(
    () => [
      connector('e-1', 'a', 'b', {
        kind: 'step',
        slot: { id: 's-1', graphEdgeId: 'e-1' },
      }),
    ],
    []
  );

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges, additionalNodeTypes });

  return (
    <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design">
      <StoryInfoPanel title="Insert opens a slot">
        Click the centered plus. The Add Node panel opens through the existing preview pipeline and
        a bar-sized preview row opens the slot between the two bars. Inserts are stamped seqInserted
        and use a random id, and the sequential clone types are ignored by the collision pass.
      </StoryInfoPanel>
      <AddNodeManager
        onBeforeNodeAdded={sequentialOnBeforeNodeAdded}
        ignoredNodeTypes={SEQUENTIAL_IGNORED_NODE_TYPES}
      />
    </BaseCanvas>
  );
}

export const InsertOpensSlot: Story = {
  render: () => <InsertFlowStory />,
};
