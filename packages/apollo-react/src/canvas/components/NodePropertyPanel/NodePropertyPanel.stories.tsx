import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FormSchema } from '@uipath/apollo-wind';
import { ChevronDown, Globe, Maximize2, Play, Redo2, Sparkles, Undo2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { NodePropertyPanel } from './NodePropertyPanel';

// ============================================================================
// Layout helpers
// ============================================================================

const CanvasBackground = ({ children }: { children: ReactNode }) => (
  <div
    className="flex min-h-screen items-center justify-center p-10"
    style={{ backgroundColor: 'var(--surface, var(--color-background))' }}
  >
    {children}
  </div>
);

const PanelFrame = ({
  children,
  width = 'w-[380px]',
}: {
  children: ReactNode;
  width?: string;
}) => (
  <div className={`${width} overflow-hidden rounded-2xl border border-border-subtle shadow-lg`}>
    {children}
  </div>
);

const PanelTitleBar = ({ title }: { title: string }) => (
  <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-raised px-2">
    <span className="ml-2 text-sm font-semibold text-foreground">{title}</span>
  </div>
);

const NodeIdentityRow = ({ name, type }: { name: string; type: string }) => (
  <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-raised px-6 py-4">
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="truncate text-base font-semibold leading-5 tracking-[-0.4px] text-foreground">
        {name}
      </p>
      <p className="mt-0.5 truncate text-sm leading-5 text-foreground-muted">{type}</p>
    </div>
    <button
      type="button"
      className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-foreground-on-accent transition hover:bg-brand-hover"
    >
      <Play size={14} />
      Run
    </button>
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
// Shared FormSchema (steps = tabs; sections within each step hold the fields)
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
              placeholder: 'https://...',
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
              type: 'switch',
              name: 'error_handling_enabled',
              label: 'Enable error handling',
              description: 'Add an error output handle on the node to catch and handle failures.',
              defaultValue: false,
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
              type: 'text',
              name: 'node_id',
              label: 'ID',
              defaultValue: 'httpRequest1',
              disabled: true,
            },
            { type: 'text', name: 'label', label: 'Label', defaultValue: 'Fetch invoice details' },
            { type: 'textarea', name: 'description', label: 'Description' },
          ],
        },
      ],
    },
  ],
};

const manualTriggerForm: FormSchema = {
  id: 'manual-trigger',
  title: 'Manual trigger',
  mode: 'onChange',
  actions: [],
  steps: [
    {
      id: 'error-handling',
      title: 'Error handling',
      sections: [
        {
          id: 'errors',
          fields: [
            {
              type: 'switch',
              name: 'error_handling_enabled',
              label: 'Enable error handling',
              description: 'Add an error output handle on the node to catch and handle failures.',
              defaultValue: false,
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
              type: 'text',
              name: 'node_id',
              label: 'ID',
              defaultValue: 'manualTrigger1',
              disabled: true,
            },
            { type: 'text', name: 'label', label: 'Label', defaultValue: 'Manual trigger' },
            { type: 'textarea', name: 'description', label: 'Description' },
          ],
        },
      ],
    },
  ],
};

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
The **NodePropertyPanel** is a presentational, docked properties panel for canvas
nodes. It owns the chrome (optional title bar, node identity row, action slot) and
renders a single \`MetadataForm\` from the \`schema\` you pass in. Multi-step schemas
render as tabs (Parameters, Error handling, Advanced).

Because it is one form instance, values and validation are shared across tabs and
nothing is lost when switching tabs. The caller supplies \`schema\` and \`plugins\`,
so real-time change handling and custom fields stay on the consumer side.

The title bar is optional: omit \`panelTitle\` when the host panel system (e.g.
dockview) renders its own drag handle and close button.
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
// Stories — NodePropertyPanel
// ============================================================================

export const Default: Story = {
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeIcon={<Globe />}
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        action={<RunButton />}
        schema={httpRequestForm}
        contentInset="0.75rem"
        onClose={() => {}}
        className="h-[640px]"
      />
    </PanelFrame>
  ),
};

export const EmbeddedNoTitleBar: Story = {
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        action={<RunButton />}
        schema={httpRequestForm}
        className="h-[600px]"
      />
    </PanelFrame>
  ),
};

export const NoParametersTab: Story = {
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeLabel="Manual trigger"
        nodeCategory="Starts a flow run manually"
        action={<RunButton />}
        schema={manualTriggerForm}
        onClose={() => {}}
        className="h-[600px]"
      />
    </PanelFrame>
  ),
};

// ============================================================================
// Stories — Expression Field (editor mockups)
// Full-height panel with all expression editor chrome: toolbar, mode switcher,
// undo/redo, AI assist, expand, and Insert variable affordance.
// ============================================================================

function FullEditorStory() {
  return (
    <CanvasBackground>
      <PanelFrame>
        <PanelTitleBar title="Properties" />
        <NodeIdentityRow name="Policy check" type="AI Agent" />
        <div className="flex flex-col gap-6 overflow-auto bg-surface-raised px-6 pb-6 pt-4">
          {/* Field: Path */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Path</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="AI assist"
                  title="AI assist"
                  className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                >
                  <Sparkles size={12} />
                </button>
                <button
                  type="button"
                  aria-label="Insert variable"
                  title="Insert variable"
                  className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                >
                  <span className="font-mono text-[10px]">{'{x}'}</span>
                  <span>Insert</span>
                  <ChevronDown size={9} />
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
              <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-3 py-2">
                <span className="font-mono text-xs text-foreground-muted">result</span>
                <button
                  type="button"
                  aria-label="Expand editor"
                  title="Expand editor"
                  className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
                >
                  <Maximize2 size={11} />
                </button>
              </div>
              <div className="flex items-center gap-1 border-b border-border-subtle bg-surface px-2.5 py-1.5">
                <button type="button" aria-label="Undo" title="Undo" className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground">
                  <Undo2 size={12} />
                </button>
                <button type="button" aria-label="Redo" title="Redo" className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground">
                  <Redo2 size={12} />
                </button>
                <div className="mx-1 h-3 w-px shrink-0 bg-border-subtle" />
                <button type="button" className="rounded px-2 py-0.5 text-[11px] font-semibold text-foreground transition">
                  expr
                </button>
                <button type="button" className="rounded px-2 py-0.5 text-[11px] text-foreground-subtle transition">
                  json
                </button>
              </div>
              <pre className="overflow-auto whitespace-pre-wrap bg-surface-raised p-3 text-xs font-mono leading-5 text-foreground">
                {'items\n  .filter(x => x.active)\n  .map(x => x.value)'}
              </pre>
              <div className="flex items-center justify-between border-t border-border-subtle bg-surface px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-green-500" />
                  <span className="text-[10px] text-foreground-subtle">No errors</span>
                </div>
                <span className="text-[10px] text-foreground-subtle">Ln 1, Col 1</span>
              </div>
            </div>
            <p className="text-[11px] leading-4 text-foreground-subtle">
              Transform expression run against the node input data.
            </p>
          </div>

          {/* Field: Output Mapping */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Output Mapping</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="AI assist"
                  title="AI assist"
                  className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                >
                  <Sparkles size={12} />
                </button>
                <button
                  type="button"
                  aria-label="Insert variable"
                  title="Insert variable"
                  className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                >
                  <span className="font-mono text-[10px]">{'{x}'}</span>
                  <span>Insert</span>
                  <ChevronDown size={9} />
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
              <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-3 py-2">
                <span className="font-mono text-xs text-foreground-muted">object</span>
                <button type="button" aria-label="Expand editor" title="Expand editor" className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground">
                  <Maximize2 size={11} />
                </button>
              </div>
              <div className="flex items-center gap-1 border-b border-border-subtle bg-surface px-2.5 py-1.5">
                <button type="button" aria-label="Undo" title="Undo" className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground">
                  <Undo2 size={12} />
                </button>
                <button type="button" aria-label="Redo" title="Redo" className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground">
                  <Redo2 size={12} />
                </button>
                <div className="mx-1 h-3 w-px shrink-0 bg-border-subtle" />
                <button type="button" className="rounded px-2 py-0.5 text-[11px] text-foreground-subtle transition">
                  expr
                </button>
                <button type="button" className="rounded px-2 py-0.5 text-[11px] font-semibold text-foreground transition">
                  json
                </button>
              </div>
              <pre className="overflow-auto whitespace-pre-wrap bg-surface-raised p-3 text-xs font-mono leading-5 text-foreground">
                {'{\n  "id": invoice.id,\n  "total": invoice.amount,\n  "approved": true\n}'}
              </pre>
              <div className="flex items-center justify-between border-t border-border-subtle bg-surface px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-green-500" />
                  <span className="text-[10px] text-foreground-subtle">No errors</span>
                </div>
                <span className="text-[10px] text-foreground-subtle">Ln 1, Col 1</span>
              </div>
            </div>
            <p className="text-[11px] leading-4 text-foreground-subtle">
              Maps the node output to the expected schema.
            </p>
          </div>
        </div>
      </PanelFrame>
    </CanvasBackground>
  );
}

export const FullEditor: Story = {
  name: 'Editor Full',
  render: () => <FullEditorStory />,
};

// ============================================================================
// Compact Editor
// Collapsed by default. Shows label + value preview; expands inline on click.
// ============================================================================

function CompactEditorStory() {
  return (
    <CanvasBackground>
      <PanelFrame>
        <PanelTitleBar title="Properties" />
        <NodeIdentityRow name="Policy check" type="AI Agent" />
        <div className="flex flex-col overflow-auto bg-surface-raised pb-4 pt-2">
          {/* Compact field row — collapsed */}
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-2.5">
            <span className="w-24 shrink-0 text-xs text-foreground-muted">Path</span>
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5">
              <span className="truncate font-mono text-xs text-foreground">
                items.filter(x =&gt; x.active)
              </span>
            </div>
            <button
              type="button"
              aria-label="AI assist"
              title="AI assist"
              className="grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
            >
              <Sparkles size={12} />
            </button>
          </div>

          {/* Compact field row — expanded inline */}
          <div className="border-b border-border-subtle px-4 py-2.5">
            <div className="flex items-center gap-3 pb-2">
              <span className="w-24 shrink-0 text-xs text-foreground-muted">Output Mapping</span>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-foreground-muted">
                  expanded
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  title="Close"
                  className="grid size-5 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
              <div className="flex items-center gap-1 border-b border-border-subtle bg-surface px-2.5 py-1.5">
                <button type="button" aria-label="Undo" title="Undo" className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground">
                  <Undo2 size={12} />
                </button>
                <button type="button" aria-label="Redo" title="Redo" className="grid size-6 place-items-center rounded text-foreground-subtle transition hover:text-foreground">
                  <Redo2 size={12} />
                </button>
                <div className="mx-1 h-3 w-px shrink-0 bg-border-subtle" />
                <button type="button" className="rounded px-2 py-0.5 text-[11px] text-foreground-subtle transition">
                  expr
                </button>
                <button type="button" className="rounded px-2 py-0.5 text-[11px] font-semibold text-foreground transition">
                  json
                </button>
              </div>
              <pre className="overflow-auto whitespace-pre-wrap bg-surface-raised p-3 text-xs font-mono leading-5 text-foreground">
                {'{\n  "id": invoice.id,\n  "total": invoice.amount\n}'}
              </pre>
            </div>
          </div>

          {/* Another collapsed row */}
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-2.5">
            <span className="w-24 shrink-0 text-xs text-foreground-muted">Condition</span>
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5">
              <span className="truncate font-mono text-xs text-foreground-muted">
                No expression
              </span>
            </div>
            <button
              type="button"
              aria-label="AI assist"
              title="AI assist"
              className="grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
            >
              <Sparkles size={12} />
            </button>
          </div>
        </div>
      </PanelFrame>
    </CanvasBackground>
  );
}

export const CompactEditor: Story = {
  name: 'Editor Compact',
  render: () => <CompactEditorStory />,
};

// ============================================================================
// Input Editor
// Single-line expression input for simple scalar values or conditions.
// ============================================================================

function InputEditorStory() {
  return (
    <CanvasBackground>
      <PanelFrame>
        <PanelTitleBar title="Properties" />
        <NodeIdentityRow name="Policy check" type="AI Agent" />
        <div className="flex flex-col gap-3 overflow-auto bg-surface-raised px-6 pb-6 pt-4">
          {/* Inline expression input */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground-muted">Condition</span>
            <div className="flex items-center gap-1.5 overflow-hidden rounded-xl border border-border-subtle bg-surface px-3 py-2.5">
              <span className="shrink-0 font-mono text-[10px] text-foreground-muted">fx</span>
              <div className="mx-1 h-3 w-px shrink-0 bg-border-subtle" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                input.status === &quot;active&quot;
              </span>
              <button
                type="button"
                aria-label="AI assist"
                title="AI assist"
                className="ml-1 grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
              >
                <Sparkles size={12} />
              </button>
            </div>
          </div>

          {/* Inline input — empty/placeholder state */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground-muted">Retry limit</span>
            <div className="flex items-center gap-1.5 overflow-hidden rounded-xl border border-border-subtle bg-surface px-3 py-2.5">
              <span className="shrink-0 font-mono text-[10px] text-foreground-muted">fx</span>
              <div className="mx-1 h-3 w-px shrink-0 bg-border-subtle" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground-subtle">
                Enter expression
              </span>
              <button
                type="button"
                aria-label="AI assist"
                title="AI assist"
                className="ml-1 grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
              >
                <Sparkles size={12} />
              </button>
            </div>
          </div>

          {/* Inline input — with variable pill */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground-muted">Timeout (ms)</span>
            <div className="flex items-center gap-1.5 overflow-hidden rounded-xl border border-border-subtle bg-surface px-3 py-2.5">
              <span className="shrink-0 font-mono text-[10px] text-foreground-muted">fx</span>
              <div className="mx-1 h-3 w-px shrink-0 bg-border-subtle" />
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                <span className="rounded-md bg-surface-overlay px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                  config.timeout
                </span>
                <span className="font-mono text-xs text-foreground">* 1000</span>
              </div>
              <button
                type="button"
                aria-label="AI assist"
                title="AI assist"
                className="ml-1 grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
              >
                <Sparkles size={12} />
              </button>
            </div>
          </div>
        </div>
      </PanelFrame>
    </CanvasBackground>
  );
}

export const InputEditor: Story = {
  name: 'Editor Inline',
  render: () => <InputEditorStory />,
};

// ============================================================================
// Inline Editing
// Title and description in the node identity row are directly editable.
// ============================================================================

function InlineEditingStory() {
  const [name, setName] = useState('Policy check');
  const [type, setType] = useState('AI Agent');
  const [editingName, setEditingName] = useState(false);
  const [editingType, setEditingType] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);

  return (
    <CanvasBackground>
      <PanelFrame>
        <PanelTitleBar title="Properties" />
        {/* Node identity row — inline editable */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-raised px-6 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {editingName ? (
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false);
                }}
                className="w-full rounded bg-surface-overlay px-1.5 py-0.5 text-base font-semibold leading-5 tracking-[-0.4px] text-foreground outline-none ring-1 ring-brand"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingName(true);
                  setTimeout(() => nameRef.current?.select(), 0);
                }}
                className="truncate rounded px-1.5 py-0.5 text-left text-base font-semibold leading-5 tracking-[-0.4px] text-foreground transition hover:bg-surface-overlay"
              >
                {name}
              </button>
            )}
            {editingType ? (
              <input
                ref={typeRef}
                value={type}
                onChange={(e) => setType(e.target.value)}
                onBlur={() => setEditingType(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setEditingType(false);
                }}
                className="w-full rounded bg-surface-overlay px-1.5 py-0.5 text-sm leading-5 text-foreground outline-none ring-1 ring-brand"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingType(true);
                  setTimeout(() => typeRef.current?.select(), 0);
                }}
                className="truncate rounded px-1.5 py-0.5 text-left text-sm leading-5 text-foreground-muted transition hover:bg-surface-overlay"
              >
                {type}
              </button>
            )}
          </div>
          <button
            type="button"
            className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-foreground-on-accent transition hover:bg-brand-hover"
          >
            <Play size={14} />
            Run
          </button>
        </div>
        {/* Fields */}
        <div className="flex flex-col gap-4 overflow-auto bg-surface-raised px-6 pb-6 pt-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground-muted">Path</span>
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-5 text-foreground">
                {'items.filter(x => x.active).map(x => x.value)'}
              </pre>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground-muted">Output Mapping</span>
            <div className="rounded-xl border border-border-subtle bg-surface p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-5 text-foreground">
                {'{\n  "id": invoice.id,\n  "total": invoice.amount\n}'}
              </pre>
            </div>
          </div>
        </div>
      </PanelFrame>
    </CanvasBackground>
  );
}

export const InlineEditing: Story = {
  name: 'Inline Editing',
  render: () => <InlineEditingStory />,
};
