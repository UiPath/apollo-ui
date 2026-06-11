import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FormSchema } from '@uipath/apollo-wind';
import { Play } from 'lucide-react';
import { NodeRegistryProvider } from '../../core';
import type { NodeManifest } from '../../schema';
import { allCategoryManifests } from '../../storybook-utils';
import { NodePropertyPanel } from './NodePropertyPanel';

// ============================================================================
// Layout helpers
// ============================================================================

const CanvasBackground = ({ children }: { children: React.ReactNode }) => (
  <div
    className="flex min-h-screen items-center justify-center p-10"
    style={{ backgroundColor: 'var(--surface, var(--color-background))' }}
  >
    {children}
  </div>
);

const PanelFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[360px] overflow-hidden rounded-2xl border border-border-subtle shadow-lg">
    {children}
  </div>
);

function RunButton() {
  return (
    <button
      type="button"
      className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-foreground-on-accent transition hover:bg-brand-hover"
    >
      <Play size={14} />
      Run
    </button>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof NodePropertyPanel> = {
  title: 'Components/Panels/Node Property Panel',
  component: NodePropertyPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The **NodePropertyPanel** is a docked properties panel that renders a node's
\`form: FormSchema\` directly from its manifest in the \`NodeRegistryProvider\`.

## Usage

\`\`\`tsx
// 1. Define the form schema in the node manifest (tabs = steps):
const manifest: NodeManifest = {
  nodeType: 'uipath.http-request',
  form: {
    id: 'http-request',
    title: 'HTTP Request',
    steps: [
      { id: 'parameters', title: 'Parameters', sections: [{ id: 'main', fields: [...] }] },
      { id: 'error-handling', title: 'Error handling', sections: [...] },
    ],
  },
  // ...
};

// 2. Render the panel — no manifest prop needed:
<NodeRegistryProvider manifest={{ nodes: [manifest], categories: [] }}>
  <NodePropertyPanel
    panelTitle="Properties"
    nodeType="uipath.http-request"
    nodeLabel="Fetch invoice"
    onSubmit={(data) => saveNodeConfig(nodeId, data)}
    onClose={() => setSelectedNode(null)}
  />
</NodeRegistryProvider>
\`\`\`

Tabs are defined as \`steps\` in the FormSchema — the component never hardcodes
tab names or field types. Single-page schemas (\`sections\`) are rendered as a
flat scrollable form.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <CanvasBackground>
        <Story />
      </CanvasBackground>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NodePropertyPanel>;

// ============================================================================
// Shared FormSchema definitions
// Tabs = steps; sections within each step hold the fields.
// ============================================================================

const httpRequestForm: FormSchema = {
  id: 'http-request',
  title: 'HTTP Request',
  mode: 'onChange',
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [
        {
          id: 'main',
          fields: [
            {
              type: 'text',
              name: 'endpoint',
              label: 'Endpoint',
              placeholder: 'https://…',
              description: 'The URL of the HTTP endpoint to call.',
              defaultValue: 'https://finance.internal/api/invoices',
            },
            {
              type: 'select',
              name: 'method',
              label: 'Method',
              defaultValue: 'GET',
              dataSource: {
                type: 'static',
                options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((v) => ({
                  label: v,
                  value: v,
                })),
              },
            },
            {
              type: 'select',
              name: 'auth_type',
              label: 'Auth type',
              defaultValue: 'bearer',
              dataSource: {
                type: 'static',
                options: ['none', 'bearer', 'api-key', 'oauth'].map((v) => ({
                  label: v,
                  value: v,
                })),
              },
            },
            {
              type: 'number',
              name: 'timeout_ms',
              label: 'Timeout (ms)',
              placeholder: '5000',
              description: 'Request timeout in milliseconds.',
              defaultValue: 10000,
            },
            {
              type: 'switch',
              name: 'retry_on_failure',
              label: 'Retry on failure',
              defaultValue: true,
            },
          ],
        },
      ],
    },
    {
      id: 'error-handling',
      title: 'Error handling',
      sections: [
        {
          id: 'errors',
          fields: [
            {
              type: 'select',
              name: 'on_error',
              label: 'On error',
              defaultValue: 'throw',
              dataSource: {
                type: 'static',
                options: [
                  { label: 'Throw exception', value: 'throw' },
                  { label: 'Return empty', value: 'empty' },
                  { label: 'Retry', value: 'retry' },
                ],
              },
            },
            {
              type: 'number',
              name: 'max_retries',
              label: 'Max retries',
              defaultValue: 3,
            },
          ],
        },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      sections: [
        {
          id: 'adv',
          fields: [
            {
              type: 'switch',
              name: 'follow_redirects',
              label: 'Follow redirects',
              defaultValue: true,
            },
            {
              type: 'switch',
              name: 'verify_ssl',
              label: 'Verify SSL',
              defaultValue: true,
            },
          ],
        },
      ],
    },
  ],
};

const humanTaskForm: FormSchema = {
  id: 'human-task',
  title: 'Human Task',
  mode: 'onChange',
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [
        {
          id: 'main',
          fields: [
            {
              type: 'text',
              name: 'assignee',
              label: 'Assignee',
              placeholder: 'user@example.com',
              defaultValue: 'finance.manager@acme.com',
              validation: { required: true, email: true },
            },
            {
              type: 'number',
              name: 'timeout_hours',
              label: 'Timeout (hours)',
              placeholder: '24',
              description: 'Hours before task auto-escalates.',
              defaultValue: 48,
            },
            {
              type: 'text',
              name: 'escalation_email',
              label: 'Escalation email',
              placeholder: 'escalation@example.com',
              defaultValue: 'director@acme.com',
            },
            {
              type: 'switch',
              name: 'require_comment',
              label: 'Require comment',
              defaultValue: true,
            },
          ],
        },
      ],
    },
    {
      id: 'error-handling',
      title: 'Error handling',
      sections: [{ id: 'errors', fields: [] }],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      sections: [{ id: 'adv', fields: [] }],
    },
  ],
};

const agentForm: FormSchema = {
  id: 'ai-agent',
  title: 'AI Agent',
  mode: 'onChange',
  steps: [
    {
      id: 'parameters',
      title: 'Parameters',
      sections: [
        {
          id: 'main',
          fields: [
            {
              type: 'text',
              name: 'model',
              label: 'Model',
              description: 'AI model identifier.',
              defaultValue: 'claude-sonnet-4-5',
            },
            {
              type: 'text',
              name: 'policy_version',
              label: 'Policy version',
              defaultValue: 'v2.3',
            },
            {
              type: 'number',
              name: 'approval_threshold',
              label: 'Approval threshold ($)',
              description: 'Invoice amount above which human approval is required.',
              defaultValue: 5000,
            },
            {
              type: 'switch',
              name: 'strict_mode',
              label: 'Strict mode',
              defaultValue: true,
            },
          ],
        },
      ],
    },
    {
      id: 'error-handling',
      title: 'Error handling',
      sections: [{ id: 'errors', fields: [] }],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      sections: [{ id: 'adv', fields: [] }],
    },
  ],
};

// ============================================================================
// Story node manifests — minimal wrappers that provide the form schema
// ============================================================================

function makeManifest(
  nodeType: string,
  label: string,
  category: string,
  form: FormSchema
): NodeManifest {
  return {
    nodeType,
    version: '1.0.0',
    category,
    tags: [],
    sortOrder: 0,
    display: { label, shape: 'square' },
    handleConfiguration: [],
    form,
  };
}

function withRegistry(manifest: NodeManifest) {
  return (Story: React.ComponentType) => (
    <NodeRegistryProvider manifest={{ nodes: [manifest], categories: allCategoryManifests }}>
      <Story />
    </NodeRegistryProvider>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const HttpRequest: Story = {
  decorators: [
    withRegistry(
      makeManifest('uipath.http-request', 'HTTP Request', 'integration', httpRequestForm)
    ),
  ],
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeType="uipath.http-request"
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        action={<RunButton />}
        onSubmit={(data) => console.log('submit', data)}
        onClose={() => console.log('close')}
      />
    </PanelFrame>
  ),
};

export const HumanTask: Story = {
  decorators: [
    withRegistry(makeManifest('uipath.human-task', 'Human Task', 'collaboration', humanTaskForm)),
  ],
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeType="uipath.human-task"
        nodeLabel="Manager approval"
        nodeCategory="Human Task"
        action={<RunButton />}
        onSubmit={(data) => console.log('submit', data)}
        onClose={() => console.log('close')}
      />
    </PanelFrame>
  ),
};

export const AiAgent: Story = {
  decorators: [withRegistry(makeManifest('uipath.ai-agent', 'AI Agent', 'ai', agentForm))],
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeType="uipath.ai-agent"
        nodeLabel="Policy check"
        nodeCategory="AI Agent"
        action={<RunButton />}
        onSubmit={(data) => console.log('submit', data)}
        onClose={() => console.log('close')}
      />
    </PanelFrame>
  ),
};

export const NoParameters: Story = {
  decorators: [
    withRegistry(
      makeManifest('uipath.log-event', 'Log Event', 'utility', {
        id: 'log-event',
        title: 'Log Event',
        sections: [{ id: 'main', fields: [] }],
      })
    ),
  ],
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeType="uipath.log-event"
        nodeLabel="Log event"
        nodeCategory="Logging"
        onClose={() => console.log('close')}
      />
    </PanelFrame>
  ),
};

export const ContentOnly: Story = {
  decorators: [
    withRegistry(
      makeManifest('uipath.http-request', 'HTTP Request', 'integration', httpRequestForm)
    ),
  ],
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        nodeType="uipath.http-request"
        onSubmit={(data) => console.log('submit', data)}
      />
    </PanelFrame>
  ),
};
