import MonacoEditor from '@monaco-editor/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FormSchema } from '@uipath/apollo-wind';
import { cn, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@uipath/apollo-wind';
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
  CircleCheck,
  Code2,
  GitFork,
  Globe,
  GripVertical,
  Play,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
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
  lineDecorationsWidth: 0,
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
}: {
  caseTitle: string;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  monacoTheme: string;
  defaultExpanded?: boolean;
  defaultValue?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingTitle, setEditingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      {/* Card header */}
      <div className="group flex items-center gap-2 px-3 py-2.5">
        <div className="grid size-5 shrink-0 cursor-grab place-items-center text-foreground-subtle">
          <GripVertical size={12} />
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse case' : 'Expand case'}
          className="grid size-5 shrink-0 place-items-center rounded text-foreground-subtle transition hover:text-foreground"
        >
          <ChevronDown
            size={12}
            className={cn('transition-transform duration-150', !expanded && '-rotate-90')}
          />
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
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete case"
          title="Delete case"
          className="grid size-5 shrink-0 place-items-center rounded text-foreground-subtle opacity-0 transition hover:text-foreground group-hover:opacity-100"
        >
          <X size={12} />
        </button>
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
              className="overflow-hidden rounded-xl border border-border-subtle"
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
          </div>
        </>
      )}
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
                className="flex items-center gap-1.5 py-3 text-xs text-brand transition hover:text-brand-hover [padding-inline:var(--mf-content-inset,0.875rem)]"
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
  const [modePopoverOpen, setModePopoverOpen] = useState(false);
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
              <div className="pointer-events-none absolute left-[6px] top-1/2 -translate-y-1/2 font-mono text-[13px] text-foreground-subtle">
                {mode === 'fixed' ? 'Enter a value' : 'Enter an expression'}
              </div>
            )}
          </div>
        </div>
        {/* Mode toggle — click to switch, hover to pick from popover */}
        <div
          className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5"
          onMouseEnter={() => setModePopoverOpen(true)}
          onMouseLeave={() => setModePopoverOpen(false)}
        >
          <div className="h-3.5 w-px bg-border-subtle" />
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'fixed' ? 'expression' : 'fixed'))}
            aria-label={
              mode === 'fixed' ? 'Switch to Javascript expression' : 'Switch to Plain text'
            }
            className={cn(
              'flex h-5 items-center rounded border px-1.5 text-[10px] font-medium transition',
              mode === 'expression'
                ? 'border-brand/30 bg-brand/10 text-brand'
                : 'border-border-subtle bg-surface-overlay text-foreground-muted hover:border-border hover:text-foreground'
            )}
          >
            {mode === 'fixed' ? 'PT' : 'JS'}
          </button>
          {modePopoverOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-surface-overlay shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('fixed');
                  setModePopoverOpen(false);
                }}
                className={cn(
                  'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-surface-raised',
                  mode === 'fixed' && 'bg-surface-raised'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      mode === 'fixed' ? 'bg-brand' : 'bg-border'
                    )}
                  />
                  <span className="text-xs font-medium text-foreground">Plain text</span>
                </div>
                <span className="pl-3 text-[11px] leading-4 text-foreground-subtle">
                  Enter static values like "hello" or 42
                </span>
              </button>
              <div className="mx-3 h-px bg-border-subtle" />
              <button
                type="button"
                onClick={() => {
                  setMode('expression');
                  setModePopoverOpen(false);
                }}
                className={cn(
                  'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-surface-raised',
                  mode === 'expression' && 'bg-surface-raised'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      mode === 'expression' ? 'bg-brand' : 'bg-border'
                    )}
                  />
                  <span className="text-xs font-medium text-foreground">Javascript expression</span>
                </div>
                <span className="pl-3 text-[11px] leading-4 text-foreground-subtle">
                  Compute the return value dynamically with JS
                </span>
              </button>
            </div>
          )}
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
                className="flex items-center gap-1.5 py-3 text-xs text-brand transition hover:text-brand-hover [padding-inline:var(--mf-content-inset,0.875rem)]"
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
