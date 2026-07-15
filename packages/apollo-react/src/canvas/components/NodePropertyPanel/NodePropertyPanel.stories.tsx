import type { EditorProps } from '@monaco-editor/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FormSchema } from '@uipath/apollo-wind';
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  MetadataForm,
  ScrollableTabsList,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  CircleAlert,
  CircleCheck,
  Code2,
  GitFork,
  Globe,
  GripVertical,
  Play,
  Plus,
  Sparkles,
  Type,
  X,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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

export const InlineEditing: Story = {
  name: 'Inline Editing',
  render: () => <InlineEditingStory />,
};

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
