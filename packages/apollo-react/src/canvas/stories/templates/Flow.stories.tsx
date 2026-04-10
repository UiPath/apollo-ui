import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
// These resolve via Vite aliases in apps/storybook/.storybook/main.ts, not TS paths.
// @ts-expect-error -- Vite alias: @uipath/apollo-wind/* → packages/apollo-wind/src/*
import type { FlowPanelChatMessage } from '@uipath/apollo-wind/components/custom/panel-flow';
// @ts-expect-error -- Vite alias
import type { PropertiesSimpleField, PropertiesSimpleSection } from '@uipath/apollo-wind/templates/Flow/template-flow';
// @ts-expect-error -- Vite alias
import { FlowTemplate } from '@uipath/apollo-wind/templates/Flow/template-flow';
import { useMemo } from 'react';
import {
  createNode,
  useCanvasStory,
  withCanvasProviders,
} from '../../storybook-utils';
import type { BaseNodeData } from '../../components/BaseNode/BaseNode.types';
import { BaseCanvas } from '../../components/BaseCanvas';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta = {
  title: 'Templates/Flow',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Sample Canvas Data
// ============================================================================

function createFlowNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'trigger',
      type: 'uipath.manual-trigger',
      position: { x: 100, y: 200 },
      display: { label: 'Manual trigger' },
    }),
    createNode({
      id: 'action-1',
      type: 'uipath.blank-node',
      position: { x: 350, y: 100 },
      display: { label: 'Read Excel', subLabel: 'Excel activities' },
    }),
    createNode({
      id: 'action-2',
      type: 'uipath.blank-node',
      position: { x: 350, y: 300 },
      display: { label: 'Analyze data', subLabel: 'AI Agent' },
    }),
    createNode({
      id: 'action-3',
      type: 'uipath.blank-node',
      position: { x: 600, y: 200 },
      display: { label: 'Send summary', subLabel: 'Slack integration' },
    }),
  ];
}

const flowEdges: Edge[] = [
  {
    id: 'e-trigger-action-1',
    source: 'trigger',
    target: 'action-1',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
  {
    id: 'e-trigger-action-2',
    source: 'trigger',
    target: 'action-2',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
  {
    id: 'e-action-1-action-3',
    source: 'action-1',
    target: 'action-3',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
  {
    id: 'e-action-2-action-3',
    source: 'action-2',
    target: 'action-3',
    sourceHandle: 'output',
    targetHandle: 'input',
  },
];

// ============================================================================
// Canvas content component (must be inside ReactFlowProvider)
// ============================================================================

function FlowCanvas() {
  const initialNodes = useMemo(() => createFlowNodes(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: flowEdges,
  });

  return <BaseCanvas {...canvasProps} mode="design" />;
}

// ============================================================================
// Stories
// ============================================================================

export const Blank: Story = {
  name: 'Blank',
  render: (_, { globals }) => (
    <FlowTemplate theme={globals.theme || 'future-dark'} blank>
      <FlowCanvas />
    </FlowTemplate>
  ),
};

export const LeftPanelCollapsed: Story = {
  name: 'Left panel collapsed',
  render: (_, { globals }) => (
    <FlowTemplate theme={globals.theme || 'future-dark'}>
      <FlowCanvas />
    </FlowTemplate>
  ),
};

const chatMessages: FlowPanelChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content:
      "Open the Excel file I uploaded yesterday, analyze the sales numbers, and generate a short summary of monthly performance. Send the summary to me on Slack once you're done.",
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Created an action plan',
  },
];

export const LeftPanelExpanded: Story = {
  name: 'Left panel open',
  render: (_, { globals }) => (
    <FlowTemplate
      theme={globals.theme || 'future-dark'}
      defaultPanelOpen
      chatMessages={chatMessages}
    >
      <FlowCanvas />
    </FlowTemplate>
  ),
};

// ── Properties Simple panel data ──────────────────────────────────────────

const simpleFields: PropertiesSimpleField[] = [
  {
    label: 'Method',
    required: true,
    value: 'POST',
    type: 'select',
    options: [
      { value: 'GET', label: 'GET' },
      { value: 'POST', label: 'POST' },
      { value: 'PUT', label: 'PUT' },
      { value: 'PATCH', label: 'PATCH' },
      { value: 'DELETE', label: 'DELETE' },
      { value: 'HEAD', label: 'HEAD' },
      { value: 'OPTIONS', label: 'OPTIONS' },
    ],
  },
  {
    label: 'API Definition',
    placeholder: 'Insert API definition URL',
    type: 'url',
  },
  {
    label: 'URL',
    value: 'loremipsum.com/lorem.htm',
    type: 'select',
    filled: true,
    showGraphControl: true,
    options: [
      { value: 'loremipsum.com/lorem.htm', label: 'loremipsum.com/lorem.htm' },
      { value: 'api.example.com/v1/data', label: 'api.example.com/v1/data' },
      { value: 'httpbin.org/post', label: 'httpbin.org/post' },
    ],
  },
];

const simpleSections: PropertiesSimpleSection[] = [
  {
    label: 'Authentication',
    defaultExpanded: true,
    fields: [
      {
        label: 'Authentication type',
        required: true,
        value: 'connection',
        type: 'select',
        options: [
          { value: 'connection', label: 'Connection' },
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'basic', label: 'Basic Auth' },
          { value: 'api-key', label: 'API Key' },
          { value: 'oauth2', label: 'OAuth 2.0' },
          { value: 'none', label: 'No Auth' },
        ],
      },
      {
        label: 'Authentication',
        required: true,
        placeholder: 'Select an application',
        type: 'select',
        options: [
          { value: 'salesforce', label: 'Salesforce' },
          { value: 'google-workspace', label: 'Google Workspace' },
          { value: 'microsoft-365', label: 'Microsoft 365' },
          { value: 'slack', label: 'Slack' },
          { value: 'jira', label: 'Jira' },
        ],
      },
      {
        label: 'Connection',
        placeholder: 'Select a connection',
        type: 'select',
        options: [
          { value: 'prod-connection', label: 'Production API' },
          { value: 'staging-connection', label: 'Staging API' },
          { value: 'dev-connection', label: 'Development API' },
        ],
      },
    ],
  },
  { label: 'Headers' },
  { label: 'Query Parameters' },
  { label: 'Body' },
];

export const PropertiesSimple: Story = {
  name: 'Properties Simple',
  render: (_, { globals }) => (
    <FlowTemplate
      theme={globals.theme || 'future-dark'}
      defaultPropertiesSimple
      propertiesSimpleTitle="HTTP Request"
      propertiesSimpleFields={simpleFields}
      propertiesSimpleSections={simpleSections}
    >
      <FlowCanvas />
    </FlowTemplate>
  ),
};

export const Properties: Story = {
  name: 'Properties Advanced',
  render: (_, { globals }) => (
    <FlowTemplate theme={globals.theme || 'future-dark'} defaultPropertiesExpanded>
      <FlowCanvas />
    </FlowTemplate>
  ),
};
