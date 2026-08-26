import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasIcon } from '@uipath/apollo-react/canvas';
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowProvider,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useState } from 'react';
import { BaseCanvas } from '../BaseCanvas';
import { TriggerNode } from './TriggerNode';

// Wrapper component that adapts React Flow node props to TriggerNode props
const TriggerNodeWrapper = (props: any) => {
  // React Flow passes node data in props.data
  // Our TriggerNode expects details prop instead
  const triggerProps = {
    ...props,
    details: props.data?.details || {},
  };
  return <TriggerNode {...triggerProps} />;
};

const nodeTypes = {
  trigger: TriggerNodeWrapper,
};

// Main story component
const TriggerNodeStory = () => {
  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'trigger',
      position: { x: 48, y: 96 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Start Trigger',
        },
      },
    },
    {
      id: '2',
      type: 'trigger',
      position: { x: 192, y: 96 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Schedule Trigger - Runs every day at 9:00 AM',
        },
      },
    },
    {
      id: '3',
      type: 'trigger',
      position: { x: 336, y: 96 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'In Progress',
          status: 'InProgress',
        },
      },
    },
    {
      id: '4',
      type: 'trigger',
      position: { x: 480, y: 96 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Completed',
          status: 'Completed',
        },
      },
    },
    {
      id: '5',
      type: 'trigger',
      position: { x: 624, y: 96 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Failed',
          status: 'Failed',
        },
      },
    },
    {
      id: '6',
      type: 'trigger',
      position: { x: 48, y: 256 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Paused',
          status: 'Paused',
        },
      },
    },
    {
      id: '7',
      type: 'trigger',
      position: { x: 192, y: 256 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Not Executed',
          status: 'NotExecuted',
        },
      },
    },
    {
      id: '8',
      type: 'trigger',
      position: { x: 336, y: 256 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Time Trigger',
          icon: <CanvasIcon icon="clock" color="var(--canvas-foreground-emp)" size={24} />,
        },
      },
    },
    {
      id: '9',
      type: 'trigger',
      position: { x: 480, y: 256 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Email Trigger',
          icon: <CanvasIcon icon="mail" color="var(--canvas-foreground-emp)" size={24} />,
        },
      },
    },
    {
      id: '10',
      type: 'trigger',
      position: { x: 624, y: 256 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Webhook Trigger',
          icon: <CanvasIcon icon="webhook" color="var(--canvas-foreground-emp)" size={24} />,
        },
      },
    },
  ];

  const initialEdges: Edge[] = [];

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <BaseCanvas
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      mode="design"
    />
  );
};

const meta = {
  title: 'Components/Nodes/TriggerNode',
  component: BaseCanvas,
  decorators: [
    (Story: any) => {
      return (
        <ReactFlowProvider>
          <div style={{ height: '100vh', width: '100%' }}>
            <Story />
          </div>
        </ReactFlowProvider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BaseCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <TriggerNodeStory />,
};

const DefaultEntryPointStory = () => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'manual-trigger',
      type: 'trigger',
      position: { x: 96, y: 144 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Manual trigger',
          icon: <CanvasIcon icon="mouse-pointer-click" size={28} />,
        },
      },
    },
    {
      id: 'schedule-trigger',
      type: 'trigger',
      position: { x: 288, y: 144 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Schedule trigger — default entry point',
          icon: <CanvasIcon icon="clock" size={28} />,
          isDefaultEntryPoint: true,
        },
      },
    },
    {
      id: 'webhook-trigger',
      type: 'trigger',
      position: { x: 480, y: 144 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'Webhook trigger',
          icon: <CanvasIcon icon="webhook" size={28} />,
        },
      },
    },
  ]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((currentNodes) => applyNodeChanges(changes, currentNodes)),
    []
  );

  return (
    <BaseCanvas
      nodes={nodes}
      edges={[]}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      mode="design"
    />
  );
};

/**
 * The star marks the trigger used by toolbar Run and Debug actions when a flow
 * has multiple triggers. Do not set `isDefaultEntryPoint` for a single-trigger
 * flow: that trigger is implicitly the default.
 */
export const DefaultEntryPoint: Story = {
  name: 'Default entry point',
  render: () => <DefaultEntryPointStory />,
};

const ImplicitDefaultEntryPointStory = () => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'single-trigger',
      type: 'trigger',
      position: { x: 192, y: 144 },
      width: 96,
      height: 96,
      data: {
        details: {
          tooltip: 'The only trigger is implicitly the default entry point',
          icon: <CanvasIcon icon="clock" size={28} />,
        },
      },
    },
  ]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((currentNodes) => applyNodeChanges(changes, currentNodes)),
    []
  );

  return (
    <BaseCanvas
      nodes={nodes}
      edges={[]}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      mode="design"
    />
  );
};

/** A single trigger is implicitly the default, so Flow omits the visual marker. */
export const ImplicitDefaultEntryPoint: Story = {
  name: 'Implicit default (single trigger)',
  render: () => <ImplicitDefaultEntryPointStory />,
};
