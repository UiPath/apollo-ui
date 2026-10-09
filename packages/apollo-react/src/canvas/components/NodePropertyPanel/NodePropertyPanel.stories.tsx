import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EditorProps } from '@monaco-editor/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  FormSchema,
  QuickFieldType,
  QuickFormFieldMode,
  VariablePickerItem,
} from '@uipath/apollo-wind';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Combobox,
  cn,
  FIELD_TYPE_META,
  FormField,
  FormFieldDescription,
  FormFieldLabel,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Label,
  MetadataForm,
  PanelTabs,
  PanelTabsContent,
  PanelTabsList,
  PanelTabsStrip,
  PanelTabsTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  QuickFormField,
  RadioGroup,
  RadioGroupItem,
  RequiredIndicator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Textarea,
  Toaster,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
  VariablePicker,
} from '@uipath/apollo-wind';
import {
  apolloCoreDarkHCMonaco,
  apolloCoreDarkMonaco,
  apolloCoreLightHCMonaco,
  apolloCoreLightMonaco,
  apolloFutureDarkMonaco,
  apolloFutureLightMonaco,
} from '@uipath/apollo-wind/editor-themes';
import {
  ChevronDown,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  Code2,
  Copy,
  Eye,
  EyeOff,
  File,
  GitFork,
  Globe,
  GripVertical,
  HardDrive,
  Info,
  Link2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ScanText,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  UserRoundCheck,
  X,
  Zap,
} from 'lucide-react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
  cloneElement,
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { NodeOutputModeSelect } from '../../controls';
import { CanvasIcon } from '../../utils/icon-registry';
import { CanvasTooltip } from '../CanvasTooltip';
import type {
  DeriveTypeIcon,
  JsonCodeEditorRenderProps,
  JsonContainer,
  JsonObject,
  JsonSchema,
  JsonTreeFilterOption,
  JsonTreeNode,
  JsonValue,
  NodeAction,
  NodeActionsResolver,
  NodeDecoration,
  RenderValueCell,
} from '../JsonTree';
import { isJsonObject } from '../JsonTree';
import { NodeIOView, type NodeIOViewTab } from '../NodeIOView';
import {
  type NodeVariableDetails,
  NodeVariablesPanel,
  type NodeVariablesSource,
} from '../NodeVariablesPanel';
import { NodePropertyPanel } from './NodePropertyPanel';
import { NodePropertyPanelLayout } from './NodePropertyPanelLayout';

// @monaco-editor/react uses a CJS build without an `exports` field, which
// causes Rolldown (Vite 8 production bundler) to resolve the default import as
// undefined. Lazy-loading via dynamic import routes through a different interop
// path that correctly extracts the default export at runtime.
const _LazyMonaco = lazy(() => import('@monaco-editor/react'));
function MonacoEditor(props: EditorProps) {
  return (
    <Suspense fallback={<div className="flex-1 min-h-[200px]" />}>
      <_LazyMonaco {...props} />
    </Suspense>
  );
}

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

const PanelFrame = ({ children, width = 'w-[380px]' }: { children: ReactNode; width?: string }) => (
  <div className={`${width} overflow-hidden rounded-2xl border border-border-subtle shadow-lg`}>
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

function RunButtonIconOnly() {
  return (
    <button
      type="button"
      aria-label="Run"
      className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-foreground-on-accent transition hover:bg-brand-hover"
    >
      <Play size={14} />
    </button>
  );
}

function PanelAddButton({ children = 'Add field' }: { children?: ReactNode }) {
  return (
    <Button variant="text" size="2xs">
      <Plus />
      {children}
    </Button>
  );
}

// ── Monaco ──────────────────────────────────────────────────────────────────

let _monacoThemesRegistered = false;

// biome-ignore lint/suspicious/noExplicitAny: Monaco types not available at story level
function registerMonacoThemes(monaco: any) {
  if (_monacoThemesRegistered) return;
  monaco.editor.defineTheme('apollo-future-dark', apolloFutureDarkMonaco);
  monaco.editor.defineTheme('apollo-future-light', apolloFutureLightMonaco);
  monaco.editor.defineTheme('apollo-core-dark', apolloCoreDarkMonaco);
  monaco.editor.defineTheme('apollo-core-light', apolloCoreLightMonaco);
  monaco.editor.defineTheme('apollo-core-dark-hc', apolloCoreDarkHCMonaco);
  monaco.editor.defineTheme('apollo-core-light-hc', apolloCoreLightHCMonaco);
  _monacoThemesRegistered = true;
}

const THEME_CLASS_MAP: Record<string, string> = {
  'future-dark': 'apollo-future-dark',
  'future-light': 'apollo-future-light',
  dark: 'apollo-core-dark',
  light: 'apollo-core-light',
  'dark-hc': 'apollo-core-dark-hc',
  'light-hc': 'apollo-core-light-hc',
};

function getMonacoThemeName(): string {
  if (typeof document === 'undefined') return 'apollo-future-dark';
  const classes = Array.from(document.body.classList);
  const match = classes.find((c) => c in THEME_CLASS_MAP);
  return (match ? THEME_CLASS_MAP[match] : undefined) ?? 'apollo-future-dark';
}

function useMonacoTheme(): string {
  const [themeName, setThemeName] = useState(getMonacoThemeName);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeName(getMonacoThemeName()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return themeName;
}

// ────────────────────────────────────────────────────────────────────────────

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
  excludeStories: ['QuickFormPanel'],
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

// Panel tabs come from apollo-wind's PanelTabs, the same shell MetadataForm
// uses, so every panel's tab row and content spacing match.

// ============================================================================
// Stories: NodePropertyPanel
// ============================================================================

export const PanelUIInventory: Story = {
  name: 'UI Inventory',
  render: () => <PanelUIInventoryStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Tabs and inventory sections are deep-linkable. Use hashes such as `#ui-inventory/states` or `#ui-inventory/layout/text-fields` after the Storybook story URL to open a tab or section directly.',
      },
    },
  },
};

export const Responsive: Story = {
  name: 'UI Responsive',
  render: () => <ResponsiveStory />,
};

export const Default: Story = {
  name: 'Form Default',
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeIcon={<Globe />}
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        action={<RunButton />}
        schema={httpRequestForm}
        onClose={() => {}}
        className="h-[640px]"
      />
    </PanelFrame>
  ),
};

export const ChangedFields: Story = {
  name: 'Form Changed Fields',
  render: () => (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeIcon={<Globe />}
        nodeLabel="Fetch invoice details"
        nodeCategory="HTTP Request"
        action={<RunButton />}
        schema={httpRequestForm}
        changedFields={['endpoint', 'method']}
        onClose={() => {}}
        className="h-[640px]"
      />
    </PanelFrame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Pass `changedFields` (e.g. after an agent edit or in a diff view) to give every listed field a warning-toned accent, matching the canvas node `update` status, and a screen-reader "Changed" label. The first listed field (`endpoint`) is scrolled into view once. Omit the prop to flag none.',
      },
    },
  },
};

export const QuickForm: Story = {
  name: 'Form HITL',
  render: () => <QuickFormPanel />,
};

function IdentityValidationStory() {
  // Starts invalid (a leading digit), so the page opens on the error state that
  // sets it apart from Form Default. Rename it to clear the error.
  const [label, setLabel] = useState('2nd pass: Analyze files');
  const [description, setDescription] = useState('');

  // Stand-in for a host rule (here: an agent tool name). The editor is
  // controlled, so this runs on every keystroke and the message tracks the text
  // on screen — including after the editor closes on a value the host rejects.
  const labelError = !label
    ? 'Tool name is required.'
    : /^[A-Z_a-z][\w ]*$/.test(label)
      ? undefined
      : 'Tool name must begin with a letter or underscore and contain only letters, digits, spaces, and underscores.';

  return (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        nodeIcon={<Globe />}
        nodeLabel={label}
        nodeLabelPlaceholder="Name"
        nodeDescription={description}
        nodeDescriptionPlaceholder="Client-side tool"
        onNodeLabelChange={setLabel}
        onNodeLabelSubmit={setLabel}
        onNodeDescriptionChange={setDescription}
        onNodeDescriptionSubmit={setDescription}
        nodeLabelError={labelError}
        action={<RunButton />}
        schema={httpRequestForm}
        onClose={() => {}}
        className="h-[640px]"
      />
    </PanelFrame>
  );
}

export const IdentityValidation: Story = {
  name: 'Identity Validation',
  render: () => <IdentityValidationStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Opens on the error state: the node name starts with a digit, which the host rule rejects. Rename it to clear the error. `nodeLabelError` / `nodeDescriptionError` render below the line with a persistent error ring, matching `Input`: the control gets `aria-invalid` plus `aria-errormessage`, and the message renders through `FormFieldError` so it announces politely. The ring stays after the editor closes, so a commit the host rejects still explains itself.',
      },
    },
  },
};

export const EmbeddedNoTitleBar: Story = {
  name: 'Form Embedded',
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
  name: 'Form No Parameters',
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
// Stories: Expression Field (editor mockups)
// Full-height panel with all expression editor chrome: toolbar, mode switcher,
// undo/redo, AI assist, expand, and Insert variable affordance.
// ============================================================================

function FullEditorStory() {
  const monacoTheme = useMonacoTheme();
  const editorRef = useRef<Parameters<NonNullable<EditorProps['onMount']>>[0] | null>(null);
  const [label, setLabel] = useState('Script');
  const [category, setCategory] = useState('HTTP Request');
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const variables = useMemo<VariablePickerItem[]>(
    () => [
      {
        id: 'vars',
        label: '$vars',
        type: 'object',
        children: [
          {
            id: 'manual-trigger',
            label: 'manualTrigger1',
            type: 'object',
            children: [
              {
                id: 'customer-name',
                label: 'customerName',
                value: '$vars.manualTrigger1.customerName',
                type: 'string',
              },
              {
                id: 'invoice-id',
                label: 'invoiceId',
                value: '$vars.manualTrigger1.invoiceId',
                type: 'string',
              },
              {
                id: 'document-url',
                label: 'documentUrl',
                value: '$vars.manualTrigger1.documentUrl',
                type: 'string',
              },
            ],
          },
        ],
      },
      {
        id: 'metadata',
        label: '$metadata',
        type: 'object',
        children: [
          { id: 'run-id', label: 'runId', value: '$metadata.runId', type: 'string' },
          { id: 'started-at', label: 'startedAt', value: '$metadata.startedAt', type: 'string' },
        ],
      },
    ],
    []
  );

  const insertVariable = useCallback((item: VariablePickerItem) => {
    const editor = editorRef.current;
    const selection = editor?.getSelection();
    if (!editor || !selection || !item.value) return;

    editor.executeEdits('insert-variable', [
      { range: selection, text: item.value, forceMoveMarkers: true },
    ]);
    editor.focus();
  }, []);

  return (
    <PanelFrame>
      <NodePropertyPanel panelTitle="Properties" onClose={() => {}} className="h-[560px]">
        <div className="flex h-full flex-col">
          {/* Inline-editable identity row */}
          <div className="flex shrink-0 items-center justify-between gap-4 py-4 [padding-inline:var(--mf-content-inset,1rem)]">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle [&>svg]:size-5">
                <Code2 />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                {editingLabel ? (
                  <input
                    ref={labelRef}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={() => setEditingLabel(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false);
                    }}
                    className="w-full rounded bg-surface-overlay px-1.5 py-0.5 text-base font-semibold leading-5 tracking-[-0.3px] text-foreground outline-none ring-1 ring-brand"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLabel(true);
                      setTimeout(() => labelRef.current?.select(), 0);
                    }}
                    className="truncate rounded px-1.5 py-0.5 text-left text-base font-semibold leading-5 tracking-[-0.3px] text-foreground transition hover:bg-surface-overlay"
                  >
                    {label}
                  </button>
                )}
                {editingCategory ? (
                  <input
                    ref={categoryRef}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onBlur={() => setEditingCategory(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingCategory(false);
                    }}
                    className="w-full rounded bg-surface-overlay px-1.5 py-0.5 text-xs leading-4 text-foreground outline-none ring-1 ring-brand"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(true);
                      setTimeout(() => categoryRef.current?.select(), 0);
                    }}
                    className="truncate rounded px-1.5 py-0.5 text-left text-xs leading-4 text-foreground-muted transition hover:bg-surface-overlay"
                  >
                    {category}
                  </button>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <RunButton />
            </div>
          </div>

          {/* Tabs + editor */}
          <PanelTabs defaultValue="parameters">
            <PanelTabsList>
              <PanelTabsTrigger value="parameters">Parameters</PanelTabsTrigger>
              <PanelTabsTrigger value="error-handling">Error handling</PanelTabsTrigger>
              <PanelTabsTrigger value="advanced">Advanced</PanelTabsTrigger>
            </PanelTabsList>
            <PanelTabsContent
              value="parameters"
              padded={false}
              className="flex flex-col overflow-hidden"
            >
              <div className="flex shrink-0 items-center justify-between pt-1.5 pb-2 [padding-inline:var(--mf-content-inset,1rem)]">
                <FormFieldLabel className="leading-4">Path</FormFieldLabel>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label="AI assist"
                    title="AI assist"
                    className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                  >
                    <Sparkles size={12} />
                  </button>
                  <VariablePicker items={variables} onSelect={insertVariable} />
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col pb-4 [padding-inline:var(--mf-content-inset,1rem)]">
                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border-subtle">
                  <MonacoEditor
                    height="100%"
                    defaultLanguage="javascript"
                    defaultValue={
                      '// Script\nconst result = items\n  .filter(x => x.active)\n  .map(x => ({\n    id: x.id,\n    value: x.value,\n  }));\n\nreturn result;'
                    }
                    theme={monacoTheme}
                    beforeMount={registerMonacoThemes}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    options={{
                      fontSize: 13,
                      lineHeight: 20,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      padding: { top: 6, bottom: 16 },
                      lineNumbers: 'on',
                      lineNumbersMinChars: 2,
                      lineDecorationsWidth: 4,
                      glyphMargin: false,
                      folding: false,
                      renderLineHighlight: 'line',
                      hideCursorInOverviewRuler: true,
                      overviewRulerBorder: false,
                      scrollbar: {
                        vertical: 'auto',
                        horizontal: 'hidden',
                        alwaysConsumeMouseWheel: false,
                      },
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            </PanelTabsContent>
            <PanelTabsContent value="error-handling" />
            <PanelTabsContent value="advanced" />
          </PanelTabs>
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

export const FullEditor: Story = {
  name: 'Panel: Full Editor',
  render: () => <FullEditorStory />,
};

// ============================================================================
// Compact Editor: Switch/Case node with accordion case panels.
// ============================================================================

const COMPACT_EDITOR_OPTIONS = {
  fontSize: 13,
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  padding: { top: 6, bottom: 8 },
  lineNumbers: 'on',
  lineNumbersMinChars: 2,
  lineDecorationsWidth: 4,
  glyphMargin: false,
  folding: false,
  renderLineHighlight: 'line',
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  scrollbar: { vertical: 'auto', horizontal: 'hidden', alwaysConsumeMouseWheel: false },
  automaticLayout: true,
} as const;

const JSON_VIEWER_OPTIONS = {
  readOnly: true,
  fontSize: 12,
  lineHeight: 18,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  padding: { top: 8, bottom: 8 },
  lineNumbers: 'off' as const,
  lineDecorationsWidth: 0,
  glyphMargin: false,
  folding: true,
  renderLineHighlight: 'none' as const,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  scrollbar: {
    vertical: 'auto' as const,
    horizontal: 'auto' as const,
    alwaysConsumeMouseWheel: false,
  },
  automaticLayout: true,
} as const;

const JSON_EDITOR_OPTIONS = { ...JSON_VIEWER_OPTIONS, readOnly: false } as const;

const INLINE_EDITOR_OPTIONS = {
  fontSize: 13,
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  padding: { top: 10, bottom: 10 },
  lineNumbers: 'off',
  lineNumbersMinChars: 0,
  lineDecorationsWidth: 14,
  glyphMargin: false,
  folding: false,
  renderLineHighlight: 'none',
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  scrollbar: { vertical: 'hidden', horizontal: 'hidden', alwaysConsumeMouseWheel: false },
  automaticLayout: true,
} as const;

const INSERT_SNIPPETS = [
  { label: 'Input data', code: 'context.input' },
  { label: 'Item ID', code: 'item.id' },
  { label: 'Item name', code: 'item.name' },
  { label: 'Current index', code: 'index' },
  { label: 'Timestamp', code: 'Date.now()' },
  { label: 'True', code: 'true' },
  { label: 'False', code: 'false' },
  { label: 'Null', code: 'null' },
];

const QUICK_FORM_FIELD_VARIABLES = INSERT_SNIPPETS.map((snippet) => ({
  label: snippet.label,
  value: snippet.code,
}));

function CasePanel({
  caseTitle,
  onTitleChange,
  onDelete,
  monacoTheme,
  defaultExpanded = false,
  defaultValue = '',
  errorMessage,
  errorAction,
}: {
  caseTitle: string;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  monacoTheme: string;
  defaultExpanded?: boolean;
  defaultValue?: string;
  errorMessage?: string;
  errorAction?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Parameters<NonNullable<EditorProps['onMount']>>[0] | null>(null);
  const hasError = Boolean(errorMessage);

  const insertVariable = useCallback((item: VariablePickerItem) => {
    const editor = editorRef.current;
    const selection = editor?.getSelection();
    if (!editor || !selection || !item.value) return;
    editor.executeEdits('insert-variable', [
      { range: selection, text: item.value, forceMoveMarkers: true },
    ]);
    editor.focus();
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      {/* Card header */}
      <div className="group flex items-center gap-2 px-3 py-2.5">
        <div className="grid size-5 shrink-0 cursor-grab place-items-center text-foreground-subtle">
          <GripVertical size={12} />
        </div>
        <Button
          variant="ghost"
          size="4xs"
          icon
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse case' : 'Expand case'}
          className="shrink-0 rounded hover:bg-transparent text-foreground-subtle hover:text-foreground"
        >
          <ChevronDown
            size={12}
            className={cn('transition-transform duration-150', !expanded && '-rotate-90')}
          />
        </Button>
        {editingTitle ? (
          <input
            ref={titleRef}
            value={caseTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false);
            }}
            className="flex-1 rounded bg-surface-overlay px-1 py-0.5 text-xs font-medium text-foreground outline-none ring-1 ring-brand"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingTitle(true);
              setTimeout(() => titleRef.current?.select(), 0);
            }}
            className="flex min-w-0 flex-1 items-center rounded px-1 py-0.5 text-left text-xs font-medium text-foreground transition hover:bg-surface-overlay"
          >
            {caseTitle}
          </button>
        )}
        {hasError && (
          <Badge variant="error" className="h-5 gap-1 px-1.5 text-[10px] font-medium">
            <CircleAlert size={10} />1
          </Badge>
        )}
        <Button
          variant="ghost"
          size="4xs"
          icon
          onClick={onDelete}
          aria-label="Delete case"
          title="Delete case"
          className="shrink-0 rounded hover:bg-transparent text-foreground-subtle opacity-0 hover:text-foreground group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </Button>
      </div>

      {expanded && (
        <>
          {/* Condition label + buttons */}
          <div className="flex items-center justify-between border-t border-border-subtle px-3 py-2">
            <FormFieldLabel className="leading-4">Condition</FormFieldLabel>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="AI assist"
                title="AI assist"
                className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
              >
                <Sparkles size={12} />
              </button>
              <VariablePicker
                items={[
                  {
                    id: 'vars',
                    label: '$vars',
                    type: 'object',
                    children: INSERT_SNIPPETS.map((snippet) => ({
                      id: snippet.code,
                      label: snippet.label,
                      value: snippet.code,
                      type: 'string',
                    })),
                  },
                ]}
                onSelect={insertVariable}
              />
            </div>
          </div>
          <div className="px-3 pb-3">
            <div
              className={cn(
                'relative overflow-hidden rounded-xl border',
                hasError ? 'border-error' : 'border-border-subtle'
              )}
              style={{ height: '120px' }}
            >
              <MonacoEditor
                height="100%"
                defaultLanguage="javascript"
                defaultValue={defaultValue}
                theme={monacoTheme}
                beforeMount={registerMonacoThemes}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                options={COMPACT_EDITOR_OPTIONS}
              />
            </div>
            {hasError && errorMessage && (
              <InlineValidationMessage message={errorMessage} action={errorAction} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TabLabelWithError({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span
        title={`${count} issue${count === 1 ? '' : 's'}`}
        className="grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-error-background"
      >
        {count}
      </span>
    </span>
  );
}

function InlineValidationMessage({ message, action }: { message: string; action?: string }) {
  return (
    <div className="mt-2 px-0.5 py-1 text-xs">
      <p className="leading-4 text-error">{message}</p>
      {action && <p className="mt-0.5 leading-4 text-foreground-muted">{action}</p>}
    </div>
  );
}

function ErrorFieldBlock({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-error/50 bg-error-background/25 p-3">
      <div className="flex items-start gap-2">
        <CircleAlert size={14} className="mt-0.5 shrink-0 text-error" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-4 text-error">{message}</p>
          <p className="mt-1 text-xs leading-4 text-foreground-muted">{action}</p>
        </div>
      </div>
    </div>
  );
}

function InfoFieldBlock({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-info/30 bg-info-background/10 p-3">
      <div className="flex items-start gap-2">
        <Info size={14} className="mt-0.5 shrink-0 text-info" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-4 text-foreground-muted">{message}</p>
          <p className="mt-1 text-xs leading-4 text-foreground-muted">{action}</p>
        </div>
      </div>
    </div>
  );
}

function WarningFieldBlock({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-warning/50 bg-warning-background/25 p-3">
      <div className="flex items-start gap-2">
        <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-4 text-warning">{message}</p>
          <p className="mt-1 text-xs leading-4 text-foreground-muted">{action}</p>
        </div>
      </div>
    </div>
  );
}

function SuccessFieldBlock({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-success/50 bg-success-background/25 p-3">
      <div className="flex items-start gap-2">
        <CircleCheck size={14} className="mt-0.5 shrink-0 text-success" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-4 text-success">{message}</p>
          <p className="mt-1 text-xs leading-4 text-foreground-muted">{action}</p>
        </div>
      </div>
    </div>
  );
}

function CompactEditorStory() {
  const monacoTheme = useMonacoTheme();
  const [cases, setCases] = useState([{ id: 1, title: 'Case 1' }]);
  const nextIdRef = useRef(2);
  const [defaultBranch, setDefaultBranch] = useState(false);

  const addCase = () => {
    const id = nextIdRef.current++;
    setCases((prev) => [...prev, { id, title: `Case ${id}` }]);
  };
  const deleteCase = (id: number) => setCases((prev) => prev.filter((c) => c.id !== id));
  const updateCaseTitle = (id: number, title: string) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  const [label, setLabel] = useState('Switch');
  const [category, setCategory] = useState('Control');
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);

  return (
    <PanelFrame>
      <NodePropertyPanel panelTitle="Properties" onClose={() => {}} className="h-[640px]">
        <div className="flex h-full flex-col">
          {/* Inline-editable identity row */}
          <div className="flex shrink-0 items-center justify-between gap-4 py-4 [padding-inline:var(--mf-content-inset,1rem)]">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle [&>svg]:size-5">
                <GitFork />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                {editingLabel ? (
                  <input
                    ref={labelRef}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={() => setEditingLabel(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false);
                    }}
                    className="w-full rounded bg-surface-overlay px-1.5 py-0.5 text-base font-semibold leading-5 tracking-[-0.3px] text-foreground outline-none ring-1 ring-brand"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLabel(true);
                      setTimeout(() => labelRef.current?.select(), 0);
                    }}
                    className="truncate rounded px-1.5 py-0.5 text-left text-base font-semibold leading-5 tracking-[-0.3px] text-foreground transition hover:bg-surface-overlay"
                  >
                    {label}
                  </button>
                )}
                {editingCategory ? (
                  <input
                    ref={categoryRef}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onBlur={() => setEditingCategory(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingCategory(false);
                    }}
                    className="w-full rounded bg-surface-overlay px-1.5 py-0.5 text-xs leading-4 text-foreground outline-none ring-1 ring-brand"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(true);
                      setTimeout(() => categoryRef.current?.select(), 0);
                    }}
                    className="truncate rounded px-1.5 py-0.5 text-left text-xs leading-4 text-foreground-muted transition hover:bg-surface-overlay"
                  >
                    {category}
                  </button>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <RunButton />
            </div>
          </div>

          <PanelTabs defaultValue="parameters">
            <PanelTabsList>
              <PanelTabsTrigger value="parameters">Parameters</PanelTabsTrigger>
              <PanelTabsTrigger value="error-handling">Error handling</PanelTabsTrigger>
              <PanelTabsTrigger value="advanced">Advanced</PanelTabsTrigger>
            </PanelTabsList>

            <PanelTabsContent value="parameters" padded={false}>
              {/* Cases field label row */}
              <div className="flex pt-1.5 pb-2 [padding-inline:var(--mf-content-inset,1rem)]">
                <span className="text-xs font-medium leading-4 text-foreground">Cases</span>
              </div>

              {/* Case accordion panels: inset cards with gap */}
              <div className="flex flex-col gap-2 pb-1 [padding-inline:var(--mf-content-inset,1rem)]">
                {cases.map((c, i) => (
                  <CasePanel
                    key={c.id}
                    caseTitle={c.title}
                    onTitleChange={(title) => updateCaseTitle(c.id, title)}
                    onDelete={() => deleteCase(c.id)}
                    monacoTheme={monacoTheme}
                    defaultExpanded={i === 0}
                    defaultValue={i === 0 ? 'input.status === "active"' : ''}
                  />
                ))}
              </div>

              {/* Add case */}
              <button
                type="button"
                onClick={addCase}
                className="flex cursor-pointer items-center gap-1.5 py-3 text-xs text-brand transition hover:text-brand-hover [padding-inline:var(--mf-content-inset,1rem)]"
              >
                <Plus size={12} />
                Add case
              </button>

              {/* Default branch toggle */}
              <div className="flex items-center gap-2 py-3 [padding-inline:var(--mf-content-inset,1rem)]">
                <Switch size="sm" checked={defaultBranch} onCheckedChange={setDefaultBranch} />
                <span className="text-xs text-foreground-muted">Default branch</span>
              </div>
            </PanelTabsContent>

            <PanelTabsContent value="error-handling" />
            <PanelTabsContent value="advanced" />
          </PanelTabs>
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

export const CompactEditor: Story = {
  name: 'Panel: Compact Editor',
  render: () => <CompactEditorStory />,
};

// ============================================================================
// Input Editor
// Inline expression inputs: one per case, no code editor panel.
// ============================================================================

function InlineCaseRow({
  caseTitle,
  onTitleChange,
  defaultValue = '',
}: {
  caseTitle: string;
  onTitleChange: (title: string) => void;
  defaultValue?: string;
}) {
  const fieldId = useId();
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [locked, setLocked] = useState(false);
  const [mode, setMode] = useState<QuickFormFieldMode>('literal');

  return (
    <QuickFormField
      id={fieldId}
      label={
        <div className="flex min-w-0 flex-1 items-center">
          {editingTitle ? (
            <input
              ref={titleRef}
              value={caseTitle}
              onChange={(event) => onTitleChange(event.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Escape') setEditingTitle(false);
              }}
              className="min-w-0 flex-1 rounded bg-surface-overlay px-1 py-0.5 text-xs font-medium leading-4 text-foreground outline-none ring-1 ring-brand"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingTitle(true);
                setTimeout(() => titleRef.current?.select(), 0);
              }}
              className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-xs font-medium leading-4 text-foreground transition hover:bg-surface-overlay"
            >
              {caseTitle}
            </button>
          )}
        </div>
      }
      value={value}
      onValueChange={setValue}
      locked={locked}
      onLockedChange={setLocked}
      mode={mode}
      onModeChange={setMode}
      fieldType="string"
      variables={QUICK_FORM_FIELD_VARIABLES}
    />
  );
}

function InputEditorStory() {
  const [cases, setCases] = useState([{ id: 1, title: 'Return value' }]);
  const nextIdRef = useRef(2);
  const [defaultBranch, setDefaultBranch] = useState(false);
  const [label, setLabel] = useState('End');
  const [description, setDescription] = useState('');

  const addCase = () => {
    const id = nextIdRef.current++;
    setCases((prev) => [...prev, { id, title: `Output variable ${id}` }]);
  };
  const updateCaseTitle = (id: number, title: string) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));

  return (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle="Properties"
        onClose={() => {}}
        className="h-[640px]"
        nodeIcon={<CircleCheck />}
        nodeLabel={label}
        nodeLabelPlaceholder="Control"
        nodeDescription={description}
        nodeDescriptionPlaceholder="Control"
        onNodeLabelChange={setLabel}
        onNodeLabelSubmit={setLabel}
        onNodeDescriptionChange={setDescription}
        onNodeDescriptionSubmit={setDescription}
        action={<RunButton />}
      >
        <div className="flex h-full flex-col">
          {/* Tabs */}
          <PanelTabs defaultValue="parameters">
            <PanelTabsList>
              <PanelTabsTrigger value="parameters">Parameters</PanelTabsTrigger>
              <PanelTabsTrigger value="error-handling">Error handling</PanelTabsTrigger>
              <PanelTabsTrigger value="advanced">Advanced</PanelTabsTrigger>
            </PanelTabsList>
            <PanelTabsContent value="parameters" padded={false}>
              <div className="flex pt-1.5 pb-2 [padding-inline:var(--mf-content-inset,1rem)]">
                <span className="text-xs font-medium leading-4 text-foreground">
                  Output messaging
                </span>
              </div>
              <div className="flex flex-col gap-3 pb-1 [padding-inline:var(--mf-content-inset,1rem)]">
                {cases.map((c) => (
                  <InlineCaseRow
                    key={c.id}
                    caseTitle={c.title}
                    onTitleChange={(title) => updateCaseTitle(c.id, title)}
                    defaultValue=""
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={addCase}
                className="flex cursor-pointer items-center gap-1.5 py-3 text-xs text-brand transition hover:text-brand-hover [padding-inline:var(--mf-content-inset,1rem)]"
              >
                <Plus size={12} />
                Add output variable
              </button>
              <div className="flex items-center gap-2 py-3 [padding-inline:var(--mf-content-inset,1rem)]">
                <Switch size="sm" checked={defaultBranch} onCheckedChange={setDefaultBranch} />
                <span className="text-xs text-foreground-muted">Default branch</span>
              </div>
            </PanelTabsContent>
            <PanelTabsContent value="error-handling" />
            <PanelTabsContent value="advanced" />
          </PanelTabs>
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

export const InputEditor: Story = {
  name: 'Panel: Inline Editor',
  render: () => <InputEditorStory />,
};

export const Variables: Story = {
  name: 'Variables',
  render: () => <VariablesStory />,
  parameters: {
    docs: {
      description: {
        story:
          'A single-panel flow-workbench example for browsing node inputs, outputs, and flow variables. The hierarchy stays visible while variable rows remain directly editable.',
      },
    },
  },
};

export const Output: Story = {
  name: 'Input / Output',
  render: () => <InputOutputStory />,
  parameters: { layout: 'fullscreen' },
};

// ============================================================================
// Input / Output
// ============================================================================

/**
 * The flow-workbench Input and Output panels, built from `NodeIOView` with the
 * same setup as the 3 Column story: Input offers the "referenced" filter, and
 * Output has its mode select at the end of the toolbar.
 */
function InputOutputStory() {
  const [inputValue, setInputValue] = useState<JsonContainer | undefined>(INPUT_VALUE);
  const [outputValue, setOutputValue] = useState<JsonContainer | undefined>(OUTPUT_VALUE);
  const [mode, setMode] = useState<(typeof APOLLO_MODES)[number]>('live');
  // The mocked output is editable only in Static mode.
  const isStatic = mode === 'static';

  const panel = (title: string, view: ReactNode) => (
    <PanelFrame>
      <NodePropertyPanel panelTitle={title} onClose={() => {}} className="h-[640px]">
        <div className="flex h-full flex-col">{view}</div>
      </NodePropertyPanel>
    </PanelFrame>
  );

  return (
    <div className="flex items-start justify-center gap-4 p-8">
      {panel(
        'Input',
        <NodeIOView
          className="min-h-0 flex-1"
          inset
          schema={INPUT_SCHEMA}
          value={inputValue}
          onValueChange={setInputValue}
          searchPlaceholder="Search inputs..."
          filters={INPUT_FILTERS}
          decorateNode={decorateNodeHeader}
          deriveTypeIcon={deriveFileTypeIcon}
          renderValue={renderFileValueCell}
          renderCodeEditor={renderJsonCodeEditor}
          pathForCopy={(path) => `$vars.${path}`}
        />
      )}
      {panel(
        'Output',
        <NodeIOView
          className="min-h-0 flex-1"
          inset
          toolbarTrailing={
            <NodeOutputModeSelect
              value={mode}
              onChange={(m) => setMode(m as (typeof APOLLO_MODES)[number])}
            />
          }
          schema={OUTPUT_SCHEMA}
          value={outputValue}
          readOnly={!isStatic}
          onValueChange={isStatic ? setOutputValue : undefined}
          searchPlaceholder="Search output..."
          decorateNode={decorateNodeHeader}
          deriveTypeIcon={deriveFileTypeIcon}
          renderValue={renderFileValueCell}
          renderCodeEditor={renderJsonCodeEditor}
          pathForCopy={(path) => `$vars.${path}`}
        />
      )}
      <Toaster />
    </div>
  );
}

// ============================================================================
// Variables panel
// ============================================================================

// Node icons as flow-workbench resolves them: the manifest's icon name through
// CanvasIcon (single color), and connectors with their full-color brand logo.
const nodeIcon = (name: string) => <CanvasIcon icon={name} size={11} />;
const brandLogo = (file: string) => <img src={`brand/${file}`} alt="" className="size-2.75" />;

/** A node output whose shape is known but whose fields are not loaded yet. */
const OPAQUE_OUTPUT: JsonSchema = {
  type: 'object',
  properties: { output: { type: 'object' } },
};

const VARIABLES_PANEL_INPUTS: NodeVariablesSource[] = [
  { id: 'manualTrigger1', label: 'Manual trigger', icon: nodeIcon('play') },
  { id: 'scheduledTrigger1', label: 'Scheduled trigger', icon: nodeIcon('calendar-clock') },
  {
    id: 'messageReceivedInSlack1',
    label: 'Message received in Slack',
    // Connectors always use their full-color logo.
    icon: brandLogo('slack.svg'),
    schema: {
      type: 'object',
      properties: {
        output: {
          type: 'object',
          properties: {
            channel_name: { type: 'string' },
            event: {
              type: 'object',
              properties: { event_ts: { type: 'string' }, subtype: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  { id: 'httpWebhook1', label: 'HTTP webhook', icon: nodeIcon('webhook'), schema: OPAQUE_OUTPUT },
  {
    id: 'incomingCall1',
    label: 'Incoming call',
    icon: nodeIcon('phone-incoming'),
    schema: OPAQUE_OUTPUT,
  },
  {
    id: 'conversationTrigger1',
    label: 'Conversation trigger',
    icon: nodeIcon('messages-square'),
    schema: OPAQUE_OUTPUT,
  },
];

// Output schema helpers for the sample flow.
const STRING: JsonSchema = { type: 'string' };
const NUMBER: JsonSchema = { type: 'number' };
const BOOLEAN: JsonSchema = { type: 'boolean' };
const object = (properties: Record<string, JsonSchema>): JsonSchema => ({
  type: 'object',
  properties,
});
const list = (items: JsonSchema): JsonSchema => ({ type: 'array', items });
const ERROR = object({ code: STRING, message: STRING });

/** A flow node whose top-level outputs (each with child fields) come from its schema. */
const flowNode = (
  id: string,
  label: string,
  icon: ReactNode,
  outputs: Record<string, JsonSchema>
): NodeVariablesSource => ({ id, label, icon, schema: object(outputs) });

// One node per display name, as a real flow would have.
const VARIABLES_PANEL_NODES: NodeVariablesSource[] = [
  flowNode('autonomousAgent1', 'Autonomous agent', nodeIcon('autonomous-agent'), {
    output: object({ response: STRING, toolCalls: list(object({ name: STRING })) }),
  }),
  flowNode('conversationalAgent1', 'Conversational agent', nodeIcon('conversational-agent'), {
    output: object({ reply: STRING, conversationId: STRING }),
  }),
  flowNode('voiceAgent1', 'Voice agent', nodeIcon('phone'), {
    output: object({ transcript: STRING, durationSeconds: NUMBER }),
  }),
  flowNode('sendMessageToChannel1', 'Send message', brandLogo('slack.svg'), {
    output: object({ ts: STRING, channel: STRING }),
    error: ERROR,
  }),
  flowNode('batchTransform1', 'Batch transform', nodeIcon('grid-2x2-plus'), {
    output: object({ rows: list(object({ id: STRING })), rowCount: NUMBER }),
  }),
  flowNode('filter1', 'Filter', nodeIcon('list-filter'), {
    output: object({ items: list(object({ id: STRING })), count: NUMBER }),
  }),
  flowNode('groupBy1', 'Group by', nodeIcon('group'), {
    output: object({ groups: list(object({ key: STRING, count: NUMBER })) }),
  }),
  flowNode('map1', 'Map', nodeIcon('arrow-right'), {
    output: object({ items: list(object({ id: STRING })) }),
  }),
  flowNode('transform1', 'Transform', nodeIcon('a-large-small'), {
    output: object({ result: STRING }),
  }),
  flowNode('readEntity1', 'Query entity records', nodeIcon('layers-arrow-up-right'), {
    output: object({ records: list(object({ Id: STRING, Name: STRING })), totalCount: NUMBER }),
  }),
  flowNode('updateEntity1', 'Update entity record', nodeIcon('layers-arrow-up-right'), {
    output: object({ Id: STRING, UpdateTime: STRING }),
  }),
  flowNode('summarize1', 'Summarize', nodeIcon('sigma'), {
    output: object({ summary: STRING, sources: list(STRING) }),
  }),
  flowNode('extractV21', 'Extract', nodeIcon('file-text'), {
    output: object({
      fields: object({ invoiceNumber: STRING, total: NUMBER }),
      confidence: NUMBER,
    }),
  }),
  flowNode('quickForm1', 'Quick form', nodeIcon('users'), {
    output: object({ approved: BOOLEAN, comment: STRING }),
    assignee: object({ email: STRING, name: STRING }),
  }),
  flowNode('actionApp1', 'Action app', nodeIcon('users'), {
    output: object({ action: STRING, data: object({}) }),
    assignee: object({ email: STRING, name: STRING }),
  }),
  flowNode('mock1', 'Mock', nodeIcon('square-dashed'), {
    output: object({ value: STRING }),
  }),
  flowNode('decision1', 'Decision', nodeIcon('trending-up-down'), {
    output: object({ result: BOOLEAN }),
    branch: object({ name: STRING }),
  }),
  flowNode('switch1', 'Switch', nodeIcon('between-horizontal-start'), {
    output: object({ matchedCase: STRING }),
    branch: object({ name: STRING }),
  }),
  flowNode('loop1', 'Loop', nodeIcon('repeat'), {
    output: object({ results: list(object({ status: STRING })) }),
    currentItem: object({ id: STRING }),
    index: NUMBER,
    error: ERROR,
  }),
  flowNode('script1', 'Script', nodeIcon('code'), {
    output: object({ result: STRING, logs: list(STRING) }),
  }),
  flowNode('waitForMessage1', 'Wait for message', nodeIcon('message-square-more'), {
    output: object({ message: STRING, receivedAt: STRING }),
  }),
  flowNode('getConversationContext1', 'Get conversation context', nodeIcon('message-square-text'), {
    output: object({ history: list(object({ role: STRING, text: STRING })) }),
  }),
  flowNode('createQueueItem1', 'Create queue item', nodeIcon('list-plus'), {
    output: object({ itemId: STRING, status: STRING }),
  }),
  flowNode('createAndWaitForQueueItem1', 'Create and wait for queue item', nodeIcon('list-plus'), {
    output: object({ itemId: STRING, result: object({ status: STRING }) }),
  }),
  flowNode('createOutgoingCall1', 'Create outgoing call', nodeIcon('phone-outgoing'), {
    output: object({ callId: STRING, status: STRING }),
  }),
  flowNode('endCall1', 'End call', nodeIcon('phone-off'), {
    output: object({ endedAt: STRING }),
  }),
  flowNode('httpWebhook2', 'HTTP webhook 2', nodeIcon('webhook'), {
    output: object({ body: object({}), headers: object({}) }),
  }),
  flowNode('emailReceived2', 'Email received (wait)', brandLogo('google-gmail.svg'), {
    output: object({ from: STRING, subject: STRING }),
  }),
  flowNode('subflow1', 'Subflow', nodeIcon('layers'), {}),
  flowNode('httpRequest2', 'HTTP request 2', nodeIcon('app-window'), {
    output: object({ statusCode: NUMBER, body: object({}) }),
  }),
  flowNode('uploadFile1', 'Upload file', brandLogo('google-drive.svg'), {
    output: object({ fileId: STRING, webViewLink: STRING }),
    file: object({ name: STRING, size: NUMBER }),
    error: ERROR,
  }),
];

// The flow's declared outputs, with sample values from the last run.
const VARIABLES_PANEL_OUTPUTS = {
  schema: object({
    approvalStatus: { type: 'string', description: 'Approved, rejected, or escalated' },
    invoiceTotal: NUMBER,
    approvedBy: object({ name: STRING, email: STRING }),
    lineItems: list(object({ sku: STRING, quantity: NUMBER, amount: NUMBER })),
  }),
  value: {
    approvalStatus: 'approved',
    invoiceTotal: 1840.5,
    approvedBy: { name: 'Dana Whitfield', email: 'dana.whitfield@example.com' },
    lineItems: [
      { sku: 'SKU-1001', quantity: 4, amount: 960 },
      { sku: 'SKU-2040', quantity: 1, amount: 880.5 },
    ],
  },
};

const VARIABLES_PANEL_VARIABLES = {
  schema: object({
    flowTest: { type: 'string', description: 'Banner shown on the approval request' },
    flowConfig: object({ region: STRING, retryCount: NUMBER }),
    flowArray: list(STRING),
    flowBoolean: { type: 'boolean', description: 'Whether the invoice needs a second approver' },
  }),
  value: {
    flowTest: 'Invoice approval required',
    flowConfig: { region: 'us-east', retryCount: 3 },
    flowArray: ['INV-2041', 'INV-2042', 'INV-2043'],
    flowBoolean: true,
  } as JsonObject,
};

/** A variable's schema as the Edit variable dialog saved it. */
const variableSchema = ({ type, description, defaultValue }: NodeVariableDetails): JsonSchema => ({
  type,
  ...(description && { description }),
  ...(defaultValue !== undefined && { default: defaultValue }),
});

function VariablesStory() {
  const [variables, setVariables] = useState(VARIABLES_PANEL_VARIABLES);
  const properties = variables.schema.properties ?? {};

  const addVariable = () => {
    // First unused name, so adding after a delete never overwrites a variable.
    let suffix = Object.keys(properties).length + 1;
    while (`flowVariable${suffix}` in properties) suffix += 1;
    const name = `flowVariable${suffix}`;
    setVariables((current) => ({
      schema: object({ ...current.schema.properties, [name]: STRING }),
      value: { ...current.value, [name]: '' },
    }));
    toast.success(`Added ${name}`);
  };
  // Saving keeps the variable's place; a changed id renames it.
  const editVariable = (name: string, next: NodeVariableDetails) =>
    setVariables((current) => ({
      schema: object(
        Object.fromEntries(
          Object.entries(current.schema.properties ?? {}).map(([key, schema]) =>
            key === name ? [next.id, variableSchema(next)] : [key, schema]
          )
        )
      ),
      value: Object.fromEntries(
        Object.entries(current.value).flatMap(([key, value]) =>
          key !== name
            ? [[key, value]]
            : next.defaultValue === undefined
              ? []
              : [[next.id, next.defaultValue]]
        )
      ),
    }));
  const deleteVariable = (name: string) =>
    setVariables((current) => ({
      schema: object(
        Object.fromEntries(
          Object.entries(current.schema.properties ?? {}).filter(([key]) => key !== name)
        )
      ),
      value: Object.fromEntries(Object.entries(current.value).filter(([key]) => key !== name)),
    }));

  // The tabs share the panel's toolbar row: passed as `leading` on the Variables
  // tab, and on their own row (same position) on the Properties tab. Each tab
  // mounts its own copy, so switching remounts the triggers; move focus to the
  // new active trigger so keyboard users stay in the tablist.
  const [activeTab, setActiveTab] = useState('variables');
  const tabsRef = useRef<HTMLDivElement>(null);
  const changeTab = (next: string) => {
    const focusInTabs = document.activeElement?.getAttribute('role') === 'tab';
    setActiveTab(next);
    if (focusInTabs) {
      requestAnimationFrame(() =>
        tabsRef.current?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')?.focus()
      );
    }
  };
  const tabList = (
    <PanelTabsStrip>
      <PanelTabsTrigger value="properties">Properties</PanelTabsTrigger>
      <PanelTabsTrigger value="variables">Variables</PanelTabsTrigger>
    </PanelTabsStrip>
  );

  return (
    <div className="flex flex-col gap-4 overflow-x-auto p-8">
      <PanelFrame>
        <NodePropertyPanel panelTitle="Properties" onClose={() => {}} className="h-[760px]">
          <PanelTabs
            ref={tabsRef}
            value={activeTab}
            onValueChange={changeTab}
            className="h-full font-sans"
          >
            <PanelTabsContent
              value="properties"
              padded={false}
              className="flex-col data-[state=active]:flex"
            >
              {/* Same row as NodeVariablesPanel's toolbar, so the tabs don't move. */}
              <div className="flex shrink-0 items-center pt-4 pb-2 [padding-inline:var(--mf-content-inset)]">
                {tabList}
              </div>
              <div className="mt-1 [padding-inline:var(--mf-content-inset)]">
                <div className="rounded-lg border border-border-subtle bg-surface-overlay/30 p-4 text-xs text-foreground-muted">
                  Select a node to view its editable properties.
                </div>
              </div>
            </PanelTabsContent>
            <PanelTabsContent
              value="variables"
              padded={false}
              className="flex-col overflow-hidden data-[state=active]:flex"
            >
              <NodeVariablesPanel
                inputs={VARIABLES_PANEL_INPUTS}
                outputs={VARIABLES_PANEL_OUTPUTS}
                variables={variables}
                nodes={VARIABLES_PANEL_NODES}
                selectedNodeId="messageReceivedInSlack1"
                onFocusNode={(nodeId) => toast(`Focused ${nodeId}`)}
                onAdd={(section, nodeId) =>
                  section === 'variables'
                    ? addVariable()
                    : toast(nodeId ? `Add from ${nodeId}` : `Add to ${section}`)
                }
                onEditVariable={editVariable}
                onDeleteVariable={deleteVariable}
                onCopy={({ text }) => toast.success(`Copied ${text}`)}
                leading={tabList}
              />
            </PanelTabsContent>
          </PanelTabs>
        </NodePropertyPanel>
      </PanelFrame>
      <Toaster />
    </div>
  );
}

// ============================================================================
// Prototype: QuickFormField
// ============================================================================

interface QuickFormFieldCase {
  id: number;
  title: string;
  required: boolean;
  value: string;
  locked: boolean;
  mode: QuickFormFieldMode;
  fieldType: QuickFieldType;
}

/** Guards against malformed JSON (e.g. from hand-editing the schema view) reaching setCases -- a
 *  missing/wrong-typed id would break Sortable, and an unknown fieldType would break rendering. */
function isValidQuickFormFieldCase(item: unknown): item is QuickFormFieldCase {
  if (typeof item !== 'object' || item === null) return false;
  const c = item as Record<string, unknown>;
  return (
    typeof c.id === 'number' &&
    Number.isSafeInteger(c.id) &&
    c.id > 0 &&
    typeof c.title === 'string' &&
    typeof c.required === 'boolean' &&
    typeof c.value === 'string' &&
    typeof c.locked === 'boolean' &&
    (c.mode === 'literal' || c.mode === 'expression') &&
    typeof c.fieldType === 'string' &&
    Object.hasOwn(FIELD_TYPE_META, c.fieldType)
  );
}

const DEFAULT_QUICK_FORM_FIELD_CASES: QuickFormFieldCase[] = [
  {
    id: 1,
    title: 'Invoice Number',
    required: true,
    value: '',
    locked: true,
    mode: 'literal',
    fieldType: 'string',
  },
  {
    id: 2,
    title: 'Submission Date',
    required: true,
    value: '',
    locked: true,
    mode: 'literal',
    fieldType: 'date',
  },
  {
    id: 3,
    title: 'Approved Amount',
    required: true,
    value: '',
    locked: true,
    mode: 'literal',
    fieldType: 'integer',
  },
];

function QuickFormFieldCaseRow({
  id,
  caseTitle,
  onTitleChange,
  required,
  onRequiredChange,
  onDelete,
  value,
  onValueChange,
  locked,
  onLockedChange,
  mode,
  onModeChange,
  fieldType,
  onFieldTypeChange,
  compact,
  controlsVisibility,
  monacoTheme,
  insertBefore,
  insertAfter,
}: {
  id: number;
  caseTitle: string;
  onTitleChange: (title: string) => void;
  required: boolean;
  onRequiredChange: (required: boolean) => void;
  onDelete: () => void;
  value: string;
  onValueChange: (value: string) => void;
  locked: boolean;
  onLockedChange: (locked: boolean) => void;
  mode: QuickFormFieldMode;
  onModeChange: (mode: QuickFormFieldMode) => void;
  fieldType: QuickFieldType;
  onFieldTypeChange: (fieldType: QuickFieldType) => void;
  compact?: boolean;
  controlsVisibility?: 'visible' | 'hover';
  monacoTheme: string;
  /** Shows the insertion line above this row (the dragged item would land here). */
  insertBefore?: boolean;
  /** Shows the insertion line below this row (the dragged item would land here). */
  insertAfter?: boolean;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group relative"
    >
      {/* Rendered as a child of this row's own transformed wrapper (not an
          outer sibling) so it moves in lockstep with the row during the
          sortable reflow animation instead of drifting out of sync. */}
      {insertBefore && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-2 z-10 h-0.5 rounded-full bg-brand"
        />
      )}
      <div
        className={cn(isDragging && 'rounded-lg border-2 border-dashed border-brand/50 opacity-50')}
      >
        <QuickFormField
          id={`return-value-${id}`}
          label={
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
                title="Drag to reorder"
                className="grid size-5 shrink-0 touch-none place-items-center rounded text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground [cursor:grab]"
              >
                <GripVertical size={12} />
              </button>
              {editingTitle ? (
                <input
                  ref={titleRef}
                  value={caseTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="min-w-0 flex-1 rounded bg-surface-overlay px-1 py-0.5 text-xs font-medium text-foreground outline-none ring-1 ring-brand"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTitle(true);
                    setTimeout(() => titleRef.current?.select(), 0);
                  }}
                  title={caseTitle}
                  className="flex min-w-0 items-center rounded px-1 py-0.5 text-left text-xs font-medium text-foreground transition hover:bg-surface-overlay"
                >
                  {/* Single-line header row, so the title ellipsizes. The
                      indicator sits outside the truncated run so the ellipsis
                      cannot swallow it. */}
                  <span className="truncate">{caseTitle}</span>
                  {required && <RequiredIndicator className="shrink-0" />}
                </button>
              )}
            </div>
          }
          headerActions={
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete field"
              title="Delete field"
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground',
                controlsVisibility === 'hover' &&
                  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100'
              )}
            >
              <Trash2 size={12} />
            </button>
          }
          value={value}
          onValueChange={onValueChange}
          locked={locked}
          onLockedChange={onLockedChange}
          mode={mode}
          onModeChange={onModeChange}
          renderExpressionEditor={({ id, value, onValueChange, onBlur, readOnly, placeholder }) => (
            <div className="relative h-10 min-w-0 flex-1 overflow-visible" onBlur={onBlur}>
              <MonacoEditor
                height="40px"
                language="javascript"
                value={value}
                onChange={(nextValue) => onValueChange?.(nextValue ?? '')}
                theme={monacoTheme}
                beforeMount={registerMonacoThemes}
                options={{ ...INLINE_EDITOR_OPTIONS, readOnly, fixedOverflowWidgets: true }}
              />
              {value === '' && (
                <label
                  htmlFor={id}
                  className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 font-mono text-[13px] text-foreground-subtle"
                >
                  {placeholder}
                </label>
              )}
            </div>
          )}
          fieldType={fieldType}
          onFieldTypeChange={onFieldTypeChange}
          required={required}
          onRequiredChange={onRequiredChange}
          variables={QUICK_FORM_FIELD_VARIABLES}
          compact={compact}
        />
      </div>
      {insertAfter && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-2 z-10 h-0.5 rounded-full bg-brand"
        />
      )}
    </div>
  );
}

interface FormButtonItem {
  id: number;
  label: string;
  variant: 'default' | 'outline';
}

const DEFAULT_FORM_BUTTONS: FormButtonItem[] = [
  { id: 1, label: 'Approve', variant: 'default' },
  { id: 2, label: 'Cancel', variant: 'outline' },
];

function FormButtonChip({
  label,
  onLabelChange,
  variant,
  onVariantChange,
  onDelete,
}: {
  label: string;
  onLabelChange: (label: string) => void;
  variant: 'default' | 'outline';
  onVariantChange: (variant: 'default' | 'outline') => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        'group/button flex h-10 items-stretch overflow-hidden rounded-lg text-sm font-semibold transition',
        variant === 'default'
          ? 'bg-brand text-foreground-on-accent'
          : 'border border-input bg-background text-foreground future:border-border-subtle future:text-muted-foreground'
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setEditing(false);
          }}
          autoFocus
          size={Math.max(label.length, 4)}
          className="bg-transparent px-3 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setTimeout(() => inputRef.current?.select(), 0);
          }}
          className={cn(
            'px-4 transition',
            variant === 'default'
              ? 'hover:bg-brand-hover'
              : 'hover:bg-accent hover:text-accent-foreground future:hover:text-foreground'
          )}
        >
          {label}
        </button>
      )}
      <Popover>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Edit button"
                  className={cn(
                    'grid w-0 shrink-0 place-items-center overflow-hidden px-0 opacity-0 transition-all duration-200 group-hover/button:w-8 group-hover/button:px-2 group-hover/button:opacity-100 aria-expanded:w-8 aria-expanded:px-2 aria-expanded:opacity-100',
                    variant === 'default'
                      ? 'hover:bg-brand-hover'
                      : 'hover:bg-accent hover:text-accent-foreground future:hover:text-foreground'
                  )}
                >
                  <Pencil size={12} className="shrink-0" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Edit button</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent align="start" className="w-48 space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs font-medium leading-4 text-foreground">Type</span>
            <ToggleGroup
              type="single"
              value={variant}
              onValueChange={(value) => {
                if (value) onVariantChange(value as 'default' | 'outline');
              }}
              className="w-full"
            >
              <ToggleGroupItem value="default" className="flex-1 text-xs">
                Primary
              </ToggleGroupItem>
              <ToggleGroupItem value="outline" className="flex-1 text-xs">
                Secondary
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="h-px bg-border-subtle" />
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 size={12} />
            Delete button
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FieldDragOverlay({ caseItem }: { caseItem: QuickFormFieldCase }) {
  const meta = FIELD_TYPE_META[caseItem.fieldType];
  return (
    <div
      className="flex max-w-56 items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 shadow-lg"
      style={{ cursor: 'grabbing' }}
    >
      <GripVertical size={12} className="shrink-0 text-foreground-subtle" />
      <meta.icon size={12} className="shrink-0 text-foreground-subtle" />
      <span
        title={caseItem.title}
        className="flex min-w-0 items-center text-xs font-medium text-foreground"
      >
        <span className="truncate">{caseItem.title}</span>
        {caseItem.required && <RequiredIndicator className="shrink-0" />}
      </span>
    </div>
  );
}

export function QuickFormPanel({
  embedded = false,
  onClose,
  className = 'h-[760px]',
}: {
  embedded?: boolean;
  onClose?: () => void;
  className?: string;
} = {}) {
  const monacoTheme = useMonacoTheme();
  const [cases, setCases] = useState<QuickFormFieldCase[]>(DEFAULT_QUICK_FORM_FIELD_CASES);
  const nextIdRef = useRef(4);
  const [formView, setFormView] = useState<'edit' | 'json'>('edit');
  const [formTitle, setFormTitle] = useState('Quick Approve');
  const [formDescription, setFormDescription] = useState('Add a description');
  const [editingFormTitle, setEditingFormTitle] = useState(false);
  const [editingFormDescription, setEditingFormDescription] = useState(false);
  const formTitleRef = useRef<HTMLInputElement>(null);
  const formDescriptionRef = useRef<HTMLInputElement>(null);
  const [jsonDraft, setJsonDraft] = useState(() =>
    JSON.stringify(DEFAULT_QUICK_FORM_FIELD_CASES, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [buttons, setButtons] = useState<FormButtonItem[]>(DEFAULT_FORM_BUTTONS);
  const nextButtonIdRef = useRef(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formView !== 'json') {
      setJsonDraft(JSON.stringify(cases, null, 2));
      setJsonError(null);
    }
  }, [cases, formView]);

  const handleJsonChange = (value: string) => {
    setJsonDraft(value);
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        setJsonError('Expected a JSON array of fields.');
        return;
      }
      if (!parsed.every(isValidQuickFormFieldCase)) {
        setJsonError('Each field needs id, title, required, value, locked, mode, and fieldType.');
        return;
      }
      const fieldIds = parsed.map(({ id }) => id);
      if (new Set(fieldIds).size !== fieldIds.length) {
        setJsonError('Field IDs must be unique.');
        return;
      }
      nextIdRef.current = Math.max(0, ...fieldIds) + 1;
      setCases(parsed);
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON.');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard
      ?.writeText(jsonDraft)
      ?.then(() => {
        setJsonCopied(true);
        setTimeout(() => setJsonCopied(false), 1500);
      })
      ?.catch(() => {});
  };

  const addCaseWithType = (fieldType: QuickFieldType) => {
    const id = nextIdRef.current++;
    setCases((prev) => [
      ...prev,
      {
        id,
        title: `Field ${id}`,
        required: true,
        value: '',
        locked: true,
        mode: 'literal',
        fieldType,
      },
    ]);
  };
  const deleteCase = (id: number) => setCases((prev) => prev.filter((c) => c.id !== id));
  const updateCase = (id: number, patch: Partial<QuickFormFieldCase>) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addButton = () => {
    const id = nextButtonIdRef.current++;
    setButtons((prev) => [...prev, { id, label: 'Button', variant: 'outline' }]);
  };
  const deleteButton = (id: number) => setButtons((prev) => prev.filter((b) => b.id !== id));
  const updateButton = (id: number, patch: Partial<FormButtonItem>) =>
    setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const updateCaseFieldType = (id: number, fieldType: QuickFieldType) =>
    setCases((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              fieldType,
              value: '',
              mode: FIELD_TYPE_META[fieldType].supportsExpression ? c.mode : 'literal',
            }
          : c
      )
    );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [overDragId, setOverDragId] = useState<number | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverDragId((event.over?.id as number) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCases((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
    setActiveDragId(null);
    setOverDragId(null);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setOverDragId(null);
  };

  const activeCase = cases.find((c) => c.id === activeDragId);

  const panel = (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<UserRoundCheck />}
      nodeLabel="Quick Approve"
      nodeCategory="Quick approve/reject decision for the extracted invoice."
      action={<RunButton />}
      onClose={onClose}
      className={className}
    >
      <PanelTabs defaultValue="parameters">
        <PanelTabsList>
          <PanelTabsTrigger value="parameters">Parameters</PanelTabsTrigger>
          <PanelTabsTrigger value="branching">Branching</PanelTabsTrigger>
          <PanelTabsTrigger value="error-handling">Error handling</PanelTabsTrigger>
        </PanelTabsList>
        <PanelTabsContent
          value="parameters"
          padded={false}
          className="flex flex-col gap-4 pt-1.5 pb-3 [padding-inline:var(--mf-content-inset,1rem)]"
        >
          {/* Quick form */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Quick form</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="Generate with AI"
                            className="grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground aria-expanded:bg-surface-overlay aria-expanded:text-foreground"
                          >
                            <Sparkles size={14} />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Generate with AI</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent align="end" className="w-64 space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Sparkles size={12} className="text-brand" />
                      Describe the form you want
                    </span>
                    <Textarea
                      rows={3}
                      placeholder="e.g. An invoice approval form with amount and due date"
                      className="resize-none text-sm"
                    />
                    <Button size="sm" className="w-fit">
                      Generate
                    </Button>
                  </PopoverContent>
                </Popover>
                <ToggleGroup
                  type="single"
                  size="xs"
                  value={formView}
                  onValueChange={(v) => v && setFormView(v as 'edit' | 'json')}
                >
                  <ToggleGroupItem value="edit" className="!px-2.5 !text-xs">
                    UI
                  </ToggleGroupItem>
                  <ToggleGroupItem value="json" className="!px-2.5 !text-xs">
                    JSON
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3.5">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={() => {}} />
                  <HoverCard openDelay={300}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Upload a file"
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle transition hover:bg-surface-overlay/70 hover:text-foreground [&>svg]:size-5"
                      >
                        <Upload />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent align="start" className="w-56 space-y-1.5">
                      <p className="text-xs font-semibold text-foreground">Upload form logo</p>
                      <p className="text-xs text-foreground-muted">
                        Images are automatically resized to fit the logo area.
                      </p>
                      <div className="space-y-0.5 text-[11px] text-foreground-subtle">
                        <div>Type: PNG, JPG, SVG</div>
                        <div>Size: 512 × 512 px</div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    {editingFormTitle ? (
                      <input
                        ref={formTitleRef}
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        onBlur={() => setEditingFormTitle(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') setEditingFormTitle(false);
                        }}
                        className="rounded bg-surface-overlay px-1 text-base font-semibold leading-5 tracking-[-0.3px] text-foreground outline-none ring-1 ring-brand"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFormTitle(true);
                          setTimeout(() => formTitleRef.current?.select(), 0);
                        }}
                        className="truncate rounded px-1 text-left text-base font-semibold leading-5 tracking-[-0.3px] text-foreground transition hover:bg-surface-overlay"
                      >
                        {formTitle}
                      </button>
                    )}
                    {editingFormDescription ? (
                      <input
                        ref={formDescriptionRef}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        onBlur={() => setEditingFormDescription(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape')
                            setEditingFormDescription(false);
                        }}
                        className="rounded bg-surface-overlay px-1 text-xs leading-4 text-foreground outline-none ring-1 ring-brand"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFormDescription(true);
                          setTimeout(() => formDescriptionRef.current?.select(), 0);
                        }}
                        className="truncate rounded px-1 text-left text-xs leading-4 text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
                      >
                        {formDescription}
                      </button>
                    )}
                  </div>
                </div>
                {formView === 'edit' && (
                  <>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDragCancel={handleDragCancel}
                    >
                      <SortableContext
                        items={cases.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-4">
                          {cases.map((c, index) => {
                            const activeIndex = cases.findIndex((x) => x.id === activeDragId);
                            const isOver =
                              activeDragId != null && overDragId === c.id && c.id !== activeDragId;
                            return (
                              <QuickFormFieldCaseRow
                                key={c.id}
                                id={c.id}
                                caseTitle={c.title}
                                onTitleChange={(title) => updateCase(c.id, { title })}
                                required={c.required}
                                onRequiredChange={(required) => updateCase(c.id, { required })}
                                onDelete={() => deleteCase(c.id)}
                                value={c.value}
                                onValueChange={(value) => updateCase(c.id, { value })}
                                locked={c.locked}
                                onLockedChange={(locked) => updateCase(c.id, { locked })}
                                mode={c.mode}
                                onModeChange={(mode) => updateCase(c.id, { mode })}
                                fieldType={c.fieldType}
                                compact
                                onFieldTypeChange={(fieldType) =>
                                  updateCaseFieldType(c.id, fieldType)
                                }
                                controlsVisibility="visible"
                                monacoTheme={monacoTheme}
                                insertBefore={isOver && activeIndex > index}
                                insertAfter={isOver && activeIndex < index}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                      {createPortal(
                        <DragOverlay>
                          {activeCase ? <FieldDragOverlay caseItem={activeCase} /> : null}
                        </DragOverlay>,
                        document.body
                      )}
                    </DndContext>
                    <button
                      type="button"
                      onClick={() => addCaseWithType('string')}
                      className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-brand transition hover:text-brand-hover"
                    >
                      <Plus size={12} />
                      Add field
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      {buttons.map((b) => (
                        <FormButtonChip
                          key={b.id}
                          label={b.label}
                          onLabelChange={(label) => updateButton(b.id, { label })}
                          variant={b.variant}
                          onVariantChange={(variant) => updateButton(b.id, { variant })}
                          onDelete={() => deleteButton(b.id)}
                        />
                      ))}
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={addButton}
                              aria-label="Add button"
                              className="grid size-10 shrink-0 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                            >
                              <Plus size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Add button</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </>
                )}
                {formView === 'json' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground-muted">Form schema</span>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={handleCopyJson}
                              aria-label="Copy JSON"
                              className="grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                            >
                              {jsonCopied ? (
                                <CircleCheck size={13} className="text-brand" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{jsonCopied ? 'Copied' : 'Copy JSON'}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="h-[320px] overflow-hidden rounded-xl border border-surface-overlay">
                      <MonacoEditor
                        height="100%"
                        language="json"
                        value={jsonDraft}
                        onChange={(value) => handleJsonChange(value ?? '')}
                        theme={monacoTheme}
                        beforeMount={registerMonacoThemes}
                        options={JSON_EDITOR_OPTIONS}
                      />
                    </div>
                    {jsonError && <span className="text-xs text-destructive">{jsonError}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PanelTabsContent>
        <PanelTabsContent value="branching" />
        <PanelTabsContent value="error-handling" />
      </PanelTabs>
    </NodePropertyPanel>
  );

  if (embedded) return panel;

  return <PanelFrame>{panel}</PanelFrame>;
}

// ============================================================================
// Panel UI Inventory
// Interactive reference of common controls and layout patterns used in panels.
// ============================================================================

function InventoryField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>;
}) {
  const generatedId = useId();
  const controlId = children.props.id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  return (
    <FormField>
      <FormFieldLabel htmlFor={controlId}>{label}</FormFieldLabel>
      {cloneElement(children, { id: controlId, 'aria-describedby': descriptionId })}
      <FormFieldDescription id={descriptionId}>{description}</FormFieldDescription>
    </FormField>
  );
}

const PatternNotesVisibilityContext = createContext(true);

function PatternNote({
  title,
  eyebrow = 'Layout pattern',
  linkTarget,
  children,
}: {
  title: string;
  eyebrow?: string;
  linkTarget?: string;
  children: ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const notesVisible = useContext(PatternNotesVisibilityContext);

  const copyLink = async () => {
    if (!linkTarget) return;
    const url = new URL(window.location.href);
    url.hash = `ui-inventory/${linkTarget}`;
    window.history.replaceState(null, '', url);
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  if (dismissed || !notesVisible) return null;

  return (
    <aside className="rounded-lg border border-border-subtle bg-surface-overlay p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">
          {eyebrow}
        </p>
        <div className="-mr-1 -mt-1 flex shrink-0 items-center">
          {linkTarget && (
            <Button
              variant="ghost"
              size="4xs"
              icon
              onClick={copyLink}
              aria-label={copied ? `Copied link to ${title}` : `Copy link to ${title}`}
              title={copied ? 'Link copied' : 'Copy link'}
              className="text-foreground-subtle hover:bg-surface-raised hover:text-foreground"
            >
              <Link2 size={12} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="4xs"
            icon
            onClick={() => setDismissed(true)}
            aria-label={`Dismiss ${title} note`}
            title="Dismiss note"
            className="text-foreground-subtle hover:bg-surface-raised hover:text-foreground"
          >
            <X size={12} />
          </Button>
        </div>
      </div>
      <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-4 text-foreground-muted">{children}</p>
    </aside>
  );
}

function InventorySubContainer({
  expandedSections,
  onExpandedSectionsChange,
}: {
  expandedSections: string[];
  onExpandedSectionsChange: (sections: string[]) => void;
}) {
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(true);
  const toggleSection = (section: string) => {
    onExpandedSectionsChange(
      expandedSections.includes(section)
        ? expandedSections.filter((value) => value !== section)
        : [...expandedSections, section]
    );
  };

  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-xl border border-border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('text-fields')}
          aria-expanded={expandedSections.includes('text-fields')}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-surface-overlay"
        >
          <ChevronDown
            size={12}
            className={cn(
              'shrink-0 text-foreground-subtle transition-transform duration-150',
              !expandedSections.includes('text-fields') && '-rotate-90'
            )}
          />
          <span className="min-w-0 flex-1 text-xs font-medium text-foreground">
            Text and numeric fields
          </span>
        </button>

        {expandedSections.includes('text-fields') && (
          <div className="border-t border-border-subtle">
            <section className="grid gap-4 px-3 py-4">
              <InventoryField label="Display name">
                <Input defaultValue="Invoice extraction" />
              </InventoryField>
              <InventoryField label="Instructions">
                <Textarea defaultValue="Extract the invoice number and total." rows={3} />
              </InventoryField>
              <InventoryField label="Retries">
                <Input type="number" defaultValue="3" min="0" />
              </InventoryField>
              <InventoryField label="System identifier">
                <Input value="invoice-extraction-01" readOnly />
              </InventoryField>
            </section>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('choices')}
          aria-expanded={expandedSections.includes('choices')}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-surface-overlay"
        >
          <ChevronDown
            size={12}
            className={cn(
              'shrink-0 text-foreground-subtle transition-transform duration-150',
              !expandedSections.includes('choices') && '-rotate-90'
            )}
          />
          <span className="min-w-0 flex-1 text-xs font-medium text-foreground">
            Selection controls
          </span>
        </button>
        {expandedSections.includes('choices') && (
          <section className="grid gap-5 border-t border-border-subtle px-3 py-4">
            <InventoryField label="Connection">
              <Select defaultValue="production">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                </SelectContent>
              </Select>
            </InventoryField>
            <InventoryField label="Processing mode">
              <RadioGroup defaultValue="automatic" className="grid gap-2">
                <Label variant="muted" className="flex items-center gap-2">
                  <RadioGroupItem value="automatic" />
                  Automatic
                </Label>
                <Label variant="muted" className="flex items-center gap-2">
                  <RadioGroupItem value="manual" />
                  Manual review
                </Label>
              </RadioGroup>
            </InventoryField>
            <div className="flex items-start gap-2">
              <Checkbox
                id="sub-container-save-output"
                checked={checked}
                onCheckedChange={(value) => setChecked(value === true)}
              />
              <Label variant="muted" htmlFor="sub-container-save-output">
                Save output for later steps
              </Label>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="sub-container-enabled">Enabled</Label>
              <Switch
                id="sub-container-enabled"
                size="sm"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
            <InventoryField label="Confidence threshold" description="Current value: 75%">
              <Slider defaultValue={[75]} max={100} step={5} />
            </InventoryField>
          </section>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('advanced')}
          aria-expanded={expandedSections.includes('advanced')}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-surface-overlay"
        >
          <ChevronDown
            size={12}
            className={cn(
              'shrink-0 text-foreground-subtle transition-transform duration-150',
              !expandedSections.includes('advanced') && '-rotate-90'
            )}
          />
          <span className="min-w-0 flex-1 text-xs font-medium text-foreground">
            Advanced options
          </span>
        </button>
        {expandedSections.includes('advanced') && (
          <section className="grid gap-4 border-t border-border-subtle px-3 py-4">
            <Alert>
              <CircleCheck />
              <AlertTitle>Configuration is valid</AlertTitle>
              <AlertDescription>All required values are ready.</AlertDescription>
            </Alert>
            <InventoryField label="Field with validation" description="Use a unique name.">
              <Input
                defaultValue="Existing configuration"
                aria-invalid="true"
                className="border-destructive"
              />
            </InventoryField>
            <div className="flex flex-wrap gap-2">
              <Badge>Active</Badge>
              <Badge variant="outline">Optional</Badge>
            </div>
            <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
              <Button variant="ghost">Cancel</Button>
              <Button variant="outline">Test</Button>
              <Button>Save</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

type CompositionFieldItem = { id: number; label: string };

function SortableCompositionField({
  field,
  onDelete,
}: {
  field: CompositionFieldItem;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised p-2',
        isDragging && 'opacity-30'
      )}
    >
      <button
        type="button"
        aria-label={`Drag ${field.label} to reorder`}
        title="Drag to reorder"
        className="grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground [cursor:grab] active:[cursor:grabbing]"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} />
      </button>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {field.label}
      </span>
      <CanvasTooltip content={`Delete ${field.label}`}>
        <Button
          variant="ghost"
          size="4xs"
          icon
          aria-label={`Delete ${field.label}`}
          onClick={onDelete}
        >
          <Trash2 size={13} />
        </Button>
      </CanvasTooltip>
    </div>
  );
}

function CompositionFieldDragOverlay({ field }: { field: CompositionFieldItem }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised p-2 shadow-lg [cursor:grabbing]">
      <GripVertical size={13} className="shrink-0 text-foreground-subtle" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {field.label}
      </span>
    </div>
  );
}

/** Disables a field: a rule without conditions always applies. */
const DISABLED_RULE = { id: 'disabled', conditions: [], effects: { disabled: true } };

/**
 * Renders inventory field examples through MetadataForm's field renderer, the
 * same path real panels use, so labels, gaps, and states can't drift from
 * engineering.
 */
function InventoryFields({ id, fields }: { id: string; fields: FieldMetadata[] }) {
  const schema = useMemo<FormSchema>(
    () => ({ id, title: '', actions: [], sections: [{ id: `${id}-fields`, fields }] }),
    [id, fields]
  );
  return <MetadataForm schema={schema} />;
}

const INVENTORY_INPUT_FIELDS: FieldMetadata[] = [
  { name: 'default', type: 'text', label: 'Default', placeholder: 'Enter a value' },
  {
    name: 'disabled',
    type: 'text',
    label: 'Disabled',
    placeholder: 'Disabled value',
    rules: [DISABLED_RULE],
  },
];
const INVENTORY_SELECT_FIELDS: FieldMetadata[] = [
  {
    name: 'executionMode',
    type: 'select',
    label: 'Execution mode',
    placeholder: 'Select an execution mode',
    defaultValue: 'standard',
    options: [
      { label: 'Standard', value: 'standard' },
      { label: 'Priority', value: 'priority' },
      { label: 'Background', value: 'background' },
    ],
  },
  {
    name: 'frameworks',
    type: 'multiselect',
    label: 'Frameworks',
    placeholder: 'Select frameworks',
    options: [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Angular', value: 'angular' },
      { label: 'Svelte', value: 'svelte' },
    ],
  },
];
const INVENTORY_FILE_FIELDS: FieldMetadata[] = [
  { name: 'attachments', type: 'file', label: 'Attachments', multiple: true, showPreview: true },
];
const INVENTORY_DATE_FIELDS: FieldMetadata[] = [
  { name: 'deadline', type: 'date', label: 'Deadline' },
  { name: 'runAt', type: 'datetime', label: 'Run at' },
  { name: 'lockedDate', type: 'date', label: 'Disabled', rules: [DISABLED_RULE] },
];
const INVENTORY_TEXTAREA_FIELDS: FieldMetadata[] = [
  {
    name: 'instructions',
    type: 'textarea',
    label: 'Instructions',
    rows: 3,
    defaultValue: 'Overall extraction instructions...',
  },
];
const INVENTORY_SWITCH_FIELDS: FieldMetadata[] = [
  { name: 'autoRetry', type: 'switch', label: 'Enable automatic retry', defaultValue: true },
  { name: 'lockedSetting', type: 'switch', label: 'Disabled setting', rules: [DISABLED_RULE] },
];
const INVENTORY_RADIO_FIELDS: FieldMetadata[] = [
  {
    name: 'runMode',
    type: 'radio',
    label: 'Run mode',
    defaultValue: 'automatic',
    options: [
      { label: 'Automatic', value: 'automatic' },
      { label: 'Manual', value: 'manual' },
    ],
  },
];
const INVENTORY_CHECKBOX_FIELDS: FieldMetadata[] = [
  { name: 'enabled', type: 'checkbox', label: 'Enabled', defaultValue: true },
  { name: 'lockedCheckbox', type: 'checkbox', label: 'Disabled', rules: [DISABLED_RULE] },
];

function PanelUIInventoryStory() {
  const [inventoryTab, setInventoryTab] = useState('components');
  const [inventorySection, setInventorySection] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(true);
  const [notesVisible, setNotesVisible] = useState(true);
  const [componentsFixedValue, setComponentsFixedValue] = useState('Invoice number');
  const [componentsConnection, setComponentsConnection] = useState('production');
  const [componentsExpressionValue, setComponentsExpressionValue] = useState('$vars.invoiceNumber');
  const monacoTheme = useMonacoTheme();
  const compositionFieldId = useId();
  const [compositionValue, setCompositionValue] = useState('invoice.total');
  const [compositionLocked, setCompositionLocked] = useState(true);
  const [compositionMode, setCompositionMode] = useState<QuickFormFieldMode>('literal');
  const [compositionFieldType, setCompositionFieldType] = useState<QuickFieldType>('string');
  const [compositionRequired, setCompositionRequired] = useState(true);
  const [compositionEditor, setCompositionEditor] = useState('ui');
  const [compositionFields, setCompositionFields] = useState([
    { id: 1, label: 'Invoice number' },
    { id: 2, label: 'Approved amount' },
  ]);
  const compositionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeCompositionFieldId, setActiveCompositionFieldId] = useState<number | null>(null);
  const activeCompositionField = compositionFields.find(
    (field) => field.id === activeCompositionFieldId
  );
  const allInventorySections = ['text-fields', 'choices', 'advanced'];
  const allSubContainerSections = ['text-fields', 'choices', 'advanced'];
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedSubContainerSections, setExpandedSubContainerSections] = useState<string[]>([]);

  useEffect(() => {
    const syncFromHash = () => {
      let decodedHash = '';
      try {
        decodedHash = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }

      const match = decodedHash.match(/^ui-inventory\/([^/]+)(?:\/(.+))?$/);
      if (!match) return;

      const [, tab, section] = match;
      if (!tab || !['components', 'layout', 'states', 'actions', 'composition'].includes(tab))
        return;
      setInventoryTab(tab);
      setInventorySection(section ?? null);
      if (tab === 'layout' && section && ['text-fields', 'choices', 'advanced'].includes(section)) {
        setExpandedSections((current) =>
          current.includes(section) ? current : [...current, section]
        );
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (!inventorySection) return;

    const timeoutId = window.setTimeout(() => {
      document.getElementById(`ui-inventory-${inventoryTab}-${inventorySection}`)?.scrollIntoView({
        block: 'start',
      });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [inventorySection, inventoryTab]);

  const handleInventoryTabChange = (tab: string) => {
    setInventoryTab(tab);
    setInventorySection(null);
    window.history.replaceState(null, '', `#ui-inventory/${tab}`);
  };
  const allSectionsExpanded =
    expandedSections.length === allInventorySections.length &&
    expandedSubContainerSections.length === allSubContainerSections.length;

  const toggleAllSections = () => {
    if (allSectionsExpanded) {
      setExpandedSections([]);
      setExpandedSubContainerSections([]);
      return;
    }

    setExpandedSections(allInventorySections);
    setExpandedSubContainerSections(allSubContainerSections);
  };

  const updateCompositionFieldType = (fieldType: QuickFieldType) => {
    setCompositionFieldType(fieldType);
    setCompositionValue('');
    if (!FIELD_TYPE_META[fieldType].supportsExpression) setCompositionMode('literal');
  };

  return (
    <>
      <PanelFrame>
        <NodePropertyPanel
          panelTitle="Properties"
          nodeIcon={<Sparkles />}
          nodeLabel="UI element inventory"
          nodeCategory="Panel reference"
          action={<RunButton />}
          onClose={() => {}}
          className="h-[calc(100vh-4rem)] min-h-[600px]"
        >
          <PatternNotesVisibilityContext.Provider value={notesVisible}>
            <PanelTabs
              value={inventoryTab}
              onValueChange={handleInventoryTabChange}
              className="h-full"
            >
              <PanelTabsList
                trailing={
                  <>
                    <Button
                      variant="ghost"
                      size="4xs"
                      icon
                      onClick={() => setNotesVisible((visible) => !visible)}
                      aria-label={notesVisible ? 'Hide notes' : 'Show notes'}
                      title={notesVisible ? 'Hide notes' : 'Show notes'}
                      className="shrink-0 text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                    >
                      {notesVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="4xs"
                      icon
                      onClick={toggleAllSections}
                      aria-label={
                        allSectionsExpanded ? 'Collapse all sections' : 'Expand all sections'
                      }
                      title={allSectionsExpanded ? 'Collapse all sections' : 'Expand all sections'}
                      className="shrink-0 text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                    >
                      <ChevronsUpDown size={13} />
                    </Button>
                  </>
                }
              >
                <PanelTabsTrigger value="components" id="ui-inventory-tab-components">
                  Components
                </PanelTabsTrigger>
                <PanelTabsTrigger value="layout" id="ui-inventory-tab-layout">
                  Layout
                </PanelTabsTrigger>
                <PanelTabsTrigger value="states" id="ui-inventory-tab-states">
                  States
                </PanelTabsTrigger>
                <PanelTabsTrigger value="actions" id="ui-inventory-tab-actions">
                  Actions
                </PanelTabsTrigger>
                <PanelTabsTrigger value="composition" id="ui-inventory-tab-composition">
                  Composition
                </PanelTabsTrigger>
              </PanelTabsList>

              <PanelTabsContent value="components" padded={false}>
                <div
                  id="ui-inventory-components-inputs"
                  className="grid gap-4 px-(--mf-content-inset) pt-1.5 pb-5"
                >
                  <PatternNote eyebrow="Component" title="Inputs" linkTarget="components/inputs">
                    Default, compact, disabled, and inline-validation variants used by Flow
                    Workbench forms.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-inputs" fields={INVENTORY_INPUT_FIELDS} />
                  {/* Not expressible in a MetadataForm schema yet (no field size, and errors
                      only show after the user edits), so these stay bare controls. */}
                  <div className="grid gap-2">
                    <Input id="ui-inventory-input-compact" size="xs" defaultValue="Compact value" />
                    <Input
                      id="ui-inventory-input-error"
                      defaultValue="Invalid value"
                      error="Enter a valid value."
                    />
                  </div>
                </div>

                <div
                  id="ui-inventory-components-quick-form-field"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Quick Form Field"
                    linkTarget="components/quick-form-field"
                  >
                    Supports fixed and expression modes, lock state, required state, variables,
                    validation, and String, Integer, Date, Boolean, select, File, and Object field
                    types.
                  </PatternNote>
                  <QuickFormField
                    id="ui-inventory-quick-form-field-fixed"
                    label={<Label className="text-xs font-medium">Fixed value</Label>}
                    value={componentsFixedValue}
                    onValueChange={setComponentsFixedValue}
                    locked={false}
                    fieldType="string"
                    required
                    showFieldActions={false}
                  />
                  <QuickFormField
                    id="ui-inventory-quick-form-field-expression"
                    label={<Label className="text-xs font-medium">Expression</Label>}
                    value={componentsExpressionValue}
                    onValueChange={setComponentsExpressionValue}
                    locked={false}
                    mode="expression"
                    fieldType="string"
                    leadingAddon="="
                    showFieldActions={false}
                  />
                </div>

                <div
                  id="ui-inventory-components-combobox"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Combobox"
                    linkTarget="components/combobox"
                  >
                    Searchable single-select control for connections, activities, and other large
                    option lists.
                  </PatternNote>
                  <Combobox
                    items={[
                      { label: 'Production connection', value: 'production' },
                      { label: 'Finance connection', value: 'finance' },
                      { label: 'Development connection', value: 'development' },
                    ]}
                    value={componentsConnection}
                    onValueChange={setComponentsConnection}
                    placeholder="Select a connection"
                    searchPlaceholder="Search connections"
                    className="w-full"
                  />
                </div>

                <div
                  id="ui-inventory-components-select"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Select and Multi-Select"
                    linkTarget="components/select"
                  >
                    Use Select for a short fixed list and Multi-Select when users can choose several
                    values.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-select" fields={INVENTORY_SELECT_FIELDS} />
                </div>

                <div
                  id="ui-inventory-components-file-upload"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="File Upload"
                    linkTarget="components/file-upload"
                  >
                    Support single and multiple files, accepted file types, previews, disabled
                    state, and per-file validation feedback.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-file-upload" fields={INVENTORY_FILE_FIELDS} />
                </div>

                <div
                  id="ui-inventory-components-date-pickers"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Date and Date-Time Pickers"
                    linkTarget="components/date-pickers"
                  >
                    Use date selection for deadlines and schedules, and date-time selection when
                    execution time is part of the configuration.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-dates" fields={INVENTORY_DATE_FIELDS} />
                </div>

                <div
                  id="ui-inventory-components-textarea"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Textarea"
                    linkTarget="components/textarea"
                  >
                    Use multiline fields for prompts, instructions, scripts, and other longer
                    free-form values.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-textarea" fields={INVENTORY_TEXTAREA_FIELDS} />
                </div>

                <div
                  id="ui-inventory-components-switch"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Switch and Toggle"
                    linkTarget="components/switch"
                  >
                    Use switches for settings that take effect immediately or represent an on/off
                    configuration.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-switch" fields={INVENTORY_SWITCH_FIELDS} />
                </div>

                <div
                  id="ui-inventory-components-radio"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote eyebrow="Component" title="Radio" linkTarget="components/radio">
                    Use radio groups when the user must choose exactly one visible option.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-radio" fields={INVENTORY_RADIO_FIELDS} />
                </div>

                <div
                  id="ui-inventory-components-checkbox"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Checkbox"
                    linkTarget="components/checkbox"
                  >
                    Use checkboxes for independent settings and opt-in behavior.
                  </PatternNote>
                  <InventoryFields id="ui-inventory-checkbox" fields={INVENTORY_CHECKBOX_FIELDS} />
                </div>

                <div
                  id="ui-inventory-components-buttons"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Button types"
                    linkTarget="components/buttons"
                  >
                    Primary, secondary, outline, tertiary, destructive, and link actions cover the
                    Flow Workbench hierarchy.
                  </PatternNote>
                  <div className="flex flex-wrap gap-2">
                    <Button size="xs">Primary</Button>
                    <Button size="xs" variant="secondary">
                      Secondary
                    </Button>
                    <Button size="xs" variant="outline">
                      Outline
                    </Button>
                    <Button size="xs" variant="ghost">
                      Tertiary
                    </Button>
                    <Button size="xs" variant="destructive">
                      Delete
                    </Button>
                    <Button size="3xs" variant="link">
                      Add field
                    </Button>
                  </div>
                </div>

                <div
                  id="ui-inventory-components-code-editor"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote
                    eyebrow="Component"
                    title="Code Editor"
                    linkTarget="components/code-editor"
                  >
                    Use a code editor for scripts and multi-line expressions when syntax
                    highlighting, line numbers, and a larger authoring surface are valuable.
                  </PatternNote>
                  <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-overlay">
                    <MonacoEditor
                      height="220px"
                      defaultLanguage="typescript"
                      defaultValue={
                        "// Expression-backed configuration\nconst invoice = await extractData({\n  file: $vars.invoiceFile,\n  fields: ['invoiceNumber', 'total', 'dueDate'],\n});\n\nreturn invoice;"
                      }
                      theme={monacoTheme}
                      beforeMount={registerMonacoThemes}
                      options={{
                        fontSize: 12,
                        lineHeight: 18,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        folding: false,
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 },
                      }}
                    />
                  </div>
                </div>
              </PanelTabsContent>

              <PanelTabsContent value="layout" padded={false}>
                <div
                  id="ui-inventory-layout-panel-anatomy"
                  className="grid gap-4 px-(--mf-content-inset) pt-1.5 pb-5"
                >
                  <PatternNote title="Panel anatomy" linkTarget="layout/panel-anatomy">
                    Use a title bar, identity row, navigation tabs, scrollable content, and an
                    optional footer. Keep the primary action close to the node identity.
                  </PatternNote>
                </div>
                <div
                  id="ui-inventory-layout-flat-content"
                  className="grid gap-4 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote title="Flat content" linkTarget="layout/flat-content">
                    A simple, always-visible layout for short configurations that do not need
                    collapsible sections or nested containers.
                  </PatternNote>
                  <div className="grid gap-4">
                    <InventoryField
                      label="Name"
                      description="A field placed directly in the panel."
                    >
                      <Input defaultValue="Extract invoice data" />
                    </InventoryField>
                    <InventoryField label="Connection">
                      <Select defaultValue="production">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                        </SelectContent>
                      </Select>
                    </InventoryField>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="flat-pattern-enabled">Enabled</Label>
                        <p className="text-xs text-foreground-muted">
                          Run this node in the workflow.
                        </p>
                      </div>
                      <Switch id="flat-pattern-enabled" size="sm" defaultChecked />
                    </div>
                  </div>
                </div>
                <div
                  id="ui-inventory-layout-expandable-sections"
                  className="border-t border-border-subtle px-(--mf-content-inset) has-[aside]:pt-5"
                >
                  <PatternNote title="Expandable sections" linkTarget="layout/expandable-sections">
                    Full-width sections that reveal or hide related fields without adding nested
                    container chrome.
                  </PatternNote>
                </div>
                <Accordion
                  type="multiple"
                  value={expandedSections}
                  onValueChange={setExpandedSections}
                >
                  <AccordionItem
                    value="text-fields"
                    id="ui-inventory-layout-text-fields"
                    className="border-border-subtle px-(--mf-content-inset)"
                  >
                    <AccordionTrigger className="group py-4 text-sm hover:no-underline">
                      <span className="text-foreground transition-colors group-hover:text-foreground-muted">
                        Text and numeric fields
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="grid gap-4 pb-5">
                      <InventoryField label="Name" description="Short, single-line text input.">
                        <Input defaultValue="Extract invoice data" />
                      </InventoryField>
                      <InventoryField label="Description">
                        <Textarea
                          defaultValue="Extract structured fields from incoming invoices."
                          rows={3}
                        />
                      </InventoryField>
                      <InventoryField label="Retry count">
                        <Input type="number" defaultValue="3" min="0" />
                      </InventoryField>
                      <InventoryField label="Read-only value">
                        <Input value="Generated by the system" readOnly />
                      </InventoryField>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="choices"
                    id="ui-inventory-layout-choices"
                    className="border-border-subtle px-(--mf-content-inset)"
                  >
                    <AccordionTrigger className="group py-4 text-sm hover:no-underline">
                      <span className="text-foreground transition-colors group-hover:text-foreground-muted">
                        Selection controls
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="grid gap-5 pb-5">
                      <InventoryField label="Connection">
                        <Select defaultValue="production">
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a connection" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                          </SelectContent>
                        </Select>
                      </InventoryField>
                      <InventoryField label="Processing mode">
                        <RadioGroup defaultValue="automatic" className="grid gap-2">
                          <Label variant="muted" className="flex items-center gap-2">
                            <RadioGroupItem value="automatic" />
                            Automatic
                          </Label>
                          <Label variant="muted" className="flex items-center gap-2">
                            <RadioGroupItem value="manual" />
                            Manual review
                          </Label>
                        </RadioGroup>
                      </InventoryField>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="save-output"
                          checked={checked}
                          onCheckedChange={(value) => setChecked(value === true)}
                        />
                        <div className="grid gap-0.5">
                          <Label htmlFor="save-output">Save output to storage</Label>
                          <p className="text-xs text-foreground-muted">
                            Makes the result available to later steps.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label htmlFor="enabled-switch">Enabled</Label>
                          <p className="text-xs text-foreground-muted">
                            Run this node in the workflow.
                          </p>
                        </div>
                        <Switch
                          id="enabled-switch"
                          size="sm"
                          checked={enabled}
                          onCheckedChange={setEnabled}
                        />
                      </div>
                      <InventoryField label="Confidence threshold" description="Current value: 75%">
                        <Slider defaultValue={[75]} max={100} step={5} />
                      </InventoryField>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="advanced"
                    id="ui-inventory-layout-advanced"
                    className="border-border-subtle px-(--mf-content-inset)"
                  >
                    <AccordionTrigger className="group py-4 text-sm hover:no-underline">
                      <span className="text-foreground transition-colors group-hover:text-foreground-muted">
                        Advanced options
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="grid gap-4 pb-5">
                      <InventoryField label="Internal identifier">
                        <Input defaultValue="invoice-extractor-01" />
                      </InventoryField>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div
                  id="ui-inventory-layout-sub-containers"
                  className="grid gap-3 border-t border-border-subtle px-(--mf-content-inset) py-5"
                >
                  <PatternNote title="Sub-containers" linkTarget="layout/sub-containers">
                    Dense, collapsible cards for related configuration when stronger visual grouping
                    is useful.
                  </PatternNote>
                  <InventorySubContainer
                    expandedSections={expandedSubContainerSections}
                    onExpandedSectionsChange={setExpandedSubContainerSections}
                  />
                </div>
              </PanelTabsContent>

              <PanelTabsContent
                value="states"
                padded={false}
                className="px-(--mf-content-inset) pt-1.5 pb-4"
              >
                <div className="grid gap-5">
                  <section id="ui-inventory-states-section-messages" className="grid gap-3">
                    <PatternNote
                      title="Section messages"
                      eyebrow="State pattern"
                      linkTarget="states/section-messages"
                    >
                      Persistent feedback summarizes a panel-level result and provides the next
                      action when one is needed.
                    </PatternNote>
                    <InfoFieldBlock
                      title="Configuration guidance"
                      message="This node uses the connection selected for the current folder."
                      action="Change the folder context to use a different connection."
                    />
                    <SuccessFieldBlock
                      title="Configuration is valid"
                      message="All required fields have been completed."
                      action="This node is ready to run."
                    />
                    <WarningFieldBlock
                      title="Review recommended"
                      message="The request timeout is higher than the recommended value."
                      action="Review the timeout before publishing this workflow."
                    />
                    <ErrorFieldBlock
                      title="Connection required"
                      message="No valid connection is configured for this node."
                      action="Select a connection before running this node."
                    />
                  </section>

                  <section
                    id="ui-inventory-states-navigation-validation"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Navigation validation"
                      eyebrow="State pattern"
                      linkTarget="states/navigation-validation"
                    >
                      Error counts on tabs reveal where unresolved issues live, including problems
                      in sections that are not currently visible.
                    </PatternNote>
                    <PanelTabs defaultValue="parameters">
                      <PanelTabsStrip>
                        <PanelTabsTrigger value="parameters">
                          <TabLabelWithError label="Parameters" count={1} />
                        </PanelTabsTrigger>
                        <PanelTabsTrigger value="error-handling">
                          <TabLabelWithError label="Error handling" count={2} />
                        </PanelTabsTrigger>
                        <PanelTabsTrigger value="advanced">Advanced</PanelTabsTrigger>
                      </PanelTabsStrip>
                    </PanelTabs>
                  </section>

                  <section
                    id="ui-inventory-states-inline-validation"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Inline validation"
                      eyebrow="State pattern"
                      linkTarget="states/inline-validation"
                    >
                      Field-specific feedback stays beside the control so the issue and resolution
                      are clear in context.
                    </PatternNote>
                    <InventoryField
                      label="Field with validation"
                      description="Use a unique node name."
                    >
                      <div>
                        <Input
                          defaultValue="Existing node"
                          error={
                            <>
                              <span className="block">This node name is already in use.</span>
                              <span className="mt-0.5 block text-foreground-muted">
                                Enter a unique name before saving.
                              </span>
                            </>
                          }
                        />
                      </div>
                    </InventoryField>
                  </section>

                  <section
                    id="ui-inventory-states-transient-feedback"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Transient feedback"
                      eyebrow="State pattern"
                      linkTarget="states/transient-feedback"
                    >
                      Toasts confirm the result of a user action without interrupting the task. Keep
                      actionable errors visible in the panel instead.
                    </PatternNote>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          toast.info('Background sync complete', {
                            description: 'The latest panel data is available.',
                          })
                        }
                      >
                        Info
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          toast.success('Changes saved', {
                            description: 'Panel settings are up to date.',
                          })
                        }
                      >
                        Success
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          toast.warning('Review recommended', {
                            description: 'Some optional settings still use defaults.',
                          })
                        }
                      >
                        Warning
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          toast.error('Update failed', {
                            description: 'Your changes were not saved. Try again.',
                          })
                        }
                      >
                        Error
                      </Button>
                    </div>
                  </section>

                  <section
                    id="ui-inventory-states-status-labels"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Status labels"
                      eyebrow="State pattern"
                      linkTarget="states/status-labels"
                    >
                      Short labels communicate passive field or setting states without interrupting
                      the task.
                    </PatternNote>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Optional</Badge>
                      <Badge variant="outline">Read only</Badge>
                    </div>
                  </section>

                  <section
                    id="ui-inventory-states-empty-loading-states"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Empty and loading states"
                      eyebrow="State pattern"
                      linkTarget="states/empty-loading-states"
                    >
                      Explain why content is unavailable and provide the next useful action. Avoid
                      blank panels and ambiguous spinners.
                    </PatternNote>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid min-h-24 place-items-center rounded-lg border border-border-subtle bg-surface p-3 text-center">
                        <div>
                          <p className="text-xs font-medium text-foreground">No fields yet</p>
                          <p className="mt-1 text-[11px] text-foreground-muted">
                            Add a field to start configuring this section.
                          </p>
                          <Button size="4xs" variant="link" className="mt-2 px-0">
                            <Plus size={12} /> Add field
                          </Button>
                        </div>
                      </div>
                      <div className="grid min-h-24 place-items-center rounded-lg border border-border-subtle bg-surface p-3 text-center">
                        <div>
                          <RefreshCw className="mx-auto size-4 animate-spin text-foreground-subtle" />
                          <p className="mt-2 text-xs font-medium text-foreground">Loading fields</p>
                          <p className="mt-1 text-[11px] text-foreground-muted">Please wait…</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </PanelTabsContent>

              <PanelTabsContent
                value="actions"
                padded={false}
                className="px-(--mf-content-inset) pt-1.5 pb-4"
              >
                <div className="grid gap-5">
                  <section id="ui-inventory-actions-button-hierarchy" className="grid gap-3">
                    <PatternNote
                      title="Button hierarchy"
                      eyebrow="Action pattern"
                      linkTarget="actions/button-hierarchy"
                    >
                      Use one primary action per context, with secondary, tertiary, and destructive
                      styles reflecting lower emphasis or greater consequence.
                    </PatternNote>
                    <div className="flex flex-wrap gap-2">
                      <Button>Primary</Button>
                      <Button variant="outline">Secondary</Button>
                      <Button variant="ghost">Tertiary</Button>
                      <Button variant="destructive">Delete</Button>
                    </div>
                  </section>

                  <section
                    id="ui-inventory-actions-header-actions"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Header actions"
                      eyebrow="Action pattern"
                      linkTarget="actions/header-actions"
                    >
                      Reserve the panel header for high-frequency node-level commands such as
                      running or debugging. Keep the set small so the primary task remains clear.
                    </PatternNote>
                    <div className="flex flex-wrap items-center gap-2">
                      <RunButton />
                      <RunButtonIconOnly />
                    </div>
                  </section>

                  <section
                    id="ui-inventory-actions-inline-links"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Inline links"
                      eyebrow="Action pattern"
                      linkTarget="actions/inline-links"
                    >
                      Use a compact link when the action is related to nearby content and should not
                      compete with the panel's primary controls.
                    </PatternNote>
                    <Button variant="link" size="2xs" className="w-fit px-0">
                      View documentation
                    </Button>
                  </section>

                  <section
                    id="ui-inventory-actions-footer-actions"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Footer actions"
                      eyebrow="Action pattern"
                      linkTarget="actions/footer-actions"
                    >
                      Place panel-level actions at the end of the content, with the primary action
                      last and the cancel action immediately before it.
                    </PatternNote>
                    <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
                      <Button variant="ghost">Cancel</Button>
                      <Button>Save changes</Button>
                    </div>
                  </section>

                  <section
                    id="ui-inventory-actions-manage"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Manage"
                      eyebrow="Action pattern"
                      linkTarget="actions/manage"
                    >
                      Use a secondary button when the action opens a separate configuration surface
                      for the field or section it affects.
                    </PatternNote>
                    <div className="flex flex-wrap items-center">
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </div>
                  </section>

                  <section
                    id="ui-inventory-actions-add"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote title="Add" eyebrow="Action pattern" linkTarget="actions/add">
                      Use the lightweight plus link when adding another item to a repeatable list.
                      Keep it separate from manage actions so the two intents are easy to scan.
                    </PatternNote>
                    <div className="flex flex-wrap items-center">
                      <PanelAddButton>Add field</PanelAddButton>
                    </div>
                  </section>

                  <section
                    id="ui-inventory-actions-icon-utilities"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Icon-only utilities"
                      eyebrow="Action pattern"
                      linkTarget="actions/icon-utilities"
                    >
                      Use compact icon actions for familiar utilities when space is limited. Always
                      provide a tooltip and accessible name.
                    </PatternNote>
                    <div className="flex items-center gap-1">
                      <CanvasTooltip content="Refresh data">
                        <Button variant="ghost" size="4xs" icon aria-label="Refresh data">
                          <RefreshCw size={14} />
                        </Button>
                      </CanvasTooltip>
                      <CanvasTooltip content="Duplicate node">
                        <Button variant="ghost" size="4xs" icon aria-label="Duplicate node">
                          <Copy size={14} />
                        </Button>
                      </CanvasTooltip>
                      <CanvasTooltip content="Delete node">
                        <Button
                          variant="ghost"
                          size="4xs"
                          icon
                          aria-label="Delete node"
                          className="text-error hover:text-error"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </CanvasTooltip>
                    </div>
                  </section>
                </div>
              </PanelTabsContent>

              <PanelTabsContent
                value="composition"
                padded={false}
                className="px-(--mf-content-inset) pt-1.5 pb-4"
              >
                <div className="grid gap-5">
                  <section id="ui-inventory-composition-repeatable-list" className="grid gap-3">
                    <PatternNote
                      title="Repeatable field list"
                      eyebrow="Composition pattern"
                      linkTarget="composition/repeatable-list"
                    >
                      Use reorder, add, and remove controls when users build a variable-length set
                      of related fields.
                    </PatternNote>
                    <div className="grid gap-2">
                      <DndContext
                        sensors={compositionSensors}
                        collisionDetection={closestCenter}
                        onDragStart={(event) =>
                          setActiveCompositionFieldId(event.active.id as number)
                        }
                        onDragEnd={({ active, over }) => {
                          if (over && active.id !== over.id) {
                            setCompositionFields((fields) => {
                              const oldIndex = fields.findIndex((field) => field.id === active.id);
                              const newIndex = fields.findIndex((field) => field.id === over.id);
                              return arrayMove(fields, oldIndex, newIndex);
                            });
                          }
                          setActiveCompositionFieldId(null);
                        }}
                        onDragCancel={() => setActiveCompositionFieldId(null)}
                      >
                        <SortableContext
                          items={compositionFields.map((field) => field.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="grid gap-2">
                            {compositionFields.map((field) => (
                              <SortableCompositionField
                                key={field.id}
                                field={field}
                                onDelete={() =>
                                  setCompositionFields((fields) =>
                                    fields.filter((item) => item.id !== field.id)
                                  )
                                }
                              />
                            ))}
                          </div>
                        </SortableContext>
                        {createPortal(
                          <DragOverlay>
                            {activeCompositionField ? (
                              <CompositionFieldDragOverlay field={activeCompositionField} />
                            ) : null}
                          </DragOverlay>,
                          document.body
                        )}
                      </DndContext>
                      <button
                        type="button"
                        className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-brand transition hover:text-brand-hover"
                        onClick={() =>
                          setCompositionFields((fields) => [
                            ...fields,
                            {
                              id: Math.max(0, ...fields.map((field) => field.id)) + 1,
                              label: `New field ${fields.length + 1}`,
                            },
                          ])
                        }
                      >
                        <Plus size={12} />
                        Add field
                      </button>
                    </div>
                  </section>

                  <section
                    id="ui-inventory-composition-editing-modes"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Editing modes"
                      eyebrow="Composition pattern"
                      linkTarget="composition/editing-modes"
                    >
                      Switch between a guided interface and a source representation without changing
                      the underlying configuration.
                    </PatternNote>
                    <ToggleGroup
                      type="single"
                      size="xs"
                      value={compositionEditor}
                      onValueChange={(value) => value && setCompositionEditor(value)}
                      className="w-fit"
                    >
                      <ToggleGroupItem value="ui" className="!px-2.5 !text-xs">
                        UI
                      </ToggleGroupItem>
                      <ToggleGroupItem value="json" className="!px-2.5 !text-xs">
                        JSON
                      </ToggleGroupItem>
                    </ToggleGroup>
                    {compositionEditor === 'ui' ? (
                      <InventoryField label="Form title">
                        <Input defaultValue="Quick approve" />
                      </InventoryField>
                    ) : (
                      <Textarea
                        aria-label="JSON configuration"
                        defaultValue={'{\n  "title": "Quick approve"\n}'}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    )}
                  </section>

                  <section
                    id="ui-inventory-composition-quick-form-field"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Quick form field"
                      eyebrow="Composition pattern"
                      linkTarget="composition/quick-form-field"
                    >
                      Combines field type, required state, AI assistance, variable insertion, and
                      fixed or expression values in one reusable Flow control.
                    </PatternNote>
                    <QuickFormField
                      id={compositionFieldId}
                      label={
                        <FormFieldLabel
                          htmlFor={compositionFieldId}
                          required={compositionRequired}
                          className="leading-4"
                        >
                          Invoice value
                        </FormFieldLabel>
                      }
                      headerActions={
                        <CanvasTooltip content="Remove field">
                          <Button variant="ghost" size="4xs" icon aria-label="Remove field">
                            <Trash2 size={14} />
                          </Button>
                        </CanvasTooltip>
                      }
                      value={compositionValue}
                      onValueChange={setCompositionValue}
                      locked={compositionLocked}
                      onLockedChange={setCompositionLocked}
                      mode={compositionMode}
                      onModeChange={setCompositionMode}
                      fieldType={compositionFieldType}
                      onFieldTypeChange={updateCompositionFieldType}
                      required={compositionRequired}
                      onRequiredChange={setCompositionRequired}
                      variables={QUICK_FORM_FIELD_VARIABLES}
                    />
                  </section>

                  <section
                    id="ui-inventory-composition-responsive-panel"
                    className="grid gap-3 border-t border-border-subtle pt-5"
                  >
                    <PatternNote
                      title="Responsive panel"
                      eyebrow="Composition pattern"
                      linkTarget="composition/responsive-panel"
                    >
                      Preserve the same hierarchy when the panel is narrow: keep tabs scrollable,
                      content inset consistent, and actions reachable.
                    </PatternNote>
                    <div className="max-w-[280px] rounded-lg border border-border-subtle bg-surface p-2">
                      <div className="overflow-x-auto">
                        <div className="flex min-w-max gap-1 border-b border-border-subtle pb-1">
                          {['Fields', 'Rules', 'Advanced'].map((tab, index) => (
                            <Button
                              key={tab}
                              size="4xs"
                              variant={index === 0 ? 'secondary' : 'ghost'}
                              className="shrink-0"
                            >
                              {tab}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-2 p-2">
                        <Input
                          defaultValue="Invoice fields"
                          aria-label="Responsive panel example"
                        />
                        <div className="flex items-center justify-end gap-1">
                          <Button size="4xs" variant="ghost">
                            Cancel
                          </Button>
                          <Button size="4xs" variant="primary">
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </PanelTabsContent>
            </PanelTabs>
          </PatternNotesVisibilityContext.Provider>
        </NodePropertyPanel>
      </PanelFrame>
      <Toaster className="[&_[data-description]]:!text-foreground-muted [&_[data-icon]]:!mt-0.5 [&_[data-icon]]:!self-start" />
    </>
  );
}

export const InputOutput: IOStory = {
  name: '3 Column',
  args: {
    showExtractionTab: true,
    readOnly: false,
    inputData: 'schema-and-value',
  },
  argTypes: {
    showExtractionTab: {
      control: 'boolean',
      description: 'Show the custom Extraction table tab on the Output panel.',
    },
    readOnly: {
      control: 'boolean',
      description: 'Force the Input and Output panels read-only.',
    },
    inputData: {
      control: 'select',
      options: ['schema-and-value', 'schema-only', 'value-only'],
      description:
        'Input panel data: schema and value, schema only (all rows unset), or value only (no schema).',
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
\`NodeIOView\` is the composed node input/output panel body used in the flow
builder: a schema-aware value tree with Schema / JSON tabs, inline editing,
custom value cells, and consumer-provided extra tabs. It is a panel *body*,
composed inside \`NodePropertyPanel\`, which owns the chrome.

This story pieces together the three panels a user sees while working a
**Document Extraction** node (**Input**, **Properties**, **Output**) to show
how they read as a set. Input is driven by upstream execution data; Properties
is a standard \`MetadataForm\` (with a file field); Output is a believable
extraction result with an optional custom **Extraction** table tab (toggle it
with the control below). Switch the Output mode to **Static** to edit the
mocked output inline.

File rows (e.g. the source **document**) surface their affordances as custom
**row actions** via \`nodeActions\`: **Upload** is always offered, while
**Preview** and **Delete** appear only once a file is present, with the
built-in copy/wrap actions omitted for those rows. Preview opens a banner atop
the panel; Upload mock-populates a file.

Use the controls to force read-only mode or swap the Input panel's data:
schema only renders every row as unset, value only drops the schema. The
Input toolbar's filter narrows the tree to fields referenced by this node.

The three panels sit in a resizable split: drag a handle between them to grow
one panel and shrink its neighbor, testing how the tree rows behave at
different widths (truncation, action-button visibility).
        `,
      },
    },
  },
  render: (args) => (
    <div className="h-180 w-full max-w-350">
      <NodePropertyPanelLayout
        className="h-full"
        input={
          <InputPanel
            key={args.inputData}
            readOnly={args.readOnly}
            {...INPUT_DATA[args.inputData]}
          />
        }
        properties={<PropertiesPanel />}
        output={<OutputPanel showExtractionTab={args.showExtractionTab} readOnly={args.readOnly} />}
      />
      <Toaster />
    </div>
  ),
};

const SURFACE_REMAP = { '--surface-raised': 'var(--surface-overlay)' } as CSSProperties;

function CompactResponsivePanelStory() {
  const steps = httpRequestForm.steps ?? [];
  const [activeStepId, setActiveStepId] = useState(steps[0]?.id ?? '');

  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeLabel="Fetch invoice details"
      nodeCategory="HTTP Request"
      action={<RunButtonIconOnly />}
      onClose={() => {}}
      className="h-[480px]"
    >
      <PanelTabs
        value={activeStepId}
        onValueChange={setActiveStepId}
        className="h-full"
        style={SURFACE_REMAP}
      >
        <PanelTabsList>
          {steps.map((step) => (
            <PanelTabsTrigger key={step.id} value={step.id}>
              {step.title}
            </PanelTabsTrigger>
          ))}
        </PanelTabsList>
        {steps.map((step) => {
          const flatSchema: FormSchema = {
            id: httpRequestForm.id,
            title: httpRequestForm.title,
            mode: httpRequestForm.mode,
            actions: [],
            sections: step.sections,
          };

          return (
            <PanelTabsContent key={step.id} value={step.id} innerClassName="flex flex-col gap-4">
              <MetadataForm schema={flatSchema} />
            </PanelTabsContent>
          );
        })}
      </PanelTabs>
    </NodePropertyPanel>
  );
}

function ResponsiveStory() {
  return (
    <div className="flex items-start gap-[30px]">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-foreground">Example Spacious</span>
        <PanelFrame>
          <NodePropertyPanel
            panelTitle="Properties"
            nodeIcon={<Globe />}
            nodeLabel="Fetch invoice details"
            nodeCategory="HTTP Request"
            action={<RunButton />}
            schema={httpRequestForm}
            onClose={() => {}}
            className="h-[640px]"
          />
        </PanelFrame>
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-foreground">Example Compact</span>
        <PanelFrame width="w-[280px]">
          <CompactResponsivePanelStory />
        </PanelFrame>
      </div>
    </div>
  );
}

// ============================================================================
// Input / Output panels (NodeIOView)
// ============================================================================

function MonacoJsonView({ value }: { value: JsonValue | undefined }) {
  const monacoTheme = useMonacoTheme();
  return (
    <MonacoEditor
      height="100%"
      language="json"
      value={JSON.stringify(value ?? null, null, 2)}
      theme={monacoTheme}
      beforeMount={registerMonacoThemes}
      options={JSON_VIEWER_OPTIONS}
    />
  );
}

// Editable Monaco variant wired into NodeIOView's `renderCodeEditor` so that
// editing an object/array value uses a real code editor instead of a textarea.
const CODE_EDITOR_OPTIONS = {
  ...JSON_VIEWER_OPTIONS,
  readOnly: false,
  lineNumbers: 'off' as const,
  lineDecorationsWidth: 8,
  renderLineHighlight: 'line' as const,
} as const;

function MonacoCodeEditor({
  value,
  onChange,
  onApply,
  onCancel,
  invalid,
  autoFocus,
}: JsonCodeEditorRenderProps) {
  const monacoTheme = useMonacoTheme();
  return (
    // Monaco owns most keys; the wrapper only needs Escape (cancel) and
    // Cmd/Ctrl+Enter (apply), matching the textarea fallback's shortcuts.
    <div
      className={cn(
        'overflow-hidden rounded-lg border',
        invalid ? 'border-error' : 'border-border-subtle'
      )}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCancel();
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onApply();
        }
      }}
    >
      <MonacoEditor
        height="160px"
        language="json"
        value={value}
        theme={monacoTheme}
        beforeMount={registerMonacoThemes}
        onChange={(next) => onChange(next ?? '')}
        onMount={(editor) => {
          if (autoFocus) editor.focus();
        }}
        options={CODE_EDITOR_OPTIONS}
      />
    </div>
  );
}

const renderJsonCodeEditor = (props: JsonCodeEditorRenderProps) => <MonacoCodeEditor {...props} />;

// ============================================================================
// Custom file value cell + type badge (shared by Input / Output trees)
// ============================================================================

const deriveFileTypeIcon: DeriveTypeIcon = (node) =>
  node.schema?.format === 'file' ? <File /> : undefined;

const MOCK_FILES = [
  { FullName: 'statement-scan.png', MimeType: 'image/png' },
  { FullName: 'amendment.pdf', MimeType: 'application/pdf' },
];

// The file value cell is display-only; the file affordances live in the row's
// action group (see useFileNodeActions), matching how a real host surfaces
// Upload / Preview / Delete rather than crowding the value cell.
const renderFileValueCell: RenderValueCell = (node) => {
  if (node.schema?.format !== 'file') return undefined;
  const file = isJsonObject(node.value) ? node.value : undefined;
  return (
    <span
      className={cn(
        'truncate font-mono italic text-xs',
        file ? 'text-foreground' : 'italic text-foreground-subtle'
      )}
    >
      {typeof file?.FullName === 'string' ? file.FullName : 'no file'}
    </span>
  );
};

interface PreviewedFile {
  FullName: string;
  MimeType?: string;
}

/**
 * Surfaces file affordances as per-node row actions:
 *   • Upload: offered on editable file rows (mock population, no real FS).
 *   • Preview / Delete: offered on editable file rows once a file is present.
 *   • Add variable: offered on every row, including read-only file rows.
 * Non-file rows compose Add variable with their built-in actions.
 */
function useFileNodeActions(): {
  nodeActions: NodeActionsResolver;
  preview: PreviewedFile | null;
  clearPreview: () => void;
} {
  const pickCountRef = useRef(0);
  const [preview, setPreview] = useState<PreviewedFile | null>(null);

  const nodeActions = useCallback<NodeActionsResolver>((node, ctx) => {
    const addVariableAction: NodeAction = {
      id: 'add-variable',
      icon: <Plus />,
      label: `Add ${node.key} as a variable`,
      tooltip: 'Add variable',
      onSelect: () =>
        toast.success(`Added ${node.key} as a variable`, {
          description: `$vars.${node.path}`,
        }),
    };

    if (node.schema?.format !== 'file') return [...ctx.defaultActions, addVariableAction];
    if (ctx.readOnly) return [addVariableAction];

    const file = isJsonObject(node.value) ? node.value : undefined;
    const actions: NodeAction[] = [
      {
        id: 'upload',
        icon: <Upload />,
        label: file ? `Replace ${node.key}` : `Upload ${node.key}`,
        tooltip: file ? 'Replace file' : 'Upload file',
        onSelect: () => {
          const mock = MOCK_FILES[pickCountRef.current++ % MOCK_FILES.length]!;
          ctx.commit({
            ID: `file-${Math.random().toString(16).slice(2, 6)}`,
            FullName: mock.FullName,
            MimeType: mock.MimeType,
            SizeBytes: Math.floor(Math.random() * 90000) + 1000,
          });
        },
      },
    ];

    if (file) {
      actions.push({
        id: 'preview',
        icon: <Eye />,
        label: `Preview ${node.key}`,
        tooltip: 'Preview file',
        onSelect: () =>
          setPreview({
            FullName: typeof file.FullName === 'string' ? file.FullName : node.key,
            MimeType: typeof file.MimeType === 'string' ? file.MimeType : undefined,
          }),
      });
      actions.push({
        id: 'delete',
        icon: <Trash2 />,
        label: `Delete ${node.key}`,
        tooltip: 'Delete file',
        tone: 'error',
        onSelect: () => ctx.clear(),
      });
    }

    return [...actions, addVariableAction];
  }, []);

  return { nodeActions, preview, clearPreview: () => setPreview(null) };
}

function FilePreviewBanner({ file, onClose }: { file: PreviewedFile; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-lg border border-info/40 bg-info/10 px-2.5 py-1.5 text-xs">
      <Eye size={13} className="shrink-0 text-info" />
      <span className="min-w-0 flex-1 truncate">
        Previewing <span className="font-mono text-foreground">{file.FullName}</span>
        {file.MimeType && <span className="text-foreground-subtle"> · {file.MimeType}</span>}
      </span>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded px-1 text-foreground-subtle transition hover:text-foreground"
      >
        Close
      </button>
    </div>
  );
}

// ============================================================================
// Scenario: a Document Extraction node
// ============================================================================

const NODE_ID = 'documentExtraction1';
const NODE_LABEL = 'Document Extraction';

const FILE_TYPE_SCHEMA: JsonSchema = {
  type: 'object',
  format: 'file',
  properties: {
    ID: { type: 'string' },
    FullName: { type: 'string' },
    MimeType: { type: 'string' },
    SizeBytes: { type: 'integer' },
  },
  required: ['ID', 'FullName'],
};

// ── Input: upstream execution data available to the node. Keyed by source node
// id, with each node's fields nested under `output`, matching how the canvas
// exposes upstream data (`$vars.<nodeId>.output.<field>`).
const INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    trigger: {
      type: 'object',
      title: 'Trigger',
      properties: {
        output: {
          type: 'object',
          properties: {
            fileName: { type: 'string' },
            receivedAt: { type: 'string' },
            source: { type: 'string', enum: ['email', 'upload', 'api'] },
            priority: { type: 'integer' },
            isReprocess: { type: 'boolean' },
          },
        },
      },
    },
    readStorageFile1: {
      type: 'object',
      title: 'Read Storage File',
      properties: {
        output: {
          type: 'object',
          properties: {
            document: {
              ...FILE_TYPE_SCHEMA,
              description: 'The source document.',
            },
            pageCount: { type: 'integer' },
            bucket: { type: 'string' },
            checksum: { type: 'string' },
            lastModifiedBy: { type: ['string', 'null'] },
            tags: { type: 'array', items: { type: 'string' } },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  principal: { type: 'string' },
                  access: { type: 'string', enum: ['read', 'read-write'] },
                },
              },
            },
          },
        },
      },
    },
  },
};

const INPUT_VALUE: JsonContainer = {
  trigger: {
    output: {
      fileName: 'invoice-2025-014.pdf',
      receivedAt: '2025-07-14T09:32:00Z',
      source: 'email',
      priority: 2,
      isReprocess: false,
    },
  },
  readStorageFile1: {
    output: {
      document: {
        ID: 'file-inv-014',
        FullName: 'invoice-2025-014.pdf',
        MimeType: 'application/pdf',
        SizeBytes: 218734,
      },
      pageCount: 3,
      bucket: 'incoming-invoices',
      checksum: 'sha256:9f2a7ce5b1d3f4a6c8e7b9d2f1a3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8g9h0i1j2',
      lastModifiedBy: null,
      tags: ['invoice', 'vendor', 'q3'],
      permissions: [],
    },
  },
};

// ── Output: a believable Document Extraction result.
const OUTPUT_NODE_SCHEMA: JsonSchema = {
  type: 'object',
  required: ['documentType', 'confidence', 'success'],
  properties: {
    documentType: { type: 'string', enum: ['invoice', 'receipt', 'contract'] },
    confidence: {
      type: 'number',
      description: 'Overall extraction confidence.',
    },
    success: { type: 'boolean' },
    pageCount: { type: 'integer' },
    extractionId: { type: 'string' },
    processedAt: { type: 'string' },
    fields: {
      type: 'array',
      description: 'Extracted fields.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          confidence: { type: 'number' },
          page: { type: 'integer' },
        },
      },
    },
    tables: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          rowCount: { type: 'integer' },
        },
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
  },
};

interface ExtractionField {
  name: string;
  value: string;
  confidence: number;
  page: number;
}

const EXTRACTION_FIELDS = [
  { name: 'VendorName', value: 'Contoso Ltd', confidence: 0.98, page: 1 },
  { name: 'InvoiceTotal', value: '12,480.00', confidence: 0.95, page: 1 },
  { name: 'InvoiceDate', value: '2025-07-01', confidence: 0.99, page: 1 },
  { name: 'DueDate', value: '2025-07-31', confidence: 0.88, page: 1 },
  { name: 'PONumber', value: 'PO-55871', confidence: 0.72, page: 2 },
];

const OUTPUT_NODE_VALUE: JsonValue = {
  documentType: 'invoice',
  confidence: 0.972,
  success: true,
  pageCount: 3,
  extractionId: 'ext-7b3d',
  processedAt: '2025-07-14T09:32:07Z',
  fields: EXTRACTION_FIELDS,
  tables: [{ name: 'LineItems', rowCount: 5 }],
  warnings: [],
};

// Output is wrapped under the node id (title = node label), mirroring
// flow-workbench's buildWrappedOutputSchema, so it renders nested beneath a
// node header, same as the Input source groups.
const OUTPUT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    [NODE_ID]: {
      type: 'object',
      title: NODE_LABEL,
      properties: { output: OUTPUT_NODE_SCHEMA },
    },
  },
};

const OUTPUT_VALUE: JsonContainer = {
  [NODE_ID]: { output: OUTPUT_NODE_VALUE },
};

// Node-style header decorations for the top-level source/self group rows.
// mirrors the flow-workbench Input/Output panels: the source label replaces the
// raw key, the node id shows as a sublabel, and the node icon replaces the type
// badge. Keyed by the top-level path (source node id).
const NODE_HEADERS: Record<string, { label: string; icon: ReactNode }> = {
  trigger: { label: 'Trigger', icon: <Zap /> },
  readStorageFile1: { label: 'Read Storage File', icon: <HardDrive /> },
  [NODE_ID]: { label: NODE_LABEL, icon: <ScanText /> },
};

const decorateNodeHeader = (node: JsonTreeNode): NodeDecoration | undefined => {
  // File containers surface their name through the custom value cell, so the
  // key count (ID / FullName / MimeType / ...) is just noise.
  if (node.schema?.format === 'file') return { hideCount: true };
  if (node.path.includes('.')) return undefined; // top-level group rows only
  const header = NODE_HEADERS[node.path];
  return header
    ? {
        label: header.label,
        sublabel: node.path,
        badge: { icon: header.icon },
        hideCount: true,
      }
    : undefined;
};

// Input fields this node's configuration references (e.g. in expressions);
// drives the toolbar's "Referenced in this node" filter. A referenced
// container shows its whole subtree.
const REFERENCED_PATHS = new Set(['readStorageFile1.output.document', 'trigger.output.fileName']);

const INPUT_FILTERS: JsonTreeFilterOption[] = [
  {
    id: 'referenced',
    label: 'Referenced in this node',
    predicate: (node) => REFERENCED_PATHS.has(node.path),
  },
];

// ── Properties: the node's config form (standard MetadataForm).
const PROPERTIES_FORM: FormSchema = {
  id: 'document-extraction',
  title: NODE_LABEL,
  mode: 'onChange',
  steps: [
    {
      id: 'extraction',
      title: 'Extraction',
      sections: [
        {
          id: 'main',
          fields: [
            {
              type: 'select',
              name: 'model',
              label: 'Extractor',
              defaultValue: 'prebuilt-invoice',
              dataSource: {
                type: 'static',
                options: [
                  { label: 'Invoice (prebuilt)', value: 'prebuilt-invoice' },
                  { label: 'Receipt (prebuilt)', value: 'prebuilt-receipt' },
                  { label: 'Custom taxonomy', value: 'custom' },
                ],
              },
            },
            {
              type: 'text',
              name: 'taxonomyFile',
              label: 'Custom taxonomy',
            },
            {
              type: 'multiselect',
              name: 'fields',
              label: 'Fields to extract',
              defaultValue: ['vendor', 'total', 'date'],
              dataSource: {
                type: 'static',
                options: [
                  { label: 'Vendor', value: 'vendor' },
                  { label: 'Total', value: 'total' },
                  { label: 'Date', value: 'date' },
                  { label: 'Line items', value: 'lineItems' },
                  { label: 'PO number', value: 'po' },
                ],
              },
            },
            {
              type: 'number',
              name: 'minConfidence',
              label: 'Minimum confidence',
              defaultValue: 0.8,
            },
            {
              type: 'switch',
              name: 'autoValidate',
              label: 'Auto-validate high-confidence fields',
              defaultValue: true,
            },
            {
              type: 'switch',
              name: 'extractTables',
              label: 'Extract tables',
              defaultValue: true,
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
              defaultValue: NODE_ID,
            },
            {
              type: 'text',
              name: 'label',
              label: 'Label',
              defaultValue: 'Extract invoice fields',
            },
            { type: 'textarea', name: 'description', label: 'Description' },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Custom extra tab: a table view of the extraction results
// ============================================================================

function ExtractionTable({ fields }: { fields: ExtractionField[] }) {
  return (
    <div className="h-full overflow-auto px-(--mf-content-inset,1rem) py-2">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="text-left text-foreground-subtle">
            <th className="border-b border-border-subtle py-1.5 pr-2 font-medium">Field</th>
            <th className="border-b border-border-subtle py-1.5 pr-2 font-medium">Value</th>
            <th className="border-b border-border-subtle py-1.5 pr-2 text-right font-medium">
              Confidence
            </th>
            <th className="border-b border-border-subtle py-1.5 text-right font-medium">Page</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="align-top">
              <td className="border-b border-border-subtle/50 py-1.5 pr-2 font-mono">{f.name}</td>
              <td className="border-b border-border-subtle/50 py-1.5 pr-2">{f.value}</td>
              <td
                className={cn(
                  'border-b border-border-subtle/50 py-1.5 pr-2 text-right tabular-nums',
                  f.confidence < 0.8 ? 'text-warning' : 'text-foreground-muted'
                )}
              >
                {(f.confidence * 100).toFixed(0)}%
              </td>
              <td className="border-b border-border-subtle/50 py-1.5 text-right tabular-nums text-foreground-muted">
                {f.page}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Panels
// ============================================================================

// Fills its ResizablePanel; the group carries the card chrome (rounded border
// + shadow) and clips the flush panels. `overflow-hidden` keeps panel content
// from spilling across the resize handles.
const IOPanelFill = ({ children }: { children: ReactNode }) => (
  <div className="h-full w-full overflow-hidden">{children}</div>
);

const APOLLO_MODES = ['live', 'static', 'simulated'] as const;

function InputPanel({
  schema,
  initialValue,
  readOnly,
}: {
  schema?: JsonSchema;
  initialValue?: JsonContainer;
  readOnly: boolean;
}) {
  const [value, setValue] = useState<JsonContainer | undefined>(initialValue);
  const { nodeActions, preview, clearPreview } = useFileNodeActions();
  return (
    <IOPanelFill>
      <NodePropertyPanel panelTitle="Input" onClose={() => {}} className="h-full">
        <div className="flex h-full flex-col">
          <NodeIOView
            className="min-h-0 flex-1"
            inset
            beforeContent={preview && <FilePreviewBanner file={preview} onClose={clearPreview} />}
            schema={schema}
            value={value}
            onValueChange={setValue}
            readOnly={readOnly}
            searchPlaceholder="Search inputs..."
            filters={INPUT_FILTERS}
            decorateNode={decorateNodeHeader}
            deriveTypeIcon={deriveFileTypeIcon}
            renderValue={renderFileValueCell}
            nodeActions={nodeActions}
            renderCodeEditor={renderJsonCodeEditor}
            pathForCopy={(path) => `$vars.${path}`}
            jsonView={<MonacoJsonView value={value} />}
          />
        </div>
      </NodePropertyPanel>
    </IOPanelFill>
  );
}

function PropertiesPanel() {
  return (
    <IOPanelFill>
      <NodePropertyPanel
        panelTitle="Properties"
        onClose={() => {}}
        nodeIcon={<ScanText />}
        nodeLabel="Extract invoice fields"
        nodeCategory={NODE_LABEL}
        className="h-full"
        schema={PROPERTIES_FORM}
      />
    </IOPanelFill>
  );
}

function OutputPanel({
  showExtractionTab,
  readOnly,
}: {
  showExtractionTab: boolean;
  readOnly: boolean;
}) {
  const [mode, setMode] = useState<(typeof APOLLO_MODES)[number]>('live');
  const [value, setValue] = useState<JsonContainer | undefined>(OUTPUT_VALUE);
  const { nodeActions, preview, clearPreview } = useFileNodeActions();
  // The mocked output is editable only in Static mode (and never when the
  // story forces read-only).
  const isStatic = !readOnly && mode === 'static';

  const extraTabs = useMemo<NodeIOViewTab[] | undefined>(() => {
    if (!showExtractionTab) return undefined;
    return [
      {
        id: 'extraction',
        label: 'Extraction',
        content: <ExtractionTable fields={EXTRACTION_FIELDS} />,
      },
    ];
  }, [showExtractionTab]);

  return (
    <IOPanelFill>
      <NodePropertyPanel panelTitle="Output" onClose={() => {}} className="h-full">
        <div className="flex h-full flex-col">
          <NodeIOView
            className="min-h-0 flex-1"
            inset
            beforeContent={preview && <FilePreviewBanner file={preview} onClose={clearPreview} />}
            // The tree's first row already names the node, so the mode select
            // sits at the end of the toolbar instead of in a title bar.
            toolbarTrailing={
              <NodeOutputModeSelect
                value={mode}
                onChange={(m) => setMode(m as (typeof APOLLO_MODES)[number])}
                disabled={readOnly}
              />
            }
            schema={OUTPUT_SCHEMA}
            value={value}
            readOnly={!isStatic}
            onValueChange={isStatic ? setValue : undefined}
            searchPlaceholder="Search output..."
            decorateNode={decorateNodeHeader}
            deriveTypeIcon={deriveFileTypeIcon}
            renderValue={renderFileValueCell}
            nodeActions={nodeActions}
            renderCodeEditor={renderJsonCodeEditor}
            pathForCopy={(path) => `$vars.${path}`}
            extraTabs={extraTabs}
            jsonView={<MonacoJsonView value={value} />}
          />
        </div>
      </NodePropertyPanel>
    </IOPanelFill>
  );
}

// ── Input / Output story ────────────────────────────────────────────────────

// Input panel data variants selectable from the story controls.
const INPUT_DATA = {
  'schema-and-value': { schema: INPUT_SCHEMA, initialValue: INPUT_VALUE },
  'schema-only': { schema: INPUT_SCHEMA, initialValue: undefined },
  'value-only': { schema: undefined, initialValue: INPUT_VALUE },
} as const;

interface StoryArgs {
  showExtractionTab: boolean;
  readOnly: boolean;
  inputData: keyof typeof INPUT_DATA;
}

type IOStory = StoryObj<StoryArgs>;
