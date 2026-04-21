import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
// These resolve via Vite aliases in apps/storybook/.storybook/main.ts, not TS paths.
// @ts-expect-error -- Vite alias: @uipath/apollo-wind/* → packages/apollo-wind/src/*
import type { FlowPanelChatMessage } from '@uipath/apollo-wind/components/custom/panel-flow';
// @ts-expect-error -- Vite alias
import type {
  PropertiesSimpleField,
  PropertiesSimpleSection,
} from '@uipath/apollo-wind/templates/Flow/template-flow';
// @ts-expect-error -- Vite alias
import { FlowTemplate } from '@uipath/apollo-wind/templates/Flow/template-flow';
import { useMemo } from 'react';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
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

// ============================================================================
// My Experiment — 10-node pipeline with one alert node
// ============================================================================

function createExperimentNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'exp-trigger',
      type: 'uipath.manual-trigger',
      position: { x: 80, y: 250 },
      display: { label: 'Manual trigger' },
    }),
    createNode({
      id: 'exp-fetch-data',
      type: 'uipath.blank-node',
      position: { x: 280, y: 130 },
      display: { label: 'Fetch data', subLabel: 'Excel activities' },
    }),
    createNode({
      id: 'exp-fetch-db',
      type: 'uipath.blank-node',
      position: { x: 280, y: 370 },
      display: { label: 'Query database', subLabel: 'SQL activities' },
    }),
    createNode({
      id: 'exp-validate',
      type: 'uipath.blank-node',
      position: { x: 490, y: 250 },
      display: { label: 'Validate input', subLabel: 'Data validation' },
    }),
    createNode({
      id: 'exp-alert',
      type: 'uipath.blank-node',
      position: { x: 700, y: 80 },
      display: { label: 'Check errors', subLabel: 'Alert notification', icon: 'triangle-alert' },
      executionStatus: 'Failed',
    }),
    createNode({
      id: 'exp-transform',
      type: 'uipath.blank-node',
      position: { x: 700, y: 250 },
      display: { label: 'Transform data', subLabel: 'Data transform' },
    }),
    createNode({
      id: 'exp-enrich',
      type: 'uipath.blank-node',
      position: { x: 700, y: 420 },
      display: { label: 'Enrich records', subLabel: 'AI Agent' },
    }),
    createNode({
      id: 'exp-aggregate',
      type: 'uipath.blank-node',
      position: { x: 910, y: 250 },
      display: { label: 'Aggregate results', subLabel: 'Processing' },
    }),
    createNode({
      id: 'exp-report',
      type: 'uipath.blank-node',
      position: { x: 1110, y: 130 },
      display: { label: 'Generate report', subLabel: 'Reporting' },
    }),
    createNode({
      id: 'exp-notify',
      type: 'uipath.blank-node',
      position: { x: 1110, y: 370 },
      display: { label: 'Send notification', subLabel: 'Slack integration' },
    }),
  ];
}

const experimentEdges: Edge[] = [
  { id: 'ee-1', source: 'exp-trigger', target: 'exp-fetch-data', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-2', source: 'exp-trigger', target: 'exp-fetch-db', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-3', source: 'exp-fetch-data', target: 'exp-validate', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-4', source: 'exp-fetch-db', target: 'exp-validate', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-5', source: 'exp-validate', target: 'exp-alert', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-6', source: 'exp-validate', target: 'exp-transform', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-7', source: 'exp-validate', target: 'exp-enrich', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-8', source: 'exp-transform', target: 'exp-aggregate', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-9', source: 'exp-enrich', target: 'exp-aggregate', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-10', source: 'exp-aggregate', target: 'exp-report', sourceHandle: 'output', targetHandle: 'input' },
  { id: 'ee-11', source: 'exp-aggregate', target: 'exp-notify', sourceHandle: 'output', targetHandle: 'input' },
];

function ExperimentCanvas() {
  const initialNodes = useMemo(() => createExperimentNodes(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: experimentEdges,
  });

  return <BaseCanvas {...canvasProps} mode="design" />;
}

export const MyExperiment: Story = {
  name: 'My experiment',
  render: (_, { globals }) => (
    <FlowTemplate theme={globals.theme || 'future-dark'} blank>
      <ExperimentCanvas />
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
