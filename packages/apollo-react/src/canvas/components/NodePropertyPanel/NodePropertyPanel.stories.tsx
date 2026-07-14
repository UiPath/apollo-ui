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
import type { FormSchema } from '@uipath/apollo-wind';
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  DatePicker,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FileUpload,
  Input,
  Label,
  MetadataForm,
  MultiSelect,
  ScrollableTabsList,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  FileBracesCorner,
  GitFork,
  Globe,
  GripVertical,
  MousePointerClick,
  Pencil,
  Play,
  Plus,
  Search,
  Sparkles,
  Type,
  Upload,
  UserRoundCheck,
  X,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LockableFieldType, LockableValueFieldMode } from './LockableValueField';
import {
  DEMO_SELECT_OPTIONS,
  FIELD_TYPE_META,
  FIELD_TYPE_ORDER,
  LockableValueField,
  parseListValue,
} from './LockableValueField';
import { NodePropertyPanel } from './NodePropertyPanel';

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

function ApproveRejectActions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="xs" className="h-8">
        Reject
      </Button>
      <button
        type="button"
        className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-foreground-on-accent transition hover:bg-brand-hover"
      >
        <CircleCheck size={14} />
        Approve
      </button>
    </div>
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
        contentInset="0.875rem"
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
        contentInset="0.875rem"
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
        contentInset="0.875rem"
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
  const monacoTheme = useMonacoTheme();
  const [label, setLabel] = useState('Script');
  const [category, setCategory] = useState('HTTP Request');
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
// Compact Editor — Switch/Case node with accordion case panels.
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
  const hasError = Boolean(errorMessage);

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
            <span className="text-xs font-medium text-foreground-muted">Condition</span>
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

type CompactTabId = 'parameters' | 'error-handling' | 'advanced';

const ALERT_ISSUES: Array<{
  id: string;
  tab: CompactTabId;
  tabLabel: string;
  field: string;
  message: string;
  action: string;
}> = [
  {
    id: 'condition',
    tab: 'parameters',
    tabLabel: 'Parameters',
    field: 'Case 1 condition',
    message: 'Condition cannot be evaluated because the expression returns text.',
    action: 'Return a boolean expression, for example input.status === "active".',
  },
  {
    id: 'fallback',
    tab: 'error-handling',
    tabLabel: 'Error handling',
    field: 'Fallback path',
    message: 'No fallback path is configured for failed case evaluation.',
    action: 'Choose a fallback branch or enable Default branch.',
  },
  {
    id: 'timeout',
    tab: 'advanced',
    tabLabel: 'Advanced',
    field: 'Timeout',
    message: 'Retry duration exceeds the node timeout.',
    action: 'Increase timeout to 60 seconds or reduce retries to 1.',
  },
];

const ALERT_ISSUE_COUNT_BY_TAB = ALERT_ISSUES.reduce<Record<CompactTabId, number>>(
  (acc, issue) => ({ ...acc, [issue.tab]: acc[issue.tab] + 1 }),
  {
    parameters: 0,
    'error-handling': 0,
    advanced: 0,
  }
);

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

const ALERT_PATTERN_NOTES = [
  {
    title: 'Tab error count',
    description: 'Marks each tab with the number of issues inside that section.',
  },
  {
    title: 'Inline field error',
    description: 'Places the message and next action directly under the invalid code editor.',
  },
  {
    title: 'Section error block',
    description:
      'Explains tab-specific configuration problems when the field is not currently visible.',
  },
];

function AlertPatternNoteCard() {
  return (
    <div className="w-[320px] rounded-xl border border-border-subtle bg-surface-overlay p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <CircleAlert size={15} className="mt-0.5 shrink-0 text-error" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Alert and error types included</h3>
          <p className="mt-1 text-xs leading-4 text-foreground-muted">
            The story combines tab-level cues with local, action-oriented messages.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {ALERT_PATTERN_NOTES.map((note) => (
          <div key={note.title} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-error" />
            <p className="text-xs leading-4 text-foreground-muted">
              <span className="font-medium text-foreground">{note.title}:</span> {note.description}
            </p>
          </div>
        ))}
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
                <span className="text-sm font-medium text-foreground-muted">Cases</span>
              </div>

              {/* Case accordion panels — inset cards with gap */}
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

function AlertsAndErrorsStory() {
  const monacoTheme = useMonacoTheme();
  const [activeTab, setActiveTab] = useState<CompactTabId>('parameters');
  const [cases, setCases] = useState([{ id: 1, title: 'Case 1' }]);
  const nextIdRef = useRef(2);
  const [defaultBranch, setDefaultBranch] = useState(false);
  const [label, setLabel] = useState('Switch');
  const [category, setCategory] = useState('Control');
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);

  const addCase = () => {
    const id = nextIdRef.current++;
    setCases((prev) => [...prev, { id, title: `Case ${id}` }]);
  };
  const deleteCase = (id: number) => setCases((prev) => prev.filter((c) => c.id !== id));
  const updateCaseTitle = (id: number, title: string) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  const conditionIssue = ALERT_ISSUES.find((issue) => issue.id === 'condition');

  return (
    <div className="flex items-start gap-8">
      <div className="flex w-[320px] shrink-0 flex-col gap-4">
        <AlertPatternNoteCard />
      </div>
      <PanelFrame>
        <NodePropertyPanel
          panelTitle="Properties"
          onClose={() => {}}
          contentInset="0.875rem"
          className="h-[760px]"
        >
          <div className="flex h-full flex-col">
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

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as CompactTabId)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="shrink-0 pt-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
                <TabsList className={TAB_LIST_CLASS}>
                  <TabsTrigger value="parameters" className={TAB_TRIGGER_CLASS}>
                    <TabLabelWithError
                      label="Parameters"
                      count={ALERT_ISSUE_COUNT_BY_TAB.parameters}
                    />
                  </TabsTrigger>
                  <TabsTrigger value="error-handling" className={TAB_TRIGGER_CLASS}>
                    <TabLabelWithError
                      label="Error handling"
                      count={ALERT_ISSUE_COUNT_BY_TAB['error-handling']}
                    />
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className={TAB_TRIGGER_CLASS}>
                    <TabLabelWithError label="Advanced" count={ALERT_ISSUE_COUNT_BY_TAB.advanced} />
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="parameters" className="mt-0 min-h-0 flex-1 overflow-auto">
                <div className="py-2 [padding-inline:var(--mf-content-inset,0.875rem)]">
                  <span className="text-sm font-medium text-foreground-muted">Cases</span>
                </div>
                <div className="flex flex-col gap-2 pb-1 [padding-inline:var(--mf-content-inset,0.875rem)]">
                  {cases.map((c, i) => (
                    <CasePanel
                      key={c.id}
                      caseTitle={c.title}
                      onTitleChange={(title) => updateCaseTitle(c.id, title)}
                      onDelete={() => deleteCase(c.id)}
                      monacoTheme={monacoTheme}
                      defaultExpanded={i === 0}
                      defaultValue={i === 0 ? 'input.status' : ''}
                      errorMessage={i === 0 ? conditionIssue?.message : undefined}
                      errorAction={i === 0 ? conditionIssue?.action : undefined}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCase}
                  className="flex items-center gap-1.5 py-3 text-xs text-brand transition hover:text-brand-hover [padding-inline:var(--mf-content-inset,0.875rem)]"
                >
                  <Plus size={12} />
                  Add case
                </button>
                <div className="flex items-center gap-2 py-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
                  <Switch size="sm" checked={defaultBranch} onCheckedChange={setDefaultBranch} />
                  <span className="text-xs text-foreground-muted">Default branch</span>
                </div>
              </TabsContent>

              <TabsContent value="error-handling" className="mt-0 min-h-0 flex-1 overflow-auto">
                <div className="flex flex-col gap-3 py-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground-muted">
                      Failure behavior
                    </span>
                    <ErrorFieldBlock
                      title="Fallback path"
                      message="No fallback path is configured for failed case evaluation."
                      action="Choose a fallback branch or enable Default branch before running this node."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 min-h-0 flex-1 overflow-auto">
                <div className="flex flex-col gap-3 py-3 [padding-inline:var(--mf-content-inset,0.875rem)]">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground-muted">
                      Execution limits
                    </span>
                    <ErrorFieldBlock
                      title="Timeout"
                      message="Retry duration exceeds the node timeout."
                      action="Increase timeout to 60 seconds or reduce retries to 1."
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </NodePropertyPanel>
      </PanelFrame>
    </div>
  );
}

// ============================================================================
// Input Editor
// Inline expression inputs — one per case, no code editor panel.
// ============================================================================

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

function InlineCaseRow({
  caseTitle,
  onTitleChange,
  onDelete,
  monacoTheme,
  defaultValue = '',
}: {
  caseTitle: string;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  monacoTheme: string;
  defaultValue?: string;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<'fixed' | 'expression'>('fixed');
  const [insertOpen, setInsertOpen] = useState(false);
  const insertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!insertOpen) return;
    const handler = (e: MouseEvent) => {
      if (insertRef.current && !insertRef.current.contains(e.target as Node)) {
        setInsertOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [insertOpen]);

  const insertSnippet = (code: string) => {
    setValue((v) => (v ? `${v} ${code}` : code));
    setInsertOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Case title row */}
      <div className="group flex items-center">
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
            className="flex-1 truncate rounded px-1 py-0.5 text-left text-xs font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
          >
            {caseTitle}
          </button>
        )}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete case"
            title="Delete case"
            className="grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle opacity-0 transition hover:bg-surface-overlay hover:text-foreground group-hover:opacity-100"
          >
            <X size={12} />
          </button>
          <button
            type="button"
            aria-label="AI assist"
            title="AI assist"
            className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
          >
            <Sparkles size={12} />
          </button>
          {/* Insert popover */}
          <div ref={insertRef} className="relative">
            <button
              type="button"
              aria-label="Insert snippet"
              title="Insert snippet"
              onClick={() => setInsertOpen((v) => !v)}
              className={cn(
                'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] transition',
                insertOpen
                  ? 'bg-surface-overlay text-foreground'
                  : 'text-foreground-subtle hover:bg-surface-overlay hover:text-foreground'
              )}
            >
              <span className="font-mono text-[10px]">{'{x}'}</span>
              <span>Insert</span>
              <ChevronDown size={9} />
            </button>
            {insertOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[192px] overflow-hidden rounded-xl border border-border-subtle bg-surface-overlay py-1 shadow-lg">
                {INSERT_SNIPPETS.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => insertSnippet(s.code)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left hover:bg-surface-raised"
                  >
                    <span className="text-xs text-foreground">{s.label}</span>
                    <span className="font-mono text-[10px] text-foreground-muted">{s.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monaco editor with mode toggle on the right.
          Outer wrapper is NOT overflow-hidden so the popover can escape. */}
      <div className="relative">
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <div className="relative h-10">
            <MonacoEditor
              height="40px"
              language={mode === 'expression' ? 'javascript' : 'plaintext'}
              value={value}
              onChange={(val) => setValue(val ?? '')}
              theme={monacoTheme}
              beforeMount={registerMonacoThemes}
              options={INLINE_EDITOR_OPTIONS}
            />
            {value === '' && (
              <div className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 font-mono text-[13px] text-foreground-subtle">
                {mode === 'fixed' ? 'Enter a value' : 'Enter an expression'}
              </div>
            )}
          </div>
        </div>
        {/* Mode toggle — DropdownMenu picker */}
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5">
          <div className="h-3.5 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Select expression mode"
                className={cn(
                  'flex h-6 items-center rounded border px-1.5 text-[10px] font-medium transition',
                  mode === 'expression'
                    ? 'border-brand/40 bg-brand/15 text-brand'
                    : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                )}
              >
                {mode === 'fixed' ? 'PT' : 'JS'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1">
              <DropdownMenuItem
                onClick={() => setMode('fixed')}
                className={cn(
                  'flex flex-col items-start gap-0.5 py-2.5 focus:bg-surface-overlay',
                  mode === 'fixed' && 'bg-surface-raised'
                )}
              >
                <div className="flex items-center gap-2">
                  <Type
                    size={13}
                    className={cn(
                      'shrink-0',
                      mode === 'fixed' ? 'text-brand' : 'text-foreground-muted'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      mode === 'fixed' ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    Plain text
                  </span>
                </div>
                <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                  Enter static values like "hello" or 42
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setMode('expression')}
                className={cn(
                  'flex flex-col items-start gap-0.5 py-2.5 focus:bg-surface-overlay',
                  mode === 'expression' && 'bg-surface-raised'
                )}
              >
                <div className="flex items-center gap-2">
                  <Code2
                    size={13}
                    className={cn(
                      'shrink-0',
                      mode === 'expression' ? 'text-brand' : 'text-foreground-muted'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      mode === 'expression' ? 'text-brand' : 'text-foreground'
                    )}
                  >
                    Javascript expression
                  </span>
                </div>
                <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                  Compute the return value dynamically with JS
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function InputEditorStory() {
  const monacoTheme = useMonacoTheme();
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
  const deleteCase = (id: number) => setCases((prev) => prev.filter((c) => c.id !== id));
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
                <span className="text-sm font-medium text-foreground-muted">Output messaging</span>
              </div>
              <div className="flex flex-col gap-3 pb-1 [padding-inline:var(--mf-content-inset,0.875rem)]">
                {cases.map((c) => (
                  <InlineCaseRow
                    key={c.id}
                    caseTitle={c.title}
                    onTitleChange={(title) => updateCaseTitle(c.id, title)}
                    onDelete={() => deleteCase(c.id)}
                    monacoTheme={monacoTheme}
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
// Concept 2 — Expression Reference Panel
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
  const currentTreeData = isOutput ? OUTPUT_TREE_DATA : INPUT_TREE_DATA;
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

  const copyExpr = (path: string) => {
    navigator.clipboard
      ?.writeText(`{{${path}}}`)
      ?.then(() => {
        setCopiedPath(path);
        setTimeout(() => setCopiedPath(null), 1500);
      })
      ?.catch(() => {});
  };

  return (
    <PanelFrame>
      <NodePropertyPanel
        panelTitle={isOutput ? 'Output' : 'Input'}
        contentInset="0.875rem"
        onClose={() => {}}
        className="h-[640px]"
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Node identity bar — hidden in Studio context */}
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
            {/* Tab strip — status badge moves here in Studio context */}
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
                                'max-w-[55%] shrink-0 truncate font-mono text-xs',
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
                            <Button
                              variant="ghost"
                              size="4xs"
                              icon
                              onClick={() => copyExpr(node.path)}
                              title={`Copy {{${node.path}}}`}
                              aria-label={`Copy expression for ${node.path}`}
                              className="shrink-0 rounded text-foreground-subtle opacity-0 hover:bg-surface-raised hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                            >
                              {copiedPath === node.path ? (
                                <CircleCheck size={11} className="text-brand" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </Button>
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
    </div>
  );
}

// ============================================================================
// Prototype — LockableValueField
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

const REVIEW_LOCKABLE_CASES: LockableCase[] = [
  {
    id: 1,
    title: 'Invoice Number',
    required: true,
    value: 'INV-2024-0587',
    locked: true,
    mode: 'fixed',
    fieldType: 'string',
  },
  {
    id: 2,
    title: 'Submission Date',
    required: true,
    value: new Date('2026-07-10').toISOString(),
    locked: true,
    mode: 'fixed',
    fieldType: 'date',
  },
  {
    id: 3,
    title: 'Approved Amount',
    required: true,
    value: '1240',
    locked: false,
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
  controlsVisibility,
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
  controlsVisibility?: 'visible' | 'hover';
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
                  className="truncate rounded px-1 py-0.5 text-left text-xs font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
                >
                  {caseTitle}
                  {required && <span className="ml-0.5 text-destructive">*</span>}
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
              className="grid size-6 shrink-0 place-items-center rounded text-foreground-subtle opacity-0 transition hover:bg-surface-overlay hover:text-foreground group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          }
          value={value}
          onValueChange={onValueChange}
          locked={locked}
          onLockedChange={onLockedChange}
          mode={mode}
          onModeChange={onModeChange}
          fieldType={fieldType}
          onFieldTypeChange={onFieldTypeChange}
          required={required}
          onRequiredChange={onRequiredChange}
          compact={compact}
          controlsVisibility={controlsVisibility}
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
  onDelete,
}: {
  label: string;
  onLabelChange: (label: string) => void;
  variant: 'default' | 'outline';
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="group/button relative">
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
          className={cn(
            'h-8 rounded-lg px-3 text-sm font-semibold outline-none ring-1 ring-brand',
            variant === 'default'
              ? 'bg-brand text-foreground-on-accent'
              : 'border border-border-subtle bg-transparent text-foreground'
          )}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setTimeout(() => inputRef.current?.select(), 0);
          }}
          className={cn(
            'flex h-8 items-center rounded-lg px-4 text-sm font-semibold transition',
            variant === 'default'
              ? 'bg-brand text-foreground-on-accent hover:bg-brand-hover'
              : 'border border-border-subtle text-foreground hover:bg-surface-overlay'
          )}
        >
          {label}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete button"
        title="Delete button"
        className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-surface-overlay text-foreground-subtle opacity-0 shadow transition hover:text-foreground group-hover/button:opacity-100"
      >
        <X size={10} />
      </button>
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
        {caseItem.required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
    </div>
  );
}

function LockableValueFieldShowcase({
  controlsVisibility,
  onControlsVisibilityChange,
}: {
  controlsVisibility: 'visible' | 'hover';
  onControlsVisibilityChange: (visibility: 'visible' | 'hover') => void;
}) {
  const [showcaseValue, setShowcaseValue] = useState('');
  const [showcaseLocked, setShowcaseLocked] = useState(true);
  const [showcaseMode, setShowcaseMode] = useState<LockableValueFieldMode>('fixed');
  const [showcaseFieldType, setShowcaseFieldType] = useState<LockableFieldType>('string');
  const [showcaseRequired, setShowcaseRequired] = useState(true);
  const [showcaseDetailsExpanded, setShowcaseDetailsExpanded] = useState(false);

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
        <span className="text-sm font-semibold text-foreground">LockableValueField</span>
        <button
          type="button"
          onClick={() => setShowcaseDetailsExpanded((v) => !v)}
          aria-expanded={showcaseDetailsExpanded}
          className="group/details flex items-start gap-1 text-left text-xs leading-4 text-foreground-muted transition hover:text-foreground"
        >
          <span className="flex-1">
            A reusable string field that can be locked to read-only and switched between a literal
            value and a JS expression.
          </span>
          <ChevronDown
            size={14}
            className={cn(
              'mt-0.5 shrink-0 text-foreground-subtle transition-transform group-hover/details:text-foreground',
              showcaseDetailsExpanded && 'rotate-180'
            )}
          />
        </button>
        {showcaseDetailsExpanded && (
          <ul className="flex list-disc flex-col gap-1.5 pl-4 pt-1 text-xs leading-4 text-foreground-muted">
            <li>
              Left lock icon toggles Unlocked / Locked. Locked fields are read-only, not disabled.
            </li>
            <li>
              Right value-mode icon switches between Fixed value and Expression, updating the value
              styling. Only shown for types an expression can produce.
            </li>
            <li>
              Field type dropdown swaps the control itself: String, Integer, Date, Boolean, Single
              select, Multiselect, and File each render their own matching input.
            </li>
            <li>
              Required switch toggles the red asterisk on the label. Only shown when
              onRequiredChange is provided. Collapses to an icon that opens a popover in compact
              view.
            </li>
            <li>Built-in AI-assist popover to describe and generate a value.</li>
            <li>Insert-variable affordance for binding to upstream data.</li>
            <li>Built entirely on apollo-wind&apos;s InputGroup primitive.</li>
            <li>
              Header row is responsive (container query): the type, required, AI-assist, and
              insert-variable controls collapse to icon-only once the field gets too narrow for
              their labels.
            </li>
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border-subtle pt-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Controls
        </span>
        <ToggleGroup
          type="single"
          size="xs"
          value={controlsVisibility}
          onValueChange={(v) => v && onControlsVisibilityChange(v as 'visible' | 'hover')}
        >
          <ToggleGroupItem value="visible" className="!px-2.5 !text-xs">
            Show
          </ToggleGroupItem>
          <ToggleGroupItem value="hover" className="!px-2.5 !text-xs">
            Hide
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Full view
        </span>
        <LockableValueField
          label={
            <Label className="text-xs font-medium text-foreground-muted">
              Label
              {showcaseRequired && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
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
          controlsVisibility={controlsVisibility}
        />
      </div>
      <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Compact view (narrow container)
        </span>
        <div className="w-[200px]">
          <LockableValueField
            label={
              <Label className="text-xs font-medium text-foreground-muted">
                Label
                {showcaseRequired && <span className="ml-0.5 text-destructive">*</span>}
              </Label>
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
            controlsVisibility={controlsVisibility}
          />
        </div>
      </div>
    </div>
  );
}

function QuickFormStory() {
  const [cases, setCases] = useState<LockableCase[]>(DEFAULT_LOCKABLE_CASES);
  const nextIdRef = useRef(4);
  const [formView, setFormView] = useState<'edit' | 'preview' | 'json'>('edit');
  const [formTitle, setFormTitle] = useState('Quick Approve');
  const [formDescription, setFormDescription] = useState('Add a description');
  const [editingFormTitle, setEditingFormTitle] = useState(false);
  const [editingFormDescription, setEditingFormDescription] = useState(false);
  const formTitleRef = useRef<HTMLInputElement>(null);
  const formDescriptionRef = useRef<HTMLInputElement>(null);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(DEFAULT_LOCKABLE_CASES, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showcaseControlsVisibility, setShowcaseControlsVisibility] = useState<'visible' | 'hover'>(
    'hover'
  );
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
      setCases(parsed);
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON.');
    }
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
    setButtons((prev) => [...prev, { id, label: 'New button', variant: 'outline' }]);
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

  return (
    <div className="flex items-start gap-8">
      <PanelFrame>
        <NodePropertyPanel
          panelTitle="Properties"
          nodeIcon={<UserRoundCheck />}
          nodeLabel="Quick Approve"
          nodeCategory="Quick approve/reject decision for the extracted invoice."
          action={<DebugButton />}
          onClose={() => {}}
          contentInset="0.875rem"
          className="h-[760px]"
        >
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
            <TabsContent
              value="parameters"
              className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-auto py-3 [padding-inline:var(--mf-content-inset,0.875rem)]"
            >
              {/* Quick form */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-muted">Quick form</span>
                  <TooltipProvider delayDuration={300}>
                    <ToggleGroup
                      type="single"
                      size="xs"
                      spacing={2}
                      value={formView}
                      onValueChange={(v) => v && setFormView(v as 'edit' | 'preview' | 'json')}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value="edit"
                            aria-label="Edit"
                            className="!size-7 !rounded-lg !border-none !px-0 text-foreground-subtle transition hover:!bg-surface-overlay hover:!text-foreground data-[state=on]:!bg-surface-overlay data-[state=on]:!text-brand"
                          >
                            <Pencil size={12} />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value="preview"
                            aria-label="Preview"
                            className="!size-7 !rounded-lg !border-none !px-0 text-foreground-subtle transition hover:!bg-surface-overlay hover:!text-foreground data-[state=on]:!bg-surface-overlay data-[state=on]:!text-brand"
                          >
                            <Eye size={12} />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Preview</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value="json"
                            aria-label="JSON"
                            className="!size-7 !rounded-lg !border-none !px-0 text-foreground-subtle transition hover:!bg-surface-overlay hover:!text-foreground data-[state=on]:!bg-surface-overlay data-[state=on]:!text-brand"
                          >
                            <Code2 size={12} />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>JSON</TooltipContent>
                      </Tooltip>
                    </ToggleGroup>
                  </TooltipProvider>
                </div>
                <Card>
                  <CardContent className="flex flex-col gap-4 p-4">
                    <div className="flex items-center gap-3.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={() => {}}
                      />
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              aria-label="Upload a file"
                              className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle transition hover:bg-surface-overlay/70 hover:text-foreground [&>svg]:size-5"
                            >
                              <Upload />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Upload a reference file for this form</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        {editingFormTitle ? (
                          <input
                            ref={formTitleRef}
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            onBlur={() => setEditingFormTitle(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape')
                                setEditingFormTitle(false);
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
                                  activeDragId != null &&
                                  overDragId === c.id &&
                                  c.id !== activeDragId;
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
                                    controlsVisibility={showcaseControlsVisibility}
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
                        {buttons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {buttons.map((b) => (
                              <FormButtonChip
                                key={b.id}
                                label={b.label}
                                onLabelChange={(label) => updateButton(b.id, { label })}
                                variant={b.variant}
                                onDelete={() => deleteButton(b.id)}
                              />
                            ))}
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-brand transition hover:text-brand-hover"
                            >
                              <Plus size={12} />
                              Add field
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44">
                            {FIELD_TYPE_ORDER.map((type) => {
                              const meta = FIELD_TYPE_META[type];
                              return (
                                <DropdownMenuItem key={type} onClick={() => addCaseWithType(type)}>
                                  <meta.icon className="text-foreground-muted" />
                                  <span>{meta.label}</span>
                                </DropdownMenuItem>
                              );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={addButton}>
                              <MousePointerClick className="text-foreground-muted" />
                              <span>Button</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    {formView === 'preview' && (
                      <div className="flex flex-col gap-4">
                        {cases.map((c) => {
                          const isExpression =
                            FIELD_TYPE_META[c.fieldType].supportsExpression &&
                            c.mode === 'expression';
                          return (
                            <div key={c.id} className="flex flex-col gap-1.5">
                              <Label
                                htmlFor={`preview-${c.id}`}
                                className="text-xs font-medium text-foreground-muted"
                              >
                                {c.title}
                                {c.required && <span className="ml-0.5 text-destructive">*</span>}
                              </Label>
                              {isExpression ? (
                                <Input
                                  id={`preview-${c.id}`}
                                  readOnly={c.locked}
                                  value={c.value}
                                  onChange={(e) => updateCase(c.id, { value: e.target.value })}
                                  placeholder="Enter an expression"
                                  className="font-mono"
                                />
                              ) : c.fieldType === 'boolean' ? (
                                <Switch
                                  id={`preview-${c.id}`}
                                  checked={c.value === 'true'}
                                  onCheckedChange={(checked) =>
                                    updateCase(c.id, { value: String(checked) })
                                  }
                                  disabled={c.locked}
                                />
                              ) : c.fieldType === 'date' ? (
                                <DatePicker
                                  disabled={c.locked}
                                  value={c.value ? new Date(c.value) : undefined}
                                  onValueChange={(date) =>
                                    updateCase(c.id, { value: date ? date.toISOString() : '' })
                                  }
                                />
                              ) : c.fieldType === 'single-select' ? (
                                <Select
                                  value={c.value || undefined}
                                  onValueChange={(value) => updateCase(c.id, { value })}
                                  disabled={c.locked}
                                >
                                  <SelectTrigger id={`preview-${c.id}`}>
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DEMO_SELECT_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : c.fieldType === 'multi-select' ? (
                                <MultiSelect
                                  options={DEMO_SELECT_OPTIONS}
                                  selected={parseListValue(c.value)}
                                  onChange={(selected) =>
                                    updateCase(c.id, { value: JSON.stringify(selected) })
                                  }
                                  placeholder="Select options..."
                                  disabled={c.locked}
                                />
                              ) : c.fieldType === 'file' ? (
                                <FileUpload
                                  disabled={c.locked}
                                  onFilesChange={(files) =>
                                    updateCase(c.id, { value: files.map((f) => f.name).join(', ') })
                                  }
                                />
                              ) : (
                                <Input
                                  id={`preview-${c.id}`}
                                  type={c.fieldType === 'integer' ? 'number' : 'text'}
                                  readOnly={c.locked}
                                  value={c.value}
                                  onChange={(e) => updateCase(c.id, { value: e.target.value })}
                                  placeholder="Enter a value"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {formView === 'json' && (
                      <div className="flex flex-col gap-1.5">
                        <Textarea
                          value={jsonDraft}
                          onChange={(e) => handleJsonChange(e.target.value)}
                          rows={14}
                          spellCheck={false}
                          className="resize-none font-mono text-xs"
                        />
                        {jsonError && <span className="text-xs text-destructive">{jsonError}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="error-handling" className="mt-0" />
            <TabsContent value="advanced" className="mt-0" />
          </Tabs>
        </NodePropertyPanel>
      </PanelFrame>

      <LockableValueFieldShowcase
        controlsVisibility={showcaseControlsVisibility}
        onControlsVisibilityChange={setShowcaseControlsVisibility}
      />
    </div>
  );
}

export const InlineEditing: Story = {
  name: 'Inline Editing',
  render: () => <InlineEditingStory />,
};

export const Output: Story = {
  name: 'Input / Output',
  render: () => <InputOutputStory />,
  parameters: { layout: 'fullscreen' },
};

export const QuickForm: Story = {
  name: 'Form HITL',
  render: () => <QuickFormStory />,
};

function FormHitlReviewStory() {
  const [cases, setCases] = useState<LockableCase[]>(REVIEW_LOCKABLE_CASES);
  const [controlsVisibility, setControlsVisibility] = useState<'visible' | 'hover'>('hover');

  const updateCase = (id: number, patch: Partial<LockableCase>) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className="flex items-start gap-8">
      <PanelFrame>
        <NodePropertyPanel
          panelTitle="Properties"
          nodeIcon={<UserRoundCheck />}
          nodeLabel="Quick Approve"
          nodeCategory="Review the extracted invoice details, then approve or reject."
          action={<ApproveRejectActions />}
          onClose={() => {}}
          contentInset="0.875rem"
          className="h-[760px]"
        >
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
            <TabsContent
              value="parameters"
              className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-auto py-3 [padding-inline:var(--mf-content-inset,0.875rem)]"
            >
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-foreground-muted">Quick form</span>
                <Card>
                  <CardContent className="flex flex-col gap-4 p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-overlay text-foreground-subtle [&>svg]:size-5">
                        <Upload />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <span className="truncate text-base font-semibold leading-5 tracking-[-0.3px] text-foreground">
                          Quick Approve
                        </span>
                        <span className="truncate text-xs leading-4 text-foreground-muted">
                          Extracted from invoice.pdf &middot; 92% confidence
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {cases.map((c) => (
                        <LockableValueField
                          key={c.id}
                          id={`review-${c.id}`}
                          label={
                            <Label
                              htmlFor={`review-${c.id}`}
                              className="text-xs font-medium text-foreground-muted"
                            >
                              {c.title}
                              {c.required && <span className="ml-0.5 text-destructive">*</span>}
                            </Label>
                          }
                          value={c.value}
                          onValueChange={(value) => updateCase(c.id, { value })}
                          locked={c.locked}
                          onLockedChange={(locked) => updateCase(c.id, { locked })}
                          mode={c.mode}
                          onModeChange={(mode) => updateCase(c.id, { mode })}
                          fieldType={c.fieldType}
                          required={c.required}
                          onRequiredChange={(required) => updateCase(c.id, { required })}
                          controlsVisibility={controlsVisibility}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="error-handling" className="mt-0" />
            <TabsContent value="advanced" className="mt-0" />
          </Tabs>
        </NodePropertyPanel>
      </PanelFrame>

      <LockableValueFieldShowcase
        controlsVisibility={controlsVisibility}
        onControlsVisibilityChange={setControlsVisibility}
      />
    </div>
  );
}

export const FormHitlReview: Story = {
  name: 'Form HITL Review',
  render: () => <FormHitlReviewStory />,
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
    <PanelFrame>
      <NodePropertyPanel panelTitle="Properties" onClose={() => {}} contentInset="0.875rem">
        {/* Node identity row — inline editable */}
        <div className="flex shrink-0 items-center gap-3 py-4 [padding-inline:var(--mf-content-inset,0.875rem)]">
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
      </NodePropertyPanel>
    </PanelFrame>
  );
}

export const AlertsAndErrors: Story = {
  name: 'Alerts and Errors',
  render: () => <AlertsAndErrorsStory />,
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
              className="mt-0 min-h-0 flex-1 overflow-y-auto [&_label]:text-foreground-muted"
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

export const Responsive: Story = {
  name: 'Responsive',
  render: () => (
    <div className="flex items-start gap-[80px]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground">Fixed Size</span>
          <span className="text-xs text-foreground-muted">Example Spacious</span>
        </div>
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
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground">Fixed Size</span>
          <span className="text-xs text-foreground-muted">Example Compact</span>
        </div>
        <PanelFrame width="w-[280px]">
          <CompactResponsivePanelStory />
        </PanelFrame>
      </div>
    </div>
  ),
};
