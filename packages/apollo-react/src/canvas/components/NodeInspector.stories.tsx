import type { Meta, StoryObj } from '@storybook/react-vite';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';

import { withCanvasProviders } from '../storybook-utils/decorators';
import { useCanvasStory } from '../storybook-utils/hooks/useCanvasStory';
import { createNode } from '../storybook-utils/mocks/nodes';
import { BaseCanvas } from './BaseCanvas/BaseCanvas';
import type { BaseNodeData } from './BaseNode/BaseNode.types';
import { NodeInspector } from './NodeInspector';

const meta: Meta = {
  title: 'Components/Panels/NodeInspector',
  component: NodeInspector,
  decorators: [withCanvasProviders()],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    nodeFilter: {
      control: false,
      description: 'Custom filter function to determine which nodes to inspect',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample nodes using registered manifest types
const createSampleNodes = (): Node<BaseNodeData>[] => [
  createNode({
    id: 'agent-1',
    type: 'uipath.agent',
    position: { x: 200, y: 350 },
    display: {
      label: 'AI Agent',
      subLabel: 'Claude Opus',
    },
    data: {
      parameters: {
        description: 'An AI agent that can perform tasks and make decisions.',
        capabilities: ['Data processing', 'Decision making', 'Integrations'],
      },
    },
  }),
  createNode({
    id: 'script-1',
    type: 'uipath.script',
    position: { x: 600, y: 200 },
    display: {
      label: 'Transform Data',
      subLabel: 'JavaScript',
    },
  }),
  createNode({
    id: 'decision-1',
    type: 'uipath.control-flow.decision',
    position: { x: 600, y: 450 },
    display: {
      label: 'Route Response',
      subLabel: 'Success check',
    },
  }),
];

const createSampleEdges = (): Edge[] => [
  {
    id: 'e-agent-script',
    source: 'agent-1',
    sourceHandle: 'success',
    target: 'script-1',
  },
  { id: 'e-agent-decision', source: 'agent-1', sourceHandle: 'error', target: 'decision-1' },
];

// Canvas with NodeInspector
const CanvasWithNodeInspector = () => {
  const initialNodes = useMemo(() => createSampleNodes(), []);
  const initialEdges = useMemo(() => createSampleEdges(), []);

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <NodeInspector />
      <Panel position="top-left">
        <Column
          p={20}
          gap={8}
          style={{
            backgroundColor: 'var(--canvas-background-secondary)',
            color: 'var(--canvas-foreground)',
          }}
        >
          <span className="text-lg font-bold">Node Inspector Demo</span>
          <span className="text-sm">Click on nodes to see their details</span>
        </Column>
      </Panel>
    </BaseCanvas>
  );
};

export const Default: Story = {
  render: () => <CanvasWithNodeInspector />,
};
