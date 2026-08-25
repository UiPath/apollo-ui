import type { Meta, StoryObj } from '@storybook/react-vite';
import { PropertiesSimple } from './flow-properties-simple';

const meta = {
  title: 'Components/UiPath/Properties (Simple)',
  component: PropertiesSimple,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PropertiesSimple>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Sample data
// ============================================================================

const sampleFields = [
  {
    label: 'Method',
    required: true,
    value: 'post',
    filled: true,
    type: 'select' as const,
    options: [
      { value: 'get', label: 'GET' },
      { value: 'post', label: 'POST' },
      { value: 'put', label: 'PUT' },
      { value: 'delete', label: 'DELETE' },
    ],
  },
  {
    label: 'Endpoint URL',
    required: true,
    placeholder: 'https://api.example.com/invoices',
    type: 'url' as const,
  },
  {
    label: 'Request body',
    placeholder: 'Enter JSON payload',
    type: 'input' as const,
    showGraphControl: true,
  },
];

const sampleSections = [
  {
    label: 'Authentication',
    defaultExpanded: true,
    fields: [
      {
        label: 'Auth type',
        type: 'select' as const,
        placeholder: 'Select...',
        options: [
          { value: 'none', label: 'None' },
          { value: 'bearer', label: 'Bearer token' },
          { value: 'oauth', label: 'OAuth 2.0' },
        ],
      },
      { label: 'Token', placeholder: 'Enter token', type: 'input' as const },
    ],
  },
  {
    label: 'Advanced',
    fields: [
      { label: 'Timeout (seconds)', placeholder: '30', type: 'input' as const },
      { label: 'Retry count', placeholder: '3', type: 'input' as const },
    ],
  },
];

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div className="dark flex h-screen justify-end bg-surface p-4">
      <PropertiesSimple
        title="HTTP Request"
        fields={sampleFields}
        sections={sampleSections}
        onClose={() => {}}
      />
    </div>
  ),
};

export const FieldsOnly: Story = {
  name: 'Fields only',
  render: () => (
    <div className="dark flex h-screen justify-end bg-surface p-4">
      <PropertiesSimple title="Webhook trigger" fields={sampleFields} onClose={() => {}} />
    </div>
  ),
};

export const WithGraphControl: Story = {
  name: 'With graph control',
  render: () => (
    <div className="dark flex h-screen justify-end bg-surface p-4">
      <PropertiesSimple
        title="HTTP Request"
        fields={[
          {
            label: 'Request body',
            required: true,
            placeholder: 'Enter JSON payload',
            type: 'input',
            showGraphControl: true,
          },
        ]}
        sections={sampleSections}
        onClose={() => {}}
        onGraphControl={(fieldLabel) => console.log('Graph control clicked:', fieldLabel)}
      />
    </div>
  ),
};
