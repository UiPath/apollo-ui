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
  LockableFieldType,
  LockableValueFieldMode,
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
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FIELD_TYPE_META,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Label,
  LockableValueField,
  MetadataForm,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  RequiredIndicator,
  ScrollableTabsList,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  ChevronsDownUp,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleDot,
  CircleOff,
  Code2,
  Copy,
  Eye,
  EyeOff,
  File,
  FileBracesCorner,
  GitFork,
  Globe,
  GripVertical,
  HardDrive,
  Info,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ScanText,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  UserRoundCheck,
  WrapText,
  X,
  Zap,
} from 'lucide-react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
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
import { CanvasTooltip } from '../CanvasTooltip';
import type {
  DeriveTypeIcon,
  JsonCodeEditorRenderProps,
  JsonContainer,
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
import { NodePropertyPanel } from './NodePropertyPanel';
import { NodePropertyPanelLayout } from './NodePropertyPanelLayout';
import { PanelField, PanelFieldLabel } from './PanelField';

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

function DebugButton() {
  return (
    <button
      type="button"
      className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-foreground-on-accent transition hover:bg-brand-hover"
    >
      <Play size={14} />
      Debug
    </button>
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
  return match ? THEME_CLASS_MAP[match] : 'apollo-future-dark';
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

// Matches the tab chrome TabbedStepForm uses inside MetadataForm.
const TAB_LIST_CLASS =
  'h-auto justify-start gap-0.5 overflow-x-auto rounded-lg bg-transparent p-0.5 text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const TAB_TRIGGER_CLASS =
  'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm';

// ============================================================================
// Stories: NodePropertyPanel
// ============================================================================

export const PanelUIInventory: Story = {
  name: 'UI Inventory',
  render: () => <PanelUIInventoryStory />,
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
        contentInset="0.875rem"
        onClose={() => {}}
        className="h-[640px]"
      />
    </PanelFrame>
  ),
};

export const QuickForm: Story = {
  name: 'Form HITL',
  render: () => <QuickFormPanel />,
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
        contentInset="0.875rem"
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
        contentInset="0.875rem"
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
      <NodePropertyPanel
        panelTitle="Properties"
        onClose={() => {}}
        contentInset="0.875rem"
        className="h-[560px]"
      >
        <div className="flex h-full flex-col">
          {/* Inline-editable identity row */}
          <div className="flex shrink-0 items-center justify-between gap-4 py-4 [padding-inline:var(--mf-content-inset,0.875rem)]">
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
              <DebugButton />
            </div>
          </div>

          {/* Tabs + editor */}
          <Tabs defaultValue="parameters" className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 pt-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
              <TabsList className={TAB_LIST_CLASS}>
                <TabsTrigger value="parameters" className={TAB_TRIGGER_CLASS}>
                  Parameters
                </TabsTrigger>
                <TabsTrigger value="error-handling" className={TAB_TRIGGER_CLASS}>
                  Error handling
                </TabsTrigger>
                <TabsTrigger value="advanced" className={TAB_TRIGGER_CLASS}>
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="parameters" className="mt-0 flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between py-2 [padding-inline:var(--mf-content-inset,0.875rem)]">
                <PanelFieldLabel className="leading-4">Path</PanelFieldLabel>
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
              <div className="flex min-h-0 flex-1 flex-col pb-4 [padding-inline:var(--mf-content-inset,0.875rem)]">
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
            </TabsContent>
            <TabsContent value="error-handling" className="mt-0" />
            <TabsContent value="advanced" className="mt-0" />
          </Tabs>
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

export const FullEditor: Story = {
  name: 'Editor Full',
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

const LOCKABLE_VARIABLES = INSERT_SNIPPETS.map((snippet) => ({
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
            className="flex-1 truncate rounded px-1 py-0.5 text-left text-xs font-medium text-foreground transition hover:bg-surface-overlay"
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
          <X size={12} />
        </Button>
      </div>

      {expanded && (
        <>
          {/* Condition label + buttons */}
          <div className="flex items-center justify-between border-t border-border-subtle px-3 py-2">
            <PanelFieldLabel className="leading-4">Condition</PanelFieldLabel>
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
        className="grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-foreground-on-accent"
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
      <NodePropertyPanel
        panelTitle="Properties"
        onClose={() => {}}
        contentInset="0.875rem"
        className="h-[640px]"
      >
        <div className="flex h-full flex-col">
          {/* Inline-editable identity row */}
          <div className="flex shrink-0 items-center justify-between gap-4 py-4 [padding-inline:var(--mf-content-inset,0.875rem)]">
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
              <DebugButton />
            </div>
          </div>

          <Tabs defaultValue="parameters" className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 pt-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
              <TabsList className={TAB_LIST_CLASS}>
                <TabsTrigger value="parameters" className={TAB_TRIGGER_CLASS}>
                  Parameters
                </TabsTrigger>
                <TabsTrigger value="error-handling" className={TAB_TRIGGER_CLASS}>
                  Error handling
                </TabsTrigger>
                <TabsTrigger value="advanced" className={TAB_TRIGGER_CLASS}>
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="parameters" className="mt-0 min-h-0 flex-1 overflow-auto">
              {/* Cases field label row */}
              <div className="py-2 [padding-inline:var(--mf-content-inset,0.875rem)]">
                <span className="text-xs font-medium leading-4 text-foreground">Cases</span>
              </div>

              {/* Case accordion panels: inset cards with gap */}
              <div className="flex flex-col gap-2 pb-1 [padding-inline:var(--mf-content-inset,0.875rem)]">
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
                className="flex cursor-pointer items-center gap-1.5 py-3 text-xs text-brand transition hover:text-brand-hover [padding-inline:var(--mf-content-inset,0.875rem)]"
              >
                <Plus size={12} />
                Add case
              </button>

              {/* Default branch toggle */}
              <div className="flex items-center gap-2 py-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
                <Switch size="sm" checked={defaultBranch} onCheckedChange={setDefaultBranch} />
                <span className="text-xs text-foreground-muted">Default branch</span>
              </div>
            </TabsContent>

            <TabsContent value="error-handling" className="mt-0" />
            <TabsContent value="advanced" className="mt-0" />
          </Tabs>
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

export const CompactEditor: Story = {
  name: 'Editor Compact',
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
  const [mode, setMode] = useState<LockableValueFieldMode>('fixed');

  return (
    <LockableValueField
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
      variables={LOCKABLE_VARIABLES}
    />
  );
}

function InputEditorStory() {
  const [cases, setCases] = useState([{ id: 1, title: 'Return value' }]);
  const nextIdRef = useRef(2);
  const [defaultBranch, setDefaultBranch] = useState(false);
  const [label, setLabel] = useState('End');
  const [category, setCategory] = useState('Control');
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);

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
        contentInset="0.875rem"
        className="h-[640px]"
      >
        <div className="flex h-full flex-col">
          {/* Inline-editable identity row */}
          <div className="flex shrink-0 items-center justify-between gap-4 py-4 [padding-inline:var(--mf-content-inset,0.875rem)]">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle [&>svg]:size-5">
                <CircleCheck />
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
              <DebugButton />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="parameters" className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 pt-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
              <TabsList className={TAB_LIST_CLASS}>
                <TabsTrigger value="parameters" className={TAB_TRIGGER_CLASS}>
                  Parameters
                </TabsTrigger>
                <TabsTrigger value="error-handling" className={TAB_TRIGGER_CLASS}>
                  Error handling
                </TabsTrigger>
                <TabsTrigger value="advanced" className={TAB_TRIGGER_CLASS}>
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="parameters" className="mt-0 min-h-0 flex-1 overflow-auto">
              <div className="py-2 [padding-inline:var(--mf-content-inset,0.875rem)]">
                <span className="text-xs font-medium leading-4 text-foreground">
                  Output messaging
                </span>
              </div>
              <div className="flex flex-col gap-3 pb-1 [padding-inline:var(--mf-content-inset,0.875rem)]">
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
                className="flex cursor-pointer items-center gap-1.5 py-3 text-xs text-brand transition hover:text-brand-hover [padding-inline:var(--mf-content-inset,0.875rem)]"
              >
                <Plus size={12} />
                Add output variable
              </button>
              <div className="flex items-center gap-2 py-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
                <Switch size="sm" checked={defaultBranch} onCheckedChange={setDefaultBranch} />
                <span className="text-xs text-foreground-muted">Default branch</span>
              </div>
            </TabsContent>
            <TabsContent value="error-handling" className="mt-0" />
            <TabsContent value="advanced" className="mt-0" />
          </Tabs>
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

export const InputEditor: Story = {
  name: 'Editor Inline',
  render: () => <InputEditorStory />,
};

export const Output: Story = {
  name: 'Input / Output',
  render: () => <InputOutputStory />,
  parameters: { layout: 'fullscreen' },
};

// ============================================================================
// Output Panel helpers
// ============================================================================

type OutputNode = {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  value?: string | number | boolean | null;
  children?: OutputNode[];
  path: string;
};

function TypeBadge({ type }: { type: OutputNode['type'] }) {
  const labels: Record<OutputNode['type'], string> = {
    string: 'T',
    number: '#',
    boolean: '?',
    object: '{}',
    array: '[]',
    null: '∅',
  };
  const label = labels[type];
  const cls = 'border-border bg-surface-overlay text-foreground-muted';
  return (
    <span
      className={cn(
        'inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded border px-0.5 font-mono text-[9px] font-semibold leading-none',
        cls
      )}
    >
      {label}
    </span>
  );
}

function outputValueColorClass(type: OutputNode['type'], value: unknown): string {
  if (type === 'string') return 'text-success';
  if (type === 'number') return 'text-info';
  if (type === 'boolean') return value ? 'text-success' : 'text-error';
  if (type === 'null') return 'text-foreground-subtle';
  return 'text-foreground';
}

function formatOutputValue(
  type: OutputNode['type'],
  value: string | number | boolean | null | undefined
): string {
  if (type === 'null' || value === null || value === undefined) return 'null';
  if (type === 'string') return `"${value}"`;
  return String(value);
}

function nodeMatchesQuery(node: OutputNode, q: string): boolean {
  if (!q) return true;
  if (node.key.toLowerCase().includes(q)) return true;
  if (
    node.value !== undefined &&
    node.value !== null &&
    String(node.value).toLowerCase().includes(q)
  )
    return true;
  return node.children?.some((c) => nodeMatchesQuery(c, q)) ?? false;
}

function collectContainerPaths(nodes: OutputNode[]): string[] {
  const paths: string[] = [];
  for (const n of nodes) {
    if (n.children) {
      paths.push(n.path);
      paths.push(...collectContainerPaths(n.children));
    }
  }
  return paths;
}

type FlatRow = { node: OutputNode; depth: number };

function flattenOutputTree(
  nodes: OutputNode[],
  collapsed: Record<string, boolean>,
  query: string,
  depth = 0
): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const n of nodes) {
    if (query && !nodeMatchesQuery(n, query)) continue;
    rows.push({ node: n, depth });
    if (n.children && !collapsed[n.path]) {
      rows.push(...flattenOutputTree(n.children, collapsed, query, depth + 1));
    }
  }
  return rows;
}

function appendOutputTreeChild(
  nodes: OutputNode[],
  parentPath: string,
  child: OutputNode
): OutputNode[] {
  return nodes.map((node) => {
    if (node.path === parentPath) {
      return { ...node, children: [...(node.children ?? []), child] };
    }
    if (!node.children) return node;
    const children = appendOutputTreeChild(node.children, parentPath, child);
    return children.some((next, index) => next !== node.children?.[index])
      ? { ...node, children }
      : node;
  });
}

function removeOutputTreeNode(nodes: OutputNode[], path: string): OutputNode[] {
  return nodes
    .filter((node) => node.path !== path)
    .map((node) =>
      node.children ? { ...node, children: removeOutputTreeNode(node.children, path) } : node
    );
}

const PANEL_NODE_ID = 'httpRequest1';
const PANEL_NODE_LABEL = 'HTTP Request';

// ============================================================================

const REFERENCED_OUTPUTS = [
  { name: 'responseBody', type: 'object' },
  { name: 'statusCode', type: 'number' },
  { name: 'headers', type: 'object' },
  { name: 'errorMessage', type: 'string' },
  { name: 'duration', type: 'number' },
  { name: 'requestId', type: 'string' },
  { name: 'token', type: 'string' },
];

const REFERENCED_INPUTS = [
  { name: 'responseBody', type: 'object' },
  { name: 'statusCode', type: 'number' },
  { name: 'headers', type: 'object' },
  { name: 'condition', type: 'string' },
  { name: 'result', type: 'boolean' },
  { name: 'prompt', type: 'string' },
  { name: 'response', type: 'string' },
  { name: 'assignee', type: 'string' },
  { name: 'message', type: 'string' },
];

const HTTP_REQUEST_CHILDREN: OutputNode[] = [
  { key: 'statusCode', type: 'number', value: 200, path: `${PANEL_NODE_ID}.statusCode` },
  {
    key: 'responseBody',
    type: 'object',
    path: `${PANEL_NODE_ID}.responseBody`,
    children: [
      { key: 'id', type: 'string', value: 'inv-001', path: `${PANEL_NODE_ID}.responseBody.id` },
      {
        key: 'amount',
        type: 'number',
        value: 1500,
        path: `${PANEL_NODE_ID}.responseBody.amount`,
      },
      {
        key: 'currency',
        type: 'string',
        value: 'USD',
        path: `${PANEL_NODE_ID}.responseBody.currency`,
      },
      {
        key: 'status',
        type: 'string',
        value: 'paid',
        path: `${PANEL_NODE_ID}.responseBody.status`,
      },
    ],
  },
  {
    key: 'headers',
    type: 'object',
    path: `${PANEL_NODE_ID}.headers`,
    children: [
      {
        key: 'content-type',
        type: 'string',
        value: 'application/json',
        path: `${PANEL_NODE_ID}.headers.content-type`,
      },
      {
        key: 'x-request-id',
        type: 'string',
        value: 'abc-123',
        path: `${PANEL_NODE_ID}.headers.x-request-id`,
      },
    ],
  },
  { key: 'errorMessage', type: 'string', value: null, path: `${PANEL_NODE_ID}.errorMessage` },
  { key: 'duration', type: 'number', value: 342, path: `${PANEL_NODE_ID}.duration` },
  { key: 'requestId', type: 'string', value: 'req-abc-123', path: `${PANEL_NODE_ID}.requestId` },
  {
    key: 'token',
    type: 'string',
    value: 'eyJhbGciOiJSUzI1NiJ9',
    path: `${PANEL_NODE_ID}.token`,
  },
  { key: 'retryCount', type: 'number', value: 0, path: `${PANEL_NODE_ID}.retryCount` },
  { key: 'cached', type: 'boolean', value: false, path: `${PANEL_NODE_ID}.cached` },
];

const INPUT_TREE_DATA: OutputNode[] = [
  { key: PANEL_NODE_ID, type: 'object', path: PANEL_NODE_ID, children: HTTP_REQUEST_CHILDREN },
  {
    key: 'decision1',
    type: 'object',
    path: 'decision1',
    children: [
      {
        key: 'condition',
        type: 'string',
        value: 'invoice.amount > 1000',
        path: 'decision1.condition',
      },
      { key: 'result', type: 'boolean', value: true, path: 'decision1.result' },
      { key: 'branch', type: 'string', value: 'approve', path: 'decision1.branch' },
    ],
  },
  {
    key: 'agent1',
    type: 'object',
    path: 'agent1',
    children: [
      {
        key: 'prompt',
        type: 'string',
        value: 'Summarize the invoice details',
        path: 'agent1.prompt',
      },
      { key: 'model', type: 'string', value: 'gpt-4o-mini', path: 'agent1.model' },
      {
        key: 'response',
        type: 'string',
        value: 'Invoice inv-001 for $1,500 USD is paid.',
        path: 'agent1.response',
      },
      { key: 'tokens', type: 'number', value: 342, path: 'agent1.tokens' },
    ],
  },
  {
    key: 'approval1',
    type: 'object',
    path: 'approval1',
    children: [
      { key: 'assignee', type: 'string', value: 'finance-team', path: 'approval1.assignee' },
      {
        key: 'message',
        type: 'string',
        value: 'Please review this invoice',
        path: 'approval1.message',
      },
      { key: 'dueDate', type: 'string', value: '2025-01-15', path: 'approval1.dueDate' },
    ],
  },
];

const HTTP_REQUEST_JSON = JSON.stringify(
  {
    statusCode: 200,
    responseBody: {
      id: 'inv-001',
      amount: 1500.0,
      currency: 'USD',
      status: 'paid',
    },
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'abc-123',
    },
    errorMessage: null,
    duration: 342,
    requestId: 'req-abc-123',
    token: 'eyJhbGciOiJSUzI1NiJ9',
    retryCount: 0,
    cached: false,
  },
  null,
  2
);

const OUTPUT_TREE_DATA: OutputNode[] = [
  { key: PANEL_NODE_ID, type: 'object', path: PANEL_NODE_ID, children: HTTP_REQUEST_CHILDREN },
];

const INPUT_JSON = HTTP_REQUEST_JSON;
const OUTPUT_JSON = HTTP_REQUEST_JSON;

// ============================================================================
// Concept 2: Expression Reference Panel
// Flat list of all leaf output paths as copyable expression references.
// ============================================================================

function Concept2PanelStory({
  mode,
  context = 'flow',
}: {
  mode: 'input' | 'output';
  context?: 'studio' | 'flow';
}) {
  const monacoTheme = useMonacoTheme();
  const [treeData, setTreeData] = useState<OutputNode[]>(() =>
    mode === 'output' ? OUTPUT_TREE_DATA : INPUT_TREE_DATA
  );
  const nextFieldNumber = useRef(2);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'default' | 'referenced' | 'all'>('default');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      [...collectContainerPaths(OUTPUT_TREE_DATA), ...collectContainerPaths(INPUT_TREE_DATA)]
        .filter((p) => p !== PANEL_NODE_ID)
        .map((p) => [p, true])
    )
  );
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [wrappedPaths, setWrappedPaths] = useState<Set<string>>(() => new Set());
  const [openActionsPath, setOpenActionsPath] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<
    Record<string, string | number | boolean | null>
  >({});
  const [nodeMode, setNodeMode] = useState<'live' | 'static' | 'simulated' | 'disabled'>('live');

  const NODE_MODES = [
    {
      value: 'live',
      label: 'Live',
      description: 'Use the real response from this node',
      icon: CircleDot,
    },
    {
      value: 'static',
      label: 'Static mock',
      description: 'Always return a value you define',
      icon: FileBracesCorner,
    },
    {
      value: 'simulated',
      label: 'Simulated',
      description: 'Generate a response dynamically using an LLM',
      icon: Sparkles,
    },
    {
      value: 'disabled',
      label: 'Skip node',
      description: "Don't execute this node",
      icon: CircleOff,
    },
  ] as const;
  const currentNodeMode = NODE_MODES.find((m) => m.value === nodeMode) ?? NODE_MODES[0];
  const CurrentModeIcon = currentNodeMode.icon;

  const isOutput = mode === 'output';
  const currentTreeData = treeData;
  const currentReferenced = isOutput ? REFERENCED_OUTPUTS : REFERENCED_INPUTS;
  const currentJson = isOutput ? OUTPUT_JSON : INPUT_JSON;
  const referencedKeys = new Set(currentReferenced.map((r) => r.name));

  const activeTreeData =
    filter !== 'referenced'
      ? currentTreeData
      : currentTreeData
          .map((root) => ({
            ...root,
            children: root.children?.filter((n) => referencedKeys.has(n.key)),
          }))
          .filter((root) => (root.children?.length ?? 0) > 0);

  const rows = flattenOutputTree(activeTreeData, collapsed, search.toLowerCase());

  const toggleCollapsed = (path: string) =>
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));

  const allContainerPaths = collectContainerPaths(activeTreeData);
  const allCollapsed = allContainerPaths.length > 0 && allContainerPaths.every((p) => collapsed[p]);
  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsed({});
    } else {
      setCollapsed(Object.fromEntries(allContainerPaths.map((p) => [p, true])));
    }
  };

  const escapeRef = useRef(false);

  const saveEdit = (node: OutputNode, raw: string) => {
    const val =
      node.type === 'boolean' ? raw === 'true' : node.type === 'number' ? Number(raw) || 0 : raw;
    setEditedValues((prev) => ({ ...prev, [node.path]: val }));
    setEditingPath(null);
  };

  const copyValue = (node: OutputNode) => {
    const value = editedValues[node.path] ?? node.value;
    navigator.clipboard
      ?.writeText(typeof value === 'string' ? value : JSON.stringify(value))
      ?.then(() => {
        setCopiedPath(node.path);
        setTimeout(() => setCopiedPath(null), 1500);
      })
      ?.catch(() => {});
  };

  const toggleWrapped = (path: string) => {
    setWrappedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const addVariable = (node: OutputNode) => {
    const parentPath = node.path.slice(0, node.path.lastIndexOf('.'));
    const fieldName = `field${nextFieldNumber.current++}`;
    const path = `${parentPath}.${fieldName}`;
    const field: OutputNode = { key: fieldName, type: 'string', value: '', path };

    setTreeData((current) => appendOutputTreeChild(current, parentPath, field));
    setCollapsed((current) => ({ ...current, [parentPath]: false }));
    setFilter('all');
    setSearch('');
    setEditingPath(path);
  };

  const deleteVariable = (node: OutputNode) => {
    setTreeData((current) => removeOutputTreeNode(current, node.path));
    setEditedValues((current) => {
      const next = { ...current };
      delete next[node.path];
      return next;
    });
    if (editingPath === node.path) setEditingPath(null);
  };

  const hasOverflowActions = (node: OutputNode) =>
    node.type === 'string' &&
    (node.key === 'requestId' || node.key === 'token' || node.key.startsWith('field'));

  return (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle={isOutput ? 'Output' : 'Input'}
        contentInset="0.875rem"
        onClose={() => {}}
        className="h-[640px]"
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Node identity bar: hidden in Studio context */}
          {context === 'flow' && (
            <div className="shrink-0 flex items-center justify-between gap-2 [padding-inline:var(--mf-content-inset,0.875rem)] pb-3 pt-4">
              <div className="flex min-w-0 items-center gap-2">
                <Globe size={13} className="shrink-0 text-foreground-subtle" />
                <span className="text-xs font-medium text-foreground">{PANEL_NODE_LABEL}</span>
                <span className="font-mono text-[10px] text-foreground-muted">{PANEL_NODE_ID}</span>
              </div>
              {isOutput && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
                    >
                      <CurrentModeIcon size={10} className="text-foreground-subtle" />
                      <span>{currentNodeMode.label}</span>
                      <ChevronDown size={10} className="text-foreground-subtle" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {NODE_MODES.map((m) => {
                      const Icon = m.icon;
                      return (
                        <DropdownMenuItem
                          key={m.value}
                          onClick={() => setNodeMode(m.value)}
                          className={cn(
                            'flex items-start gap-2',
                            nodeMode === m.value && 'text-foreground'
                          )}
                        >
                          <Icon size={13} className="mt-[2px] shrink-0 text-foreground-subtle" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium">{m.label}</span>
                            <span className="text-[10px] leading-tight text-foreground-muted">
                              {m.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          <Tabs defaultValue="schema" className="flex min-h-0 flex-1 flex-col">
            {/* Tab strip: status badge moves here in Studio context */}
            <div
              className={cn(
                'shrink-0 flex items-center gap-2 [padding-inline:var(--mf-content-inset,0.875rem)] pb-1.5',
                context === 'studio' && 'pt-3'
              )}
            >
              <TabsList className={TAB_LIST_CLASS}>
                <TabsTrigger value="schema" className={TAB_TRIGGER_CLASS}>
                  Schema
                </TabsTrigger>
                <TabsTrigger value="json" className={TAB_TRIGGER_CLASS}>
                  JSON
                </TabsTrigger>
              </TabsList>
              {context === 'studio' && isOutput && (
                <>
                  <div className="flex-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
                      >
                        <CurrentModeIcon size={10} className="text-foreground-subtle" />
                        <span>{currentNodeMode.label}</span>
                        <ChevronDown size={10} className="text-foreground-subtle" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      {NODE_MODES.map((m) => {
                        const Icon = m.icon;
                        return (
                          <DropdownMenuItem
                            key={m.value}
                            onClick={() => setNodeMode(m.value)}
                            className={cn(
                              'flex items-start gap-2',
                              nodeMode === m.value && 'text-foreground'
                            )}
                          >
                            <Icon size={13} className="mt-[2px] shrink-0 text-foreground-subtle" />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium">{m.label}</span>
                              <span className="text-[10px] leading-tight text-foreground-muted">
                                {m.description}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Schema tab */}
            <TabsContent value="schema" className="mt-0 flex min-h-0 flex-1 flex-col">
              {/* Header: filter dropdown on left, search + collapse on right */}
              <div className="shrink-0 flex items-center gap-1.5 [padding-inline:var(--mf-content-inset,0.875rem)] pb-1 pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex cursor-pointer shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
                    >
                      <span>
                        {filter === 'referenced'
                          ? 'Filter: Referenced in this node'
                          : filter === 'all'
                            ? 'Filter: All'
                            : 'Filter'}
                      </span>
                      {filter === 'referenced' && (
                        <span className="rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-foreground">
                          {currentReferenced.length}
                        </span>
                      )}
                      <ChevronDown size={10} className="text-foreground-subtle" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem
                      onClick={() => setFilter('referenced')}
                      className={cn(
                        'flex items-center justify-between',
                        filter === 'referenced' && 'text-foreground'
                      )}
                    >
                      <span className="text-[11px]">Referenced in this node</span>
                      <span className="ml-3 rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-foreground-muted">
                        {currentReferenced.length}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilter('all')}
                      className={cn('text-[11px]', filter === 'all' && 'text-foreground')}
                    >
                      All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex-1" />
                {searchOpen ? (
                  <div className="relative flex items-center">
                    <Search
                      size={12}
                      className="pointer-events-none absolute left-2 text-foreground-subtle"
                    />
                    <Input
                      autoFocus
                      type="text"
                      variant="ghost"
                      size="xs"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearch('');
                          setSearchOpen(false);
                        }
                      }}
                      aria-label={isOutput ? 'Search outputs' : 'Search inputs'}
                      placeholder={isOutput ? 'Search outputs...' : 'Search inputs...'}
                      className="w-36 pl-6 pr-6 text-foreground placeholder:text-foreground-subtle focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setSearchOpen(false);
                      }}
                      aria-label="Clear search"
                      className="absolute right-1.5 grid size-4 place-items-center text-foreground-subtle transition hover:text-foreground"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="4xs"
                    icon
                    onClick={() => setSearchOpen(true)}
                    title="Search fields"
                    aria-label="Search fields"
                    className="rounded text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                  >
                    <Search size={12} />
                  </Button>
                )}
                {allContainerPaths.length > 0 && (
                  <Button
                    variant="ghost"
                    size="4xs"
                    icon
                    onClick={toggleAll}
                    title={allCollapsed ? 'Expand all' : 'Collapse all'}
                    aria-label={allCollapsed ? 'Expand all' : 'Collapse all'}
                    className="rounded text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                  >
                    {allCollapsed ? <ChevronsUpDown size={12} /> : <ChevronsDownUp size={12} />}
                  </Button>
                )}
              </div>

              {/* Tree list */}
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-surface-overlay bg-surface-overlay/40 pb-0 [margin-inline:var(--mf-content-inset,0.875rem)] mb-4 mt-1">
                <div className="h-full overflow-y-auto pt-1.5">
                  {rows.map(({ node, depth }) =>
                    node.children !== undefined ? (
                      <div
                        key={node.path}
                        className="group flex cursor-default items-center gap-2 py-1 transition hover:bg-surface-overlay"
                        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '14px' }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCollapsed(node.path)}
                          aria-label={
                            collapsed[node.path] ? `Expand ${node.key}` : `Collapse ${node.key}`
                          }
                          className="cursor-pointer grid size-3 shrink-0 place-items-center text-foreground-subtle transition hover:text-foreground"
                        >
                          <ChevronDown
                            size={10}
                            className={cn(
                              'transition-transform duration-100',
                              collapsed[node.path] && '-rotate-90'
                            )}
                          />
                        </button>
                        <TypeBadge type={node.type} />
                        <span className="flex-1 truncate font-mono text-xs text-foreground">
                          {node.key}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-foreground-muted">
                          {node.type === 'array'
                            ? `${node.children.length} ${node.children.length === 1 ? 'item' : 'items'}`
                            : `${node.children.length} ${node.children.length === 1 ? 'key' : 'keys'}`}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={node.path}
                        className="group flex cursor-default items-center gap-2 py-1 transition hover:bg-surface-overlay"
                        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '14px' }}
                      >
                        <div className="size-3 shrink-0" />
                        <TypeBadge type={node.type} />
                        <span className="shrink-0 font-mono text-xs text-foreground">
                          {node.key}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-foreground-subtle">=</span>
                        {editingPath === node.path ? (
                          <input
                            autoFocus
                            type="text"
                            aria-label={`Edit value for ${node.key}`}
                            placeholder="value"
                            defaultValue={String(editedValues[node.path] ?? node.value ?? '')}
                            onBlur={(e) => {
                              if (!escapeRef.current) saveEdit(node, e.target.value);
                              escapeRef.current = false;
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(node, e.currentTarget.value);
                              if (e.key === 'Escape') {
                                escapeRef.current = true;
                                setEditingPath(null);
                              }
                            }}
                            className={cn(
                              'min-w-0 flex-1 rounded bg-transparent px-1 font-mono text-xs outline-none ring-1 ring-brand',
                              outputValueColorClass(
                                node.type,
                                editedValues[node.path] ?? node.value
                              )
                            )}
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => node.type !== 'null' && setEditingPath(node.path)}
                              className={cn(
                                'max-w-[55%] shrink-0 font-mono text-xs',
                                wrappedPaths.has(node.path)
                                  ? 'whitespace-normal break-words text-left'
                                  : 'truncate',
                                node.type !== 'null' ? 'cursor-text' : 'cursor-default',
                                outputValueColorClass(
                                  node.type,
                                  editedValues[node.path] ?? node.value
                                )
                              )}
                            >
                              {formatOutputValue(
                                node.type,
                                (editedValues[node.path] ?? node.value) as
                                  | string
                                  | number
                                  | boolean
                                  | null
                              )}
                            </button>
                            <div className="flex-1" />
                            {hasOverflowActions(node) ? (
                              <DropdownMenu
                                open={openActionsPath === node.path}
                                onOpenChange={(open) => setOpenActionsPath(open ? node.path : null)}
                              >
                                <CanvasTooltip
                                  content="More actions"
                                  placement="top"
                                  delay
                                  hide={openActionsPath === node.path}
                                >
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="4xs"
                                      icon
                                      aria-label={`More actions for ${node.key}`}
                                      className={cn(
                                        'shrink-0 rounded text-foreground-subtle opacity-0 hover:bg-surface-raised hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100',
                                        openActionsPath === node.path && 'opacity-100'
                                      )}
                                    >
                                      <MoreHorizontal size={11} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                </CanvasTooltip>
                                <DropdownMenuContent
                                  side="left"
                                  align="start"
                                  sideOffset={-12}
                                  className="min-w-40"
                                >
                                  <DropdownMenuItem
                                    onClick={() => toggleWrapped(node.path)}
                                    className={cn(
                                      'gap-2 text-xs',
                                      wrappedPaths.has(node.path) && 'text-brand'
                                    )}
                                  >
                                    <WrapText size={14} />
                                    {wrappedPaths.has(node.path) ? 'Unwrap value' : 'Wrap value'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => copyValue(node)}
                                    className="gap-2 text-xs"
                                  >
                                    {copiedPath === node.path ? (
                                      <CircleCheck size={14} className="text-brand" />
                                    ) : (
                                      <Copy size={14} />
                                    )}
                                    Copy value
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => addVariable(node)}
                                    className="gap-2 text-xs"
                                  >
                                    <Plus size={14} />
                                    Add variable
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteVariable(node)}
                                    className="gap-2 text-xs text-error focus:text-error"
                                  >
                                    <Trash2 size={14} />
                                    Delete variable
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <>
                                {node.type === 'string' && (
                                  <CanvasTooltip
                                    content={
                                      wrappedPaths.has(node.path) ? 'Unwrap value' : 'Wrap value'
                                    }
                                    placement="top"
                                    delay
                                  >
                                    <Button
                                      variant="ghost"
                                      size="4xs"
                                      icon
                                      onClick={() => toggleWrapped(node.path)}
                                      aria-label={`${
                                        wrappedPaths.has(node.path) ? 'Unwrap' : 'Wrap'
                                      } value of ${node.key}`}
                                      className={cn(
                                        'shrink-0 rounded text-foreground-subtle opacity-0 hover:bg-surface-raised hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100',
                                        wrappedPaths.has(node.path) && 'text-brand opacity-100'
                                      )}
                                    >
                                      <WrapText size={11} />
                                    </Button>
                                  </CanvasTooltip>
                                )}
                                <CanvasTooltip content="Copy value" placement="top" delay>
                                  <Button
                                    variant="ghost"
                                    size="4xs"
                                    icon
                                    onClick={() => copyValue(node)}
                                    aria-label={`Copy value of ${node.key}`}
                                    className="shrink-0 rounded text-foreground-subtle opacity-0 hover:bg-surface-raised hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                                  >
                                    {copiedPath === node.path ? (
                                      <CircleCheck size={11} className="text-brand" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </Button>
                                </CanvasTooltip>
                                <CanvasTooltip content="Add variable" placement="top" delay>
                                  <Button
                                    variant="ghost"
                                    size="4xs"
                                    icon
                                    onClick={() => addVariable(node)}
                                    aria-label={`Add ${node.key} as a variable`}
                                    className="shrink-0 rounded text-foreground-subtle opacity-0 hover:bg-surface-raised hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                                  >
                                    <Plus size={11} />
                                  </Button>
                                </CanvasTooltip>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )
                  )}
                  {rows.length === 0 && (
                    <p className="py-4 text-center text-xs text-foreground-subtle">
                      No references match your search.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* JSON tab */}
            <TabsContent
              value="json"
              className="mt-0 flex min-h-0 flex-1 flex-col pb-4 pt-1 [padding-inline:var(--mf-content-inset,0.875rem)]"
            >
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-surface-overlay">
                <MonacoEditor
                  height="100%"
                  language="json"
                  value={currentJson}
                  theme={monacoTheme}
                  beforeMount={registerMonacoThemes}
                  options={JSON_VIEWER_OPTIONS}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </NodePropertyPanel>
    </PanelFrame>
  );
}

// ============================================================================
// In Studio / In Flow layout
// ============================================================================

function InputOutputStory() {
  const [context, setContext] = useState<'studio' | 'flow'>('flow');
  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="flex items-center overflow-hidden rounded border border-border">
        {(['flow', 'studio'] as const).map((c, i) => (
          <span key={c} className="contents">
            {i > 0 && <div className="h-3 w-px bg-border" />}
            <button
              type="button"
              onClick={() => setContext(c)}
              className={cn(
                'cursor-pointer px-3 py-1 text-xs font-medium transition',
                context === c
                  ? 'bg-surface-overlay text-foreground'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              {c === 'studio' ? 'In Studio' : 'In Flow'}
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-start gap-[50px]">
        <div className="w-[380px]">
          <Concept2PanelStory mode="input" context={context} />
        </div>
        <div className="w-[380px]">
          <Concept2PanelStory mode="output" context={context} />
        </div>
      </div>
      <Toaster />
    </div>
  );
}

// ============================================================================
// Prototype: LockableValueField
// ============================================================================

interface LockableCase {
  id: number;
  title: string;
  required: boolean;
  value: string;
  locked: boolean;
  mode: LockableValueFieldMode;
  fieldType: LockableFieldType;
}

/** Guards against malformed JSON (e.g. from hand-editing the schema view) reaching setCases -- a
 *  missing/wrong-typed id would break Sortable, and an unknown fieldType would break rendering. */
function isValidLockableCase(item: unknown): item is LockableCase {
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
    (c.mode === 'fixed' || c.mode === 'expression') &&
    typeof c.fieldType === 'string' &&
    Object.hasOwn(FIELD_TYPE_META, c.fieldType)
  );
}

const DEFAULT_LOCKABLE_CASES: LockableCase[] = [
  {
    id: 1,
    title: 'Invoice Number',
    required: true,
    value: '',
    locked: true,
    mode: 'fixed',
    fieldType: 'string',
  },
  {
    id: 2,
    title: 'Submission Date',
    required: true,
    value: '',
    locked: true,
    mode: 'fixed',
    fieldType: 'date',
  },
  {
    id: 3,
    title: 'Approved Amount',
    required: true,
    value: '',
    locked: true,
    mode: 'fixed',
    fieldType: 'integer',
  },
];

function LockableCaseRow({
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
  mode: LockableValueFieldMode;
  onModeChange: (mode: LockableValueFieldMode) => void;
  fieldType: LockableFieldType;
  onFieldTypeChange: (fieldType: LockableFieldType) => void;
  compact?: boolean;
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
        <LockableValueField
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
                  className="truncate rounded px-1 py-0.5 text-left text-xs font-medium text-foreground transition hover:bg-surface-overlay"
                >
                  {caseTitle}
                  {required && <RequiredIndicator />}
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
              className="grid size-6 shrink-0 place-items-center rounded text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
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
          variables={LOCKABLE_VARIABLES}
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
            <X size={12} />
            Delete button
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FieldDragOverlay({ caseItem }: { caseItem: LockableCase }) {
  const meta = FIELD_TYPE_META[caseItem.fieldType];
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 shadow-lg"
      style={{ cursor: 'grabbing' }}
    >
      <GripVertical size={12} className="shrink-0 text-foreground-subtle" />
      <meta.icon size={12} className="shrink-0 text-foreground-subtle" />
      <span className="truncate text-xs font-medium text-foreground">
        {caseItem.title}
        {caseItem.required && <RequiredIndicator />}
      </span>
    </div>
  );
}

function LockableValueFieldShowcase() {
  const fullViewId = useId();
  const compactViewId = useId();
  const [showcaseValue, setShowcaseValue] = useState('');
  const [showcaseLocked, setShowcaseLocked] = useState(true);
  const [showcaseMode, setShowcaseMode] = useState<LockableValueFieldMode>('fixed');
  const [showcaseFieldType, setShowcaseFieldType] = useState<LockableFieldType>('string');
  const [showcaseRequired, setShowcaseRequired] = useState(true);

  const handleShowcaseFieldTypeChange = (type: LockableFieldType) => {
    setShowcaseFieldType(type);
    setShowcaseValue('');
    if (!FIELD_TYPE_META[type].supportsExpression) {
      setShowcaseMode('fixed');
    }
  };

  return (
    <div className="flex w-[380px] shrink-0 flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-raised p-5">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">Demo controls</span>
        <p className="text-xs leading-4 text-foreground-muted">
          Uses component →{' '}
          <a
            href="/?path=/docs/apollo-wind-components-uipath-lockable-value-field--docs"
            target="_top"
            className="font-medium text-brand transition hover:text-brand-hover"
          >
            Value Field
          </a>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Full view
        </span>
        <LockableValueField
          id={fullViewId}
          label={
            <PanelFieldLabel htmlFor={fullViewId} required={showcaseRequired} className="leading-4">
              Label
            </PanelFieldLabel>
          }
          headerActions={
            <button
              type="button"
              aria-label="Delete field"
              title="Delete field"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
            >
              <Trash2 size={14} />
            </button>
          }
          value={showcaseValue}
          onValueChange={setShowcaseValue}
          locked={showcaseLocked}
          onLockedChange={setShowcaseLocked}
          mode={showcaseMode}
          onModeChange={setShowcaseMode}
          fieldType={showcaseFieldType}
          onFieldTypeChange={handleShowcaseFieldTypeChange}
          required={showcaseRequired}
          onRequiredChange={setShowcaseRequired}
          variables={LOCKABLE_VARIABLES}
        />
      </div>
      <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Compact view (narrow container)
        </span>
        <div className="w-[200px]">
          <LockableValueField
            id={compactViewId}
            label={
              <PanelFieldLabel
                htmlFor={compactViewId}
                required={showcaseRequired}
                className="leading-4"
              >
                Label
              </PanelFieldLabel>
            }
            headerActions={
              <button
                type="button"
                aria-label="Delete field"
                title="Delete field"
                className="grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
              >
                <Trash2 size={14} />
              </button>
            }
            value={showcaseValue}
            onValueChange={setShowcaseValue}
            locked={showcaseLocked}
            onLockedChange={setShowcaseLocked}
            mode={showcaseMode}
            onModeChange={setShowcaseMode}
            fieldType={showcaseFieldType}
            onFieldTypeChange={handleShowcaseFieldTypeChange}
            required={showcaseRequired}
            onRequiredChange={setShowcaseRequired}
            variables={LOCKABLE_VARIABLES}
          />
        </div>
      </div>
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
  const [cases, setCases] = useState<LockableCase[]>(DEFAULT_LOCKABLE_CASES);
  const nextIdRef = useRef(4);
  const [formView, setFormView] = useState<'edit' | 'json'>('edit');
  const [formTitle, setFormTitle] = useState('Quick Approve');
  const [formDescription, setFormDescription] = useState('Add a description');
  const [editingFormTitle, setEditingFormTitle] = useState(false);
  const [editingFormDescription, setEditingFormDescription] = useState(false);
  const formTitleRef = useRef<HTMLInputElement>(null);
  const formDescriptionRef = useRef<HTMLInputElement>(null);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(DEFAULT_LOCKABLE_CASES, null, 2));
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
      if (!parsed.every(isValidLockableCase)) {
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

  const addCaseWithType = (fieldType: LockableFieldType) => {
    const id = nextIdRef.current++;
    setCases((prev) => [
      ...prev,
      {
        id,
        title: `Field ${id}`,
        required: true,
        value: '',
        locked: true,
        mode: 'fixed',
        fieldType,
      },
    ]);
  };
  const deleteCase = (id: number) => setCases((prev) => prev.filter((c) => c.id !== id));
  const updateCase = (id: number, patch: Partial<LockableCase>) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addButton = () => {
    const id = nextButtonIdRef.current++;
    setButtons((prev) => [...prev, { id, label: 'Button', variant: 'outline' }]);
  };
  const deleteButton = (id: number) => setButtons((prev) => prev.filter((b) => b.id !== id));
  const updateButton = (id: number, patch: Partial<FormButtonItem>) =>
    setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const updateCaseFieldType = (id: number, fieldType: LockableFieldType) =>
    setCases((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              fieldType,
              value: '',
              mode: FIELD_TYPE_META[fieldType].supportsExpression ? c.mode : 'fixed',
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
      action={<DebugButton />}
      onClose={onClose}
      contentInset="0.875rem"
      className={className}
    >
      <Tabs defaultValue="parameters" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 pt-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
          <TabsList className={TAB_LIST_CLASS}>
            <TabsTrigger value="parameters" className={TAB_TRIGGER_CLASS}>
              Parameters
            </TabsTrigger>
            <TabsTrigger value="branching" className={TAB_TRIGGER_CLASS}>
              Branching
            </TabsTrigger>
            <TabsTrigger value="error-handling" className={TAB_TRIGGER_CLASS}>
              Error handling
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="parameters"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-auto py-3 [padding-inline:var(--mf-content-inset,0.875rem)]"
        >
          {/* Quick form */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Quick form</span>
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
                    <Button size="sm" className="w-full">
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
                              <LockableCaseRow
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
        </TabsContent>
        <TabsContent value="branching" className="mt-0" />
        <TabsContent value="error-handling" className="mt-0" />
      </Tabs>
    </NodePropertyPanel>
  );

  if (embedded) return panel;

  return (
    <div className="flex items-start gap-8">
      <PanelFrame>{panel}</PanelFrame>

      <LockableValueFieldShowcase />
    </div>
  );
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
  children: ReactElement;
}) {
  return (
    <PanelField label={label} description={description}>
      {children}
    </PanelField>
  );
}

const PatternNotesVisibilityContext = createContext(true);

function PatternNote({
  title,
  eyebrow = 'Layout pattern',
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);
  const notesVisible = useContext(PatternNotesVisibilityContext);

  if (dismissed || !notesVisible) return null;

  return (
    <aside className="rounded-lg border border-border-subtle bg-surface-overlay p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">
          {eyebrow}
        </p>
        <Button
          variant="ghost"
          size="4xs"
          icon
          onClick={() => setDismissed(true)}
          aria-label={`Dismiss ${title} note`}
          title="Dismiss note"
          className="-mr-1 -mt-1 shrink-0 text-foreground-subtle hover:bg-surface-raised hover:text-foreground"
        >
          <X size={12} />
        </Button>
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
                <Input value="invoice-extraction-01" readOnly disabled />
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
                <Label className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value="automatic" />
                  Automatic
                </Label>
                <Label className="flex items-center gap-2 font-normal">
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
              <Label htmlFor="sub-container-save-output" className="text-xs">
                Save output for later steps
              </Label>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="sub-container-enabled" className="text-xs">
                Enabled
              </Label>
              <Switch id="sub-container-enabled" checked={enabled} onCheckedChange={setEnabled} />
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

function PanelUIInventoryStory() {
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(true);
  const [notesVisible, setNotesVisible] = useState(true);
  const compositionFieldId = useId();
  const [compositionValue, setCompositionValue] = useState('invoice.total');
  const [compositionLocked, setCompositionLocked] = useState(true);
  const [compositionMode, setCompositionMode] = useState<LockableValueFieldMode>('fixed');
  const [compositionFieldType, setCompositionFieldType] = useState<LockableFieldType>('string');
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

  const updateCompositionFieldType = (fieldType: LockableFieldType) => {
    setCompositionFieldType(fieldType);
    setCompositionValue('');
    if (!FIELD_TYPE_META[fieldType].supportsExpression) setCompositionMode('fixed');
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
          contentInset="0.875rem"
          onClose={() => {}}
          className="h-[720px]"
        >
          <PatternNotesVisibilityContext.Provider value={notesVisible}>
            <Tabs defaultValue="layout" className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3.5 py-3">
                <ScrollableTabsList
                  className={cn(TAB_LIST_CLASS, 'min-w-0 flex-1')}
                  scrollButtonClassName="size-6 hover:bg-surface-overlay"
                >
                  <TabsTrigger value="layout" className={TAB_TRIGGER_CLASS}>
                    Layout
                  </TabsTrigger>
                  <TabsTrigger value="states" className={TAB_TRIGGER_CLASS}>
                    States
                  </TabsTrigger>
                  <TabsTrigger value="actions" className={TAB_TRIGGER_CLASS}>
                    Actions
                  </TabsTrigger>
                  <TabsTrigger value="composition" className={TAB_TRIGGER_CLASS}>
                    Composition
                  </TabsTrigger>
                </ScrollableTabsList>
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
                  aria-label={allSectionsExpanded ? 'Collapse all sections' : 'Expand all sections'}
                  title={allSectionsExpanded ? 'Collapse all sections' : 'Expand all sections'}
                  className="shrink-0 text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                >
                  <ChevronsUpDown size={13} />
                </Button>
              </div>

              <TabsContent value="layout" className="mt-0 min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-4 px-3.5 py-5">
                  <PatternNote title="Flat content">
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
                        <Label htmlFor="flat-pattern-enabled" className="text-xs">
                          Enabled
                        </Label>
                        <p className="text-xs text-foreground-muted">
                          Run this node in the workflow.
                        </p>
                      </div>
                      <Switch id="flat-pattern-enabled" defaultChecked />
                    </div>
                  </div>
                </div>
                <div className="border-t border-border-subtle px-3.5 has-[aside]:pt-5">
                  <PatternNote title="Expandable sections">
                    Full-width sections that reveal or hide related fields without adding nested
                    container chrome.
                  </PatternNote>
                </div>
                <Accordion
                  type="multiple"
                  value={expandedSections}
                  onValueChange={setExpandedSections}
                >
                  <AccordionItem value="text-fields" className="border-border-subtle px-3.5">
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
                        <Input value="Generated by the system" readOnly disabled />
                      </InventoryField>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="choices" className="border-border-subtle px-3.5">
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
                          <Label className="flex items-center gap-2 font-normal">
                            <RadioGroupItem value="automatic" />
                            Automatic
                          </Label>
                          <Label className="flex items-center gap-2 font-normal">
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
                          <Label htmlFor="save-output" className="text-xs">
                            Save output to storage
                          </Label>
                          <p className="text-xs text-foreground-muted">
                            Makes the result available to later steps.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label htmlFor="enabled-switch" className="text-xs">
                            Enabled
                          </Label>
                          <p className="text-xs text-foreground-muted">
                            Run this node in the workflow.
                          </p>
                        </div>
                        <Switch
                          id="enabled-switch"
                          checked={enabled}
                          onCheckedChange={setEnabled}
                        />
                      </div>
                      <InventoryField label="Confidence threshold" description="Current value: 75%">
                        <Slider defaultValue={[75]} max={100} step={5} />
                      </InventoryField>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="advanced" className="border-border-subtle px-3.5">
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
                <div className="grid gap-3 border-t border-border-subtle px-3.5 py-5">
                  <PatternNote title="Sub-containers">
                    Dense, collapsible cards for related configuration when stronger visual grouping
                    is useful.
                  </PatternNote>
                  <InventorySubContainer
                    expandedSections={expandedSubContainerSections}
                    onExpandedSectionsChange={setExpandedSubContainerSections}
                  />
                </div>
              </TabsContent>

              <TabsContent value="states" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3.5">
                <div className="grid gap-5">
                  <section className="grid gap-3">
                    <PatternNote title="Section messages" eyebrow="State pattern">
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

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Navigation validation" eyebrow="State pattern">
                      Error counts on tabs reveal where unresolved issues live, including problems
                      in sections that are not currently visible.
                    </PatternNote>
                    <Tabs defaultValue="parameters">
                      <ScrollableTabsList
                        className={cn(TAB_LIST_CLASS, 'w-full')}
                        scrollButtonClassName="size-6 hover:bg-surface-overlay"
                      >
                        <TabsTrigger value="parameters" className={TAB_TRIGGER_CLASS}>
                          <TabLabelWithError label="Parameters" count={1} />
                        </TabsTrigger>
                        <TabsTrigger value="error-handling" className={TAB_TRIGGER_CLASS}>
                          <TabLabelWithError label="Error handling" count={2} />
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className={TAB_TRIGGER_CLASS}>
                          Advanced
                        </TabsTrigger>
                      </ScrollableTabsList>
                    </Tabs>
                  </section>

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Inline validation" eyebrow="State pattern">
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

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Transient feedback" eyebrow="State pattern">
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

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Status labels" eyebrow="State pattern">
                      Short labels communicate passive field or setting states without interrupting
                      the task.
                    </PatternNote>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Optional</Badge>
                      <Badge variant="outline">Read only</Badge>
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3.5">
                <div className="grid gap-5">
                  <section className="grid gap-3">
                    <PatternNote title="Button hierarchy" eyebrow="Action pattern">
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

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Header actions" eyebrow="Action pattern">
                      Reserve the panel header for high-frequency node-level commands such as
                      running or debugging. Keep the set small so the primary task remains clear.
                    </PatternNote>
                    <div className="flex flex-wrap items-center gap-2">
                      <RunButton />
                      <DebugButton />
                    </div>
                  </section>

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Footer actions" eyebrow="Action pattern">
                      Place panel-level actions at the end of the content, with the primary action
                      last and the cancel action immediately before it.
                    </PatternNote>
                    <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
                      <Button variant="ghost">Cancel</Button>
                      <Button>Save changes</Button>
                    </div>
                  </section>

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Icon-only utilities" eyebrow="Action pattern">
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
              </TabsContent>

              <TabsContent
                value="composition"
                className="mt-0 min-h-0 flex-1 overflow-y-auto p-3.5"
              >
                <div className="grid gap-5">
                  <section className="grid gap-3">
                    <PatternNote title="Repeatable field list" eyebrow="Composition pattern">
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

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Editing modes" eyebrow="Composition pattern">
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

                  <section className="grid gap-3 border-t border-border-subtle pt-5">
                    <PatternNote title="Lockable value field" eyebrow="Composition pattern">
                      Combines field type, required state, AI assistance, variable insertion, and
                      fixed or expression values in one reusable Flow control.
                    </PatternNote>
                    <LockableValueField
                      id={compositionFieldId}
                      label={
                        <PanelFieldLabel
                          htmlFor={compositionFieldId}
                          required={compositionRequired}
                          className="leading-4"
                        >
                          Invoice value
                        </PanelFieldLabel>
                      }
                      headerActions={
                        <CanvasTooltip content="Remove field">
                          <Button variant="ghost" size="4xs" icon aria-label="Remove field">
                            <X size={14} />
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
                      variables={LOCKABLE_VARIABLES}
                    />
                  </section>
                </div>
              </TabsContent>
            </Tabs>
          </PatternNotesVisibilityContext.Provider>
        </NodePropertyPanel>
      </PanelFrame>
      <Toaster className="[&_[data-description]]:!text-foreground-muted [&_[data-icon]]:!mt-0.5 [&_[data-icon]]:!self-start" />
    </>
  );
}

export const InputOutput: IOStory = {
  name: 'Input / Output 3 Column',
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
      contentInset="0.875rem"
      onClose={() => {}}
      className="h-[480px]"
    >
      <Tabs
        value={activeStepId}
        onValueChange={setActiveStepId}
        className="flex h-full min-h-0 flex-col"
        style={SURFACE_REMAP}
      >
        <div className="shrink-0 pt-3 [padding-inline:0.875rem]">
          <ScrollableTabsList
            className={TAB_LIST_CLASS}
            scrollButtonClassName="size-6 hover:bg-surface-overlay"
          >
            {steps.map((step) => (
              <TabsTrigger key={step.id} value={step.id} className={TAB_TRIGGER_CLASS}>
                {step.title}
              </TabsTrigger>
            ))}
          </ScrollableTabsList>
        </div>
        {steps.map((step) => {
          const flatSchema: FormSchema = {
            id: httpRequestForm.id,
            title: httpRequestForm.title,
            mode: httpRequestForm.mode,
            actions: [],
            sections: step.sections,
          };

          return (
            <TabsContent
              key={step.id}
              value={step.id}
              className="mt-0 min-h-0 flex-1 overflow-y-auto [&_[data-slot=form-description]]:text-xs [&_[data-slot=form-description]]:leading-4 [&_[data-slot=form-description]]:text-foreground-muted [&_[data-slot=form-label]]:text-xs [&_[data-slot=form-label]]:font-medium [&_[data-slot=form-label]]:leading-4 [&_[data-slot=form-label]]:text-foreground"
            >
              <MetadataForm
                schema={flatSchema}
                className="flex flex-col gap-4 pb-6 pt-3 [padding-inline:0.875rem]"
              />
            </TabsContent>
          );
        })}
      </Tabs>
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
            contentInset="0.875rem"
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
    <div className="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-info/40 bg-info/10 px-2.5 py-1.5 text-xs">
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
    <div className="h-full overflow-auto px-(--mf-content-inset,0.875rem) py-2">
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
        <div className="flex h-full flex-col p-6 pt-4">
          {preview && <FilePreviewBanner file={preview} onClose={clearPreview} />}
          <NodeIOView
            className="min-h-0 flex-1"
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
        contentInset="1.5rem"
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
        <div className="flex h-full flex-col p-6 pt-4">
          {preview && <FilePreviewBanner file={preview} onClose={clearPreview} />}
          <NodeIOView
            className="min-h-0 flex-1"
            title={NODE_LABEL}
            titleIcon={<ScanText />}
            titleBadge={NODE_ID}
            titleTrailing={
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
