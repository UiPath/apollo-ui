import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  applyEdgeChanges,
  applyNodeChanges,
  Panel,
  ReactFlowProvider,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { FontVariantToken } from '@uipath/apollo-core';
import { ApTypography } from '@uipath/portal-shell-react';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { BaseCanvas } from './BaseCanvas/BaseCanvas';
import { NodeInspector } from './NodeInspector';

const meta = {
  title: 'Canvas/NodeInspector',
  component: NodeInspector,
  decorators: [
    (Story: any) => (
      <ReactFlowProvider>
        <div style={{ height: '100vh', width: '100%' }}>
          <Story />
        </div>
      </ReactFlowProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    nodeFilter: {
      control: false,
      description: 'Custom filter function to determine which nodes to inspect',
    },
  },
} satisfies Meta<typeof NodeInspector>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample nodes with different types and data
const createSampleNodes = (): Node[] => [
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 200, y: 200 },
    data: {
      label: 'AI Agent',
      provider: 'anthropic',
      model: 'claude-3-opus',
      temperature: 0.7,
      config: {
        maxTokens: 4096,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stopSequences: ['\\n\\nHuman:', '\\n\\nAssistant:'],
        systemPrompt:
          'You are a helpful AI assistant that provides accurate and thoughtful responses.',
        apiKey: 'sk-ant-api03-...',
        endpoint: 'https://api.anthropic.com/v1/messages',
        retryConfig: {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10_000,
          backoffMultiplier: 2,
        },
        timeout: 30_000,
        customHeaders: {
          'X-Custom-Header': 'value',
          'X-Request-ID': 'uuid-123-456',
        },
      },
      metrics: {
        totalRequests: 1543,
        successfulRequests: 1498,
        failedRequests: 45,
        averageLatency: 342.5,
        p95Latency: 892.3,
        p99Latency: 1234.7,
        totalTokensUsed: 2_456_789,
        costEstimate: 123.45,
      },
    },
  },
  {
    id: 'resource-1',
    type: 'resource',
    position: { x: 450, y: 200 },
    data: {
      label: 'Database',
      type: 'tool',
      description: 'PostgreSQL database connection',
      status: 'active',
      connection: {
        host: 'localhost',
        port: 5432,
        database: 'myapp',
        poolSize: 10,
        ssl: true,
      },
    },
  },
  {
    id: 'flow-1',
    type: 'flow',
    position: { x: 325, y: 350 },
    data: {
      label: 'Decision Node',
      condition: 'response.success === true',
      branches: 2,
      history: [
        { timestamp: '2024-01-15T10:30:00Z', result: true, executionTime: 123 },
        { timestamp: '2024-01-15T10:31:00Z', result: false, executionTime: 456 },
        { timestamp: '2024-01-15T10:32:00Z', result: true, executionTime: 234 },
      ],
    },
  },
];

const createSampleEdges = (): Edge[] => [
  { id: 'e1-2', source: 'agent-1', target: 'resource-1' },
  { id: 'e1-3', source: 'agent-1', target: 'flow-1' },
  { id: 'e2-3', source: 'resource-1', target: 'flow-1' },
];

// Canvas with NodeInspector
const CanvasWithNodeInspector = () => {
  const [nodes, setNodes] = useState<Node[]>(createSampleNodes());
  const [edges, setEdges] = useState<Edge[]>(createSampleEdges());

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <BaseCanvas
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      mode="design"
    >
      <NodeInspector />
      <Panel position="top-left">
        <Column
          p={20}
          gap={8}
          style={{
            backgroundColor: 'var(--uix-canvas-background-secondary)',
            color: 'var(--uix-canvas-foreground)',
          }}
        >
          <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Node Inspector Demo</ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS}>
            Click on nodes to see their details
          </ApTypography>
        </Column>
      </Panel>
    </BaseCanvas>
  );
};

export const Default: Story = {
  render: () => <CanvasWithNodeInspector />,
};
