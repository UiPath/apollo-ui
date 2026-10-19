/**
 * Runtime container: a self-contained subflow expanded inline on a flow canvas. The
 * container has outer handles only and switches its body between flow and sequence from
 * its header. Drives SequentialCanvas in flow view with `sequencedContainerIds`.
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  Panel,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { NodeRegistryProvider } from '../../../core';
import {
  createNode,
  defaultWorkflowManifest,
  StoryInfoPanel,
  withCanvasProviders,
} from '../../../storybook-utils';
import {
  RUNTIME_CONTAINER_NODE_TYPE,
  runtimeContainerManifests,
  sequentialWireframeManifests,
} from '../../../storybook-utils/sequential';
import { getContainerSafeArea } from '../../../utils/container';
import { SequentialCanvas } from '../SequentialCanvas';

const meta: Meta = {
  title: 'Components/Canvas/SequentialCanvas/Sequence In Container',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const STORY_MANIFEST = {
  ...defaultWorkflowManifest,
  nodes: [
    ...defaultWorkflowManifest.nodes,
    ...sequentialWireframeManifests,
    ...runtimeContainerManifests,
  ],
};

const API_ID = 'api';
const FOR_EACH_ID = 'for-each';
const PADDING = getContainerSafeArea({ width: 0, height: 0 }).padding;
const LEFT = PADDING?.left ?? 0;
const TOP = PADDING?.top ?? 0;
const BOTTOM = PADDING?.bottom ?? 0;
const RIGHT = PADDING?.right ?? 0;

/** Flow-presentation sizes; the sequence presentation sizes the frame to its stack. */
const FOR_EACH_SIZE = { width: LEFT + 96 * 2 + 64 + RIGHT, height: TOP + 96 * 2 + 64 + BOTTOM };
const API_SIZE = {
  width: LEFT + FOR_EACH_SIZE.width + RIGHT,
  height: TOP + 160 + FOR_EACH_SIZE.height + 64 + 96 + BOTTOM,
};
const API_X = 340;
const AGENT_X = API_X + API_SIZE.width + 72;

/**
 * Maestro A -> Maestro B -> runtime container "api" -> Agent. The body is HTTP Request ->
 * Javascript -> For Each (four steps) -> Send Message to User; nothing wires the frame to
 * its first or last step.
 */
function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const child = (node: Node, parentId: string): Node => ({
    ...node,
    parentId,
    extent: 'parent',
  });
  const nodes: Node[] = [
    createNode({
      id: 'maestro-a',
      type: 'uipath.data.transform',
      position: { x: 0, y: 320 },
      display: { label: 'Maestro A' },
    }),
    createNode({
      id: 'maestro-b',
      type: 'uipath.data.transform',
      position: { x: 160, y: 320 },
      display: { label: 'Maestro B' },
    }),
    {
      id: API_ID,
      type: RUNTIME_CONTAINER_NODE_TYPE,
      position: { x: API_X, y: 0 },
      data: { display: { label: 'api' } },
      style: API_SIZE,
    },
    child(
      createNode({
        id: 'http',
        type: 'uipath.http-request',
        position: { x: LEFT, y: TOP },
        display: { label: 'HTTP Request' },
      }),
      API_ID
    ),
    child(
      createNode({
        id: 'javascript',
        type: 'uipath.javascript',
        position: { x: LEFT + 176, y: TOP },
        display: { label: 'Javascript' },
      }),
      API_ID
    ),
    {
      ...child(
        {
          id: FOR_EACH_ID,
          type: 'uipath.control-flow.foreach',
          position: { x: LEFT, y: TOP + 160 },
          data: { display: { label: 'For Each' } },
        },
        API_ID
      ),
      style: FOR_EACH_SIZE,
    },
    ...[0, 1, 2, 3].map((index) =>
      child(
        createNode({
          id: `step-${index + 4}`,
          type: 'uipath.data.transform',
          position: {
            x: LEFT + (index % 2) * 160,
            y: TOP + Math.floor(index / 2) * 160,
          },
          display: { label: `Step ${index + 4}` },
        }),
        FOR_EACH_ID
      )
    ),
    child(
      createNode({
        id: 'send-message',
        type: 'uipath.send-message',
        position: { x: LEFT, y: TOP + 160 + FOR_EACH_SIZE.height + 64 },
        display: { label: 'Send Message to User' },
      }),
      API_ID
    ),
    createNode({
      id: 'agent',
      type: 'uipath.agent',
      position: { x: AGENT_X, y: 300 },
      display: { label: 'Agent' },
    }),
  ];

  const edge = (
    id: string,
    source: string,
    sourceHandle: string,
    target: string,
    targetHandle = 'input'
  ): Edge => ({ id, source, sourceHandle, target, targetHandle });

  const edges: Edge[] = [
    edge('e-a-b', 'maestro-a', 'output', 'maestro-b'),
    edge('e-b-api', 'maestro-b', 'output', API_ID),
    edge('e-http-js', 'http', 'output', 'javascript'),
    edge('e-js-foreach', 'javascript', 'output', FOR_EACH_ID),
    edge('e-foreach-start', FOR_EACH_ID, 'start', 'step-4'),
    edge('e-4-5', 'step-4', 'output', 'step-5'),
    edge('e-5-6', 'step-5', 'output', 'step-6'),
    edge('e-6-7', 'step-6', 'output', 'step-7'),
    edge('e-7-continue', 'step-7', 'output', FOR_EACH_ID, 'continue'),
    edge('e-foreach-send', FOR_EACH_ID, 'success', 'send-message'),
    edge('e-api-agent', API_ID, 'output', 'agent'),
  ];
  return { nodes, edges };
}

const noop = () => {};

function RuntimeContainerCanvas() {
  const initial = useMemo(buildGraph, []);
  const [nodes, setNodes] = useState<Node[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [sequencedContainerIds, setSequencedContainerIds] = useState<string[]>([API_ID]);
  const [collapsedStepIds, setCollapsedStepIds] = useState<string[]>([FOR_EACH_ID]);
  const [designMode, setDesignMode] = useState(true);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  return (
    <SequentialCanvas
      view="flow"
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      sequencedContainerIds={sequencedContainerIds}
      onSequencedContainerIdsChange={setSequencedContainerIds}
      collapsedStepIds={collapsedStepIds}
      onCollapsedStepIdsChange={setCollapsedStepIds}
      onAddTrigger={noop}
      mode={designMode ? 'design' : 'view'}
      fitViewOptions={{ padding: 0.15 }}
    >
      <StoryInfoPanel
        title="Runtime container"
        description="A self-contained subflow expanded inline. Switch its body between sequence and flow from the frame header, expand or collapse steps from the numbers, and drag the frame."
        position="bottom-left"
        collapsible
        defaultCollapsed
      />
      <Panel position="bottom-right">
        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm">
          <input
            type="checkbox"
            checked={designMode}
            onChange={(event) => setDesignMode(event.target.checked)}
          />
          Design mode
        </label>
      </Panel>
    </SequentialCanvas>
  );
}

export const RuntimeContainer: Story = {
  name: 'Runtime container',
  render: () => (
    <NodeRegistryProvider manifest={STORY_MANIFEST}>
      <RuntimeContainerCanvas />
    </NodeRegistryProvider>
  ),
};
