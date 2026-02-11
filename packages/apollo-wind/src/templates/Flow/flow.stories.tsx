import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowTemplate } from './template-flow';
import type { PropertiesSimpleField, PropertiesSimpleSection } from './template-flow';
import { FlowNode } from '@/components/custom/flow-node';
import type { FlowPanelChatMessage } from '@/components/custom/panel-flow';

const meta = {
  title: 'Templates/Flow',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blank: Story = {
  render: (_, { globals }) => (
    <FlowTemplate theme={globals.futureTheme || 'dark'} />
  ),
};

const chatMessages: FlowPanelChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content:
      'Open the Excel file I uploaded yesterday, analyze the sales numbers, and generate a short summary of monthly performance. Send the summary to me on Slack once you\'re done.',
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Created an action plan',
  },
];

export const ChatResponse: Story = {
  name: 'Chat Response',
  render: (_, { globals }) => (
    <FlowTemplate
      theme={globals.futureTheme || 'dark'}
      defaultPanelOpen
      chatMessages={chatMessages}
    >
      {/* Node centered on the canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <FlowNode title="Node title" />
      </div>
    </FlowTemplate>
  ),
};

// ── Properties Simple panel data (matches Figma "Properties 1") ──────────

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
      theme={globals.futureTheme || 'dark'}
      defaultPropertiesSimple
      propertiesSimpleTitle="HTTP Request"
      propertiesSimpleFields={simpleFields}
      propertiesSimpleSections={simpleSections}
    >
      {/* Node positioned left-center on the canvas */}
      <div className="absolute inset-0 flex items-center justify-start pl-16">
        <FlowNode title="HTTP Request" />
      </div>
    </FlowTemplate>
  ),
};

export const Properties: Story = {
  name: 'Properties Advanced',
  render: (_, { globals }) => (
    <FlowTemplate
      theme={globals.futureTheme || 'dark'}
      defaultPropertiesExpanded
    >
      {/* Node positioned left-center on the canvas */}
      <div className="absolute inset-0 flex items-center justify-start pl-16">
        <FlowNode title="Node title" />
      </div>
    </FlowTemplate>
  ),
};
