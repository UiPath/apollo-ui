import type { Meta, StoryObj } from '@storybook/react-vite';
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
import { ApIcon } from '@uipath/apollo-react/material/components';
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
      position: { x: 50, y: 100 },
      width: 66,
      height: 66,
      data: {
        details: {
          tooltip: 'Start Trigger',
        },
      },
    },
    {
      id: '2',
      type: 'trigger',
      position: { x: 200, y: 100 },
      width: 66,
      height: 66,
      data: {
        details: {
          tooltip: 'Schedule Trigger - Runs every day at 9:00 AM',
        },
      },
    },
    {
      id: '3',
      type: 'trigger',
      position: { x: 350, y: 100 },
      width: 66,
      height: 66,
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
      position: { x: 500, y: 100 },
      width: 66,
      height: 66,
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
      position: { x: 650, y: 100 },
      width: 66,
      height: 66,
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
      position: { x: 50, y: 250 },
      width: 66,
      height: 66,
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
      position: { x: 200, y: 250 },
      width: 66,
      height: 66,
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
      position: { x: 350, y: 250 },
      width: 66,
      height: 66,
      data: {
        details: {
          tooltip: 'Time Trigger',
          icon: (
            <ApIcon
              name="schedule"
              variant="outlined"
              color="var(--uix-canvas-foreground-emp)"
              size="24px"
            />
          ),
        },
      },
    },
    {
      id: '9',
      type: 'trigger',
      position: { x: 500, y: 250 },
      width: 66,
      height: 66,
      data: {
        details: {
          tooltip: 'Email Trigger',
          icon: (
            <ApIcon
              name="email"
              variant="outlined"
              color="var(--uix-canvas-foreground-emp)"
              size="24px"
            />
          ),
        },
      },
    },
    {
      id: '10',
      type: 'trigger',
      position: { x: 650, y: 250 },
      width: 66,
      height: 66,
      data: {
        details: {
          tooltip: 'Webhook Trigger',
          icon: (
            <ApIcon
              name="webhook"
              variant="outlined"
              color="var(--uix-canvas-foreground-emp)"
              size="24px"
            />
          ),
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
  title: 'Canvas/TriggerNode',
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
