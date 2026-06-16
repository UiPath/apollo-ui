import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { drawSelection, EditorView, highlightActiveLine, lineNumbers } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import MonacoEditor from '@monaco-editor/react';
import type { Meta } from '@storybook/react-vite';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { ApolloCodeMirrorTheme } from '../../editor-themes';
import {
  apolloCoreDarkCodeMirror,
  apolloCoreDarkHCCodeMirror,
  apolloCoreDarkHCMonaco,
  apolloCoreDarkMonaco,
  apolloCoreLightCodeMirror,
  apolloCoreLightHCCodeMirror,
  apolloCoreLightHCMonaco,
  apolloCoreLightMonaco,
  apolloFutureDarkCodeMirror,
  apolloFutureDarkMonaco,
  apolloFutureLightCodeMirror,
  apolloFutureLightMonaco,
} from '../../editor-themes';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Patterns/Code Editors',
  tags: ['!autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

// ============================================================================
// Theme registry — all Apollo editor themes in one place
// ============================================================================

const editorThemeConfigs = [
  {
    key: 'future-dark',
    label: 'Future Dark',
    monacoThemeName: 'apollo-future-dark',
    monacoExport: 'apolloFutureDarkMonaco',
    cmExport: 'apolloFutureDarkCodeMirror',
    monacoThemeObj: apolloFutureDarkMonaco,
    cmTokens: apolloFutureDarkCodeMirror,
    isDark: true,
    borderColor: '#3f3f46',
    family: 'Future',
  },
  {
    key: 'future-light',
    label: 'Future Light',
    monacoThemeName: 'apollo-future-light',
    monacoExport: 'apolloFutureLightMonaco',
    cmExport: 'apolloFutureLightCodeMirror',
    monacoThemeObj: apolloFutureLightMonaco,
    cmTokens: apolloFutureLightCodeMirror,
    isDark: false,
    borderColor: '#d4d4d8',
    family: 'Future',
  },
  {
    key: 'dark',
    label: 'Dark',
    monacoThemeName: 'apollo-core-dark',
    monacoExport: 'apolloCoreDarkMonaco',
    cmExport: 'apolloCoreDarkCodeMirror',
    monacoThemeObj: apolloCoreDarkMonaco,
    cmTokens: apolloCoreDarkCodeMirror,
    isDark: true,
    borderColor: '#8a97a0',
    family: 'Core',
  },
  {
    key: 'light',
    label: 'Light',
    monacoThemeName: 'apollo-core-light',
    monacoExport: 'apolloCoreLightMonaco',
    cmExport: 'apolloCoreLightCodeMirror',
    monacoThemeObj: apolloCoreLightMonaco,
    cmTokens: apolloCoreLightCodeMirror,
    isDark: false,
    borderColor: '#a4b1b8',
    family: 'Core',
  },
  {
    key: 'dark-hc',
    label: 'Dark High Contrast',
    monacoThemeName: 'apollo-core-dark-hc',
    monacoExport: 'apolloCoreDarkHCMonaco',
    cmExport: 'apolloCoreDarkHCCodeMirror',
    monacoThemeObj: apolloCoreDarkHCMonaco,
    cmTokens: apolloCoreDarkHCCodeMirror,
    isDark: true,
    borderColor: '#bbc7cd',
    family: 'Core HC',
  },
  {
    key: 'light-hc',
    label: 'Light High Contrast',
    monacoThemeName: 'apollo-core-light-hc',
    monacoExport: 'apolloCoreLightHCMonaco',
    cmExport: 'apolloCoreLightHCCodeMirror',
    monacoThemeObj: apolloCoreLightHCMonaco,
    cmTokens: apolloCoreLightHCCodeMirror,
    isDark: false,
    borderColor: '#6b7882',
    family: 'Core HC',
  },
] as const;

type ThemeConfig = (typeof editorThemeConfigs)[number];

// ============================================================================
// Sample code snippets
// ============================================================================

const monacoFullSample = `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SortDirection = 'asc' | 'desc';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  pageSize = 10,
}: TableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [query, sortKey, sortDir]);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => String(row[col.key]).toLowerCase().includes(q))
    );
  }, [data, columns, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const cmp = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-4">
      <input
        className="rounded-lg border border-border px-3 py-2 text-sm"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-2 text-left">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </div>
  );
}`.trim();

const monacoSample = `interface WorkflowNode {
  id: string;
  type: 'action' | 'condition' | 'trigger';
  executionStatus: 'NotExecuted' | 'InProgress' | 'Completed' | 'Failed';
}

function getNextNodes(node: WorkflowNode): string[] {
  if (node.executionStatus === 'Completed') {
    return node.type === 'condition'
      ? ['true-branch', 'false-branch']
      : ['next'];
  }
  return [];
}`.trim();

const codemirrorSample = `workflow.status === "active" && user.role !== "viewer"
  ? user.displayName + " — " + workflow.name
  : "Access restricted"`.trim();

// ============================================================================
// Shared helpers
// ============================================================================

let monacoThemesRegistered = false;

// biome-ignore lint/suspicious/noExplicitAny: Monaco types not available at story level
function registerAllMonacoThemes(monaco: any) {
  if (monacoThemesRegistered) return;
  for (const cfg of editorThemeConfigs) {
    monaco.editor.defineTheme(cfg.monacoThemeName, cfg.monacoThemeObj);
  }
  monacoThemesRegistered = true;
}

function buildCMExtensions(tokens: ApolloCodeMirrorTheme, isDark: boolean, compact = false) {
  const { syntax, ui } = tokens;
  const theme = EditorView.theme(
    {
      '&': {
        backgroundColor: ui.background,
        color: ui.foreground,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '13px',
        lineHeight: '1.6',
      },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: ui.cursor },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: ui.selection,
      },
      '.cm-activeLine': { backgroundColor: ui.lineHighlight },
      '.cm-gutters': { backgroundColor: ui.background, color: ui.lineNumber, border: 'none' },
      '.cm-gutter.cm-lineNumbers .cm-gutterElement': {
        color: ui.lineNumber,
        paddingLeft: '12px',
        paddingRight: '8px',
      },
      '.cm-activeLineGutter': { color: ui.lineNumberActive, backgroundColor: 'transparent' },
      '.cm-matchingBracket': { outline: `1px solid ${ui.matchingBracket}`, borderRadius: '2px' },
      '.cm-content': { padding: '12px 0', caretColor: ui.cursor },
      '.cm-line': { padding: '0 16px' },
      '.cm-scroller': { overflow: 'auto' },
    },
    { dark: isDark }
  );

  const highlight = HighlightStyle.define([
    { tag: t.comment, color: syntax.comment, fontStyle: 'italic' },
    { tag: t.punctuation, color: syntax.punctuation },
    { tag: [t.keyword, t.operatorKeyword], color: syntax.keyword },
    { tag: t.operator, color: syntax.operator },
    { tag: [t.string, t.regexp, t.special(t.string)], color: syntax.string },
    { tag: [t.number, t.integer, t.float], color: syntax.number },
    { tag: [t.bool, t.null], color: syntax.literal },
    { tag: [t.className, t.typeName, t.definition(t.typeName)], color: syntax.literal },
    { tag: [t.propertyName, t.attributeName], color: syntax.keyword },
    { tag: t.function(t.variableName), color: syntax.keyword },
    { tag: t.meta, color: syntax.meta },
    { tag: t.variableName, color: syntax.rest },
  ]);

  return [
    theme,
    syntaxHighlighting(highlight),
    javascript({ typescript: true }),
    ...(compact ? [] : [lineNumbers(), highlightActiveLine()]),
    drawSelection(),
  ];
}

// ============================================================================
// Live editor components
// ============================================================================

function LiveMonacoEditor({
  themeConfig,
  height = '220px',
  value,
  options = {},
}: {
  themeConfig: ThemeConfig;
  height?: string;
  value?: string;
  options?: Record<string, unknown>;
}) {
  return (
    <MonacoEditor
      height={height}
      defaultLanguage="typescript"
      defaultValue={value ?? monacoSample}
      theme={themeConfig.monacoThemeName}
      beforeMount={registerAllMonacoThemes}
      options={{
        fontSize: 13,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        padding: { top: 16, bottom: 16 },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        renderLineHighlight: 'line',
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollbar: { vertical: 'auto', horizontal: 'hidden', alwaysConsumeMouseWheel: false },
        automaticLayout: true,
        ...options,
      }}
    />
  );
}

function LiveCodeMirrorEditor({
  themeConfig,
  value,
  compact = false,
}: {
  themeConfig: ThemeConfig;
  value?: string;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cmTokens, isDark, borderColor } = themeConfig;
  const doc = value ?? codemirrorSample;

  useEffect(() => {
    if (!containerRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: buildCMExtensions(cmTokens, isDark, compact),
      }),
      parent: containerRef.current,
    });
    return () => view.destroy();
  }, [cmTokens, isDark, doc, compact]);

  return (
    <div ref={containerRef} className="overflow-hidden rounded-lg border" style={{ borderColor }} />
  );
}

// ============================================================================
// Static Monaco preview — lightweight color swatch for the Themes page.
// Avoids mounting 6 simultaneous Monaco instances which causes white screens.
// ============================================================================

function StaticMonacoPreview({ themeConfig }: { themeConfig: ThemeConfig }) {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic key access on const theme object
  const colors = themeConfig.monacoThemeObj.colors as any;
  const rules = themeConfig.monacoThemeObj.rules as ReadonlyArray<{
    token: string;
    foreground?: string;
  }>;

  const c = (token: string): string => {
    const rule = rules.find((r) => r.token === token);
    return rule?.foreground ? `#${rule.foreground}` : (colors['editor.foreground'] as string);
  };

  const bg: string = colors['editor.background'];
  const fg: string = colors['editor.foreground'];
  const ln: string = colors['editorLineNumber.foreground'];
  const kw = c('keyword');
  const str = c('string');
  const num = c('number');
  const type = c('type');
  const op = c('operator');
  const delim = c('delimiter');

  const K = ({ v }: { v: string }) => <span style={{ color: kw }}>{v}</span>;
  const S = ({ v }: { v: string }) => <span style={{ color: str }}>{v}</span>;
  const N = ({ v }: { v: string }) => <span style={{ color: num }}>{v}</span>;
  const T = ({ v }: { v: string }) => <span style={{ color: type }}>{v}</span>;
  const Op = ({ v }: { v: string }) => <span style={{ color: op }}>{v}</span>;
  const D = ({ v }: { v: string }) => <span style={{ color: delim }}>{v}</span>;

  const Line = ({ n, children }: { n: number; children: ReactNode }) => (
    <div className="flex">
      <span className="mr-4 w-5 shrink-0 select-none text-right" style={{ color: ln }}>
        {n}
      </span>
      <span style={{ color: fg }}>{children}</span>
    </div>
  );

  return (
    <div
      className="overflow-hidden rounded-lg border p-3 font-mono text-xs leading-[18px]"
      style={{ background: bg, borderColor: themeConfig.borderColor }}
    >
      <Line n={1}>
        <K v="const" /> status <Op v="=" /> workflow
        <D v="." />
        executionStatus
        <D v=";" />
      </Line>
      <Line n={2}>
        <K v="const" /> isActive <Op v="=" /> status <Op v="===" /> <S v='"Running"' />
        <D v=";" />
      </Line>
      <Line n={3}>
        <K v="const" /> user
        <D v=":" /> <T v="User" /> <Op v="=" /> <D v="{" /> id
        <D v=":" /> <N v="1" />
        <D v="," /> name
        <D v=":" /> <S v='"Alice"' /> <D v="}" />
        <D v=";" />
      </Line>
      <Line n={4}>
        <K v="return" /> isActive <Op v="&&" /> user
        <D v="." />
        role <Op v="!==" /> <S v='"viewer"' />
        <D v=";" />
      </Line>
    </div>
  );
}

// ============================================================================
// Theme token reference panel — collapsible swatch grid per theme card
// ============================================================================

const syntaxSwatchKeys: Array<{
  key: keyof typeof import('../../editor-themes').apolloFutureDarkCodeMirror.syntax;
  label: string;
}> = [
  { key: 'keyword', label: 'Keyword' },
  { key: 'string', label: 'String' },
  { key: 'number', label: 'Number' },
  { key: 'literal', label: 'Literal' },
  { key: 'operator', label: 'Operator' },
  { key: 'punctuation', label: 'Punctuation' },
  { key: 'comment', label: 'Comment' },
  { key: 'rest', label: 'Default text' },
];

const uiSwatchKeys: Array<{
  key: keyof typeof import('../../editor-themes').apolloFutureDarkCodeMirror.ui;
  label: string;
}> = [
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'lineNumber', label: 'Line number' },
  { key: 'lineNumberActive', label: 'Line number active' },
  { key: 'selection', label: 'Selection' },
];

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-4 w-4 shrink-0 rounded border border-white/10"
        style={{ background: color }}
      />
      <span className="min-w-0 truncate text-[11px] text-muted-foreground">{label}</span>
      <code className="ml-auto shrink-0 text-[11px] text-foreground/60">{color}</code>
    </div>
  );
}

function ThemeTokenPanel({ themeConfig }: { themeConfig: ThemeConfig }) {
  const { cmTokens, monacoThemeName, monacoExport, cmExport } = themeConfig;

  return (
    <details className="group border-t border-border">
      <summary className="flex cursor-pointer select-none items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <svg
          className="h-3 w-3 transition-transform group-open:rotate-90"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M4 2.5l4 3.5-4 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Token reference
      </summary>

      <div className="px-4 pb-4 pt-2">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Syntax
        </p>
        <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
          {syntaxSwatchKeys.map(({ key: k, label }) => (
            <Swatch key={k} color={cmTokens.syntax[k]} label={label} />
          ))}
        </div>

        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Editor UI
        </p>
        <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
          {uiSwatchKeys.map(({ key: k, label }) => (
            <Swatch key={k} color={cmTokens.ui[k]} label={label} />
          ))}
        </div>

        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Import
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-[11px] leading-relaxed text-foreground">
          <code>{`import * as monaco from 'monaco-editor';
import { ${monacoExport}, ${cmExport} } from '@uipath/apollo-wind/editor-themes';

// Monaco — register before mounting the editor:
monaco.editor.defineTheme('${monacoThemeName}', ${monacoExport});

// CodeMirror — destructure syntax and ui to build extensions:
const { syntax, ui } = ${cmExport};`}</code>
        </pre>
      </div>
    </details>
  );
}

// ============================================================================
// Input Editor demo components
// ============================================================================

const futureDarkConfig = editorThemeConfigs[0];

function useEditorThemeConfig(): ThemeConfig {
  const getTheme = () => {
    const keys = editorThemeConfigs.map((c) => c.key);
    const found = Array.from(document.body.classList).find((c) =>
      keys.includes(c as ThemeConfig['key'])
    );
    return editorThemeConfigs.find((c) => c.key === found) ?? futureDarkConfig;
  };

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeConfig(getTheme()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return themeConfig;
}

function MonacoInputDemo({ themeConfig }: { themeConfig: ThemeConfig }) {
  const [mode, setMode] = useState<'text' | 'code'>('text');

  return (
    <div className="max-w-xl">
      {mode === 'text' ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <code className="flex-1 truncate text-sm font-mono text-foreground">
            workflow.status === "active" &amp;&amp; user.role !== "viewer"
          </code>
          <button
            type="button"
            aria-label="Switch to code editor"
            onClick={() => setMode('code')}
            className="flex shrink-0 items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {'{ }'}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-primary">
          <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5">
            <span className="text-xs font-medium text-foreground">TypeScript expression</span>
            <button
              type="button"
              onClick={() => setMode('text')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Text
            </button>
          </div>
          <LiveMonacoEditor
            themeConfig={themeConfig}
            height="120px"
            value={`workflow.status === "active" && user.role !== "viewer"`}
            options={{
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              renderLineHighlight: 'none',
              padding: { top: 10, bottom: 10 },
              fontSize: 12,
              lineHeight: 18,
            }}
          />
        </div>
      )}
    </div>
  );
}

function CodeMirrorInputDemo({ themeConfig }: { themeConfig: ThemeConfig }) {
  const [mode, setMode] = useState<'text' | 'code'>('text');
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [inputValue, setInputValue] = useState(
    'workflow.status === "active" && user.role !== "viewer"'
  );

  useEffect(() => {
    if (mode !== 'code' || !containerRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: inputValue,
        extensions: buildCMExtensions(themeConfig.cmTokens, themeConfig.isDark),
      }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // intentionally only re-run when mode changes
  }, [mode]);

  const handleBack = () => {
    if (viewRef.current) {
      setInputValue(viewRef.current.state.doc.toString());
    }
    setMode('text');
  };

  return (
    <div className="max-w-xl">
      {mode === 'text' ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <code className="flex-1 truncate text-sm font-mono text-foreground">{inputValue}</code>
          <button
            type="button"
            aria-label="Switch to code editor"
            onClick={() => setMode('code')}
            className="flex shrink-0 items-center gap-1 rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {'{ }'}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-primary">
          <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5">
            <span className="text-xs font-medium text-foreground">Expression</span>
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Text
            </button>
          </div>
          <div ref={containerRef} className="overflow-hidden" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Usage code snippets
// ============================================================================

const monacoFullUsage = `import * as monaco from 'monaco-editor';
import MonacoEditor from '@monaco-editor/react';
import { apolloFutureDarkMonaco } from '@uipath/apollo-wind/editor-themes';

// Register once at app startup
monaco.editor.defineTheme('apollo-future-dark', apolloFutureDarkMonaco);

// Full-featured script editor — use for scripts and multi-line expressions
<MonacoEditor
  height="400px"
  language="typescript"
  theme="apollo-future-dark"
  options={{
    fontSize: 13,
    minimap: { enabled: false },
    lineNumbers: 'on',
    folding: true,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
  }}
/>`.trim();

const monacoCompactUsage = `// Compact editor — use for property panels and constrained spaces
<MonacoEditor
  height="140px"
  language="typescript"
  theme="apollo-future-dark"
  options={{
    fontSize: 12,
    lineNumbers: 'off',
    minimap: { enabled: false },
    folding: false,
    renderLineHighlight: 'none',
    scrollBeyondLastLine: false,
    padding: { top: 10, bottom: 10 },
  }}
/>`.trim();

const monacoInputUsage = `// Input editor toggle — use for form fields with expression support
const [mode, setMode] = useState<'text' | 'code'>('text');
const [value, setValue] = useState('');

{mode === 'text' ? (
  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
    <code className="flex-1 text-sm font-mono">{value}</code>
    <button type="button" onClick={() => setMode('code')}>{'{ }'}</button>
  </div>
) : (
  <div className="overflow-hidden rounded-lg border border-primary">
    <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
      <span className="text-xs font-medium">TypeScript expression</span>
      <button type="button" onClick={() => setMode('text')}>Text</button>
    </div>
    <MonacoEditor
      height="120px"
      language="typescript"
      theme="apollo-future-dark"
      value={value}
      onChange={(v) => setValue(v ?? '')}
      options={{ lineNumbers: 'off', minimap: { enabled: false } }}
    />
  </div>
)}`.trim();

const cmFullUsage = `import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { apolloFutureDarkCodeMirror } from '@uipath/apollo-wind/editor-themes';

const { syntax, ui } = apolloFutureDarkCodeMirror;

const theme = EditorView.theme({
  '&': { backgroundColor: ui.background, color: ui.foreground },
  '.cm-cursor': { borderLeftColor: ui.cursor },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: ui.selection,
  },
  '.cm-activeLine': { backgroundColor: ui.lineHighlight },
  '.cm-gutters': { backgroundColor: ui.background, borderRight: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { color: ui.lineNumber },
}, { dark: true });

const highlight = HighlightStyle.define([
  { tag: t.comment,   color: syntax.comment,   fontStyle: 'italic' },
  { tag: t.keyword,   color: syntax.keyword },
  { tag: t.string,    color: syntax.string },
  { tag: t.number,    color: syntax.number },
  { tag: [t.bool, t.null, t.className], color: syntax.literal },
]);

export const apolloFutureDark = [theme, syntaxHighlighting(highlight)];`.trim();

const cmCompactUsage = `// Compact: disable gutter + active line for tight spaces
const theme = EditorView.theme({
  '&': { backgroundColor: ui.background, color: ui.foreground, fontSize: '12px' },
  '.cm-cursor': { borderLeftColor: ui.cursor },
  '.cm-content': { padding: '8px 12px' },
  '.cm-scroller': { overflow: 'auto' },
}, { dark: true });

// Omit lineNumbers() and highlightActiveLine() from your extensions array`.trim();

const cmInputUsage = `// Input toggle: mount/unmount CodeMirror on demand
const [mode, setMode] = useState<'text' | 'code'>('text');
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (mode !== 'code' || !containerRef.current) return;
  const view = new EditorView({
    state: EditorState.create({
      doc: value,
      extensions: [theme, syntaxHighlighting(highlight), javascript()],
    }),
    parent: containerRef.current,
  });
  return () => view.destroy();
}, [mode]);

{mode === 'text' ? (
  <div className="flex items-center gap-2 ...">
    <code>{value}</code>
    <button onClick={() => setMode('code')}>{'{ }'}</button>
  </div>
) : (
  <div className="rounded-lg border border-primary overflow-hidden">
    <div className="flex justify-between px-3 py-1.5 bg-muted border-b border-border">
      <span>Expression</span>
      <button onClick={() => setMode('text')}>Text</button>
    </div>
    <div ref={containerRef} />
  </div>
)}`.trim();

// ============================================================================
// Feature comparison + decision tables
// ============================================================================

const featureRows = [
  {
    feature: 'Bundle size',
    monaco: '~2 MB (separate chunk)',
    cm: '~50 KB',
    note: 'Monaco loads lazily; still the largest single editor dependency.',
  },
  {
    feature: 'IntelliSense / autocomplete',
    monaco: 'Full VS Code engine',
    cm: 'Extension-based',
    note: 'Monaco ships the TypeScript language server; CodeMirror needs a custom provider.',
  },
  {
    feature: 'Type checking / diagnostics',
    monaco: 'Yes (TypeScript worker)',
    cm: 'No',
    note: 'Monaco can show red squiggles and hover types out of the box.',
  },
  {
    feature: 'Syntax highlighting',
    monaco: 'Built-in, 100+ languages',
    cm: 'Via language extensions',
    note: 'CodeMirror requires importing a separate @codemirror/lang-* package per language.',
  },
  {
    feature: 'Code folding',
    monaco: 'Yes',
    cm: 'Via extension',
    note: '',
  },
  {
    feature: 'Diff / merge editor',
    monaco: 'Yes',
    cm: 'No',
    note: 'Monaco provides a built-in side-by-side diff view.',
  },
  {
    feature: 'Minimap',
    monaco: 'Yes',
    cm: 'No',
    note: '',
  },
  {
    feature: 'Mobile / touch',
    monaco: 'Limited',
    cm: 'Good',
    note: 'CodeMirror 6 was designed with mobile editing in mind.',
  },
  {
    feature: 'Customisation API',
    monaco: 'Limited',
    cm: 'Extensive',
    note: "CodeMirror's extension system allows deep, composable customisation.",
  },
  {
    feature: 'React integration',
    monaco: '@monaco-editor/react',
    cm: 'Manual EditorView setup',
    note: 'Monaco has a maintained React wrapper; CodeMirror is wired up directly.',
  },
];

const decisionRows = [
  {
    useCase: '{{ variable }} single-line interpolation',
    solution: 'CodeMirror',
    pkg: '@codemirror/*',
    notes: 'Lightweight. Ideal for expression fields.',
  },
  {
    useCase: 'JavaScript / TypeScript expression editing',
    solution: 'Monaco',
    pkg: '@monaco-editor/react',
    notes: 'Full IntelliSense, diagnostics, multi-line.',
  },
  {
    useCase: 'Multi-line script or complex expression',
    solution: 'Monaco',
    pkg: '@monaco-editor/react',
    notes: 'Use when CodeMirror is insufficient.',
  },
];

// ============================================================================
// Editor tab components
// ============================================================================

type EditorTab = 'full' | 'compact' | 'input';

const editorTabs: { key: EditorTab; label: string }[] = [
  { key: 'full', label: 'Full Editor' },
  { key: 'compact', label: 'Compact Editor' },
  { key: 'input', label: 'Input Editor' },
];

const tabDescriptions: Record<EditorTab, { monaco: string; cm: string }> = {
  full: {
    monaco:
      'For script panels and automation builders where the editor is the primary focus. Give it explicit height and enable all navigation features.',
    cm: 'Full CodeMirror setup with line numbers, active line highlight, and selection. Use for lightweight script areas where Monaco’s bundle weight is not justified.',
  },
  compact: {
    monaco:
      'For property panels and sidebars where vertical space is constrained. Disable line numbers and gutter features to maximise the code area.',
    cm: 'Minimal CodeMirror without gutter or active-line decoration. Best for single-line expression fields in property panels.',
  },
  input: {
    monaco:
      'For form fields where users can optionally switch to a code editor. Starts as a plain text input; a toggle reveals Monaco for authoring TypeScript expressions.',
    cm: 'Preferred pattern for variable binding fields. CodeMirror mounts on demand and is destroyed when collapsed, keeping memory usage low.',
  },
};

function MonacoEditorPage() {
  const [activeTab, setActiveTab] = useState<EditorTab>('full');
  const themeConfig = useEditorThemeConfig();
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Monaco Editor</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Full-featured code editor powered by VS Code’s engine. Use it when users need
          IntelliSense, diagnostics, bracket matching, and multi-line editing. Import from{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            @uipath/apollo-wind/editor-themes
          </code>{' '}
          and register themes once at app startup.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-8">
        {/* ── Tab bar ── */}
        <div className="mb-8 flex overflow-hidden rounded-lg border border-border">
          {editorTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 border-r border-border px-4 py-3 text-sm font-medium last:border-r-0 transition-colors ${
                activeTab === tab.key
                  ? 'bg-card text-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          {tabDescriptions[activeTab].monaco}
        </p>

        {activeTab === 'full' && (
          <>
            <div className="mb-4 overflow-hidden rounded-lg border border-border">
              <LiveMonacoEditor themeConfig={themeConfig} height="400px" value={monacoFullSample} />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              <code>{monacoFullUsage}</code>
            </pre>
          </>
        )}

        {activeTab === 'compact' && (
          <>
            <div className="mb-4 overflow-hidden rounded-lg border border-border">
              <LiveMonacoEditor
                themeConfig={themeConfig}
                height="140px"
                value={monacoSample}
                options={{
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  renderLineHighlight: 'none',
                  padding: { top: 10, bottom: 10 },
                  fontSize: 12,
                  lineHeight: 18,
                }}
              />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              <code>{monacoCompactUsage}</code>
            </pre>
          </>
        )}

        {activeTab === 'input' && (
          <>
            <div className="mb-4">
              <MonacoInputDemo themeConfig={themeConfig} />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              <code>{monacoInputUsage}</code>
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

function CodeMirrorEditorPage() {
  const [activeTab, setActiveTab] = useState<EditorTab>('full');
  const themeConfig = useEditorThemeConfig();
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          CodeMirror Editor
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Lightweight editor for single-line expressions and{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
            {'{{ variable }}'}
          </code>{' '}
          template literal interpolation. Significantly smaller bundle than Monaco. Consume from{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            @uipath/apollo-wind/editor-themes
          </code>
          .
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-8">
        {/* ── Tab bar ── */}
        <div className="mb-8 flex overflow-hidden rounded-lg border border-border">
          {editorTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 border-r border-border px-4 py-3 text-sm font-medium last:border-r-0 transition-colors ${
                activeTab === tab.key
                  ? 'bg-card text-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          {tabDescriptions[activeTab].cm}
        </p>

        {activeTab === 'full' && (
          <>
            <div className="mb-4">
              <LiveCodeMirrorEditor themeConfig={themeConfig} value={monacoSample} />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              <code>{cmFullUsage}</code>
            </pre>
          </>
        )}

        {activeTab === 'compact' && (
          <>
            <div className="mb-4">
              <LiveCodeMirrorEditor themeConfig={themeConfig} value={codemirrorSample} compact />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              <code>{cmCompactUsage}</code>
            </pre>
          </>
        )}

        {activeTab === 'input' && (
          <>
            <div className="mb-4">
              <CodeMirrorInputDemo key={themeConfig.key} themeConfig={themeConfig} />
            </div>
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
              <code>{cmInputUsage}</code>
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Story: Overview
// ============================================================================

export const CodeEditors = {
  name: 'Overview',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Code in Apollo</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Apollo provides two editors for code input, each with a distinct role, package weight, and
          interaction model. Pick the one that matches the user's intent.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">When to use what</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Start here. Pick the solution that matches the user's intent, then see its dedicated page
          for live demos and integration guidance.
        </p>

        <div className="mb-10 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Use case
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Solution
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Package</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {decisionRows.map((row) => (
                <tr key={row.useCase} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-muted-foreground">{row.useCase}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.solution}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-primary">{row.pkg}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8 h-px bg-border" />

        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          The orchestrator pattern
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          When building expression or script input fields, encapsulate the Monaco/CodeMirror
          decision in a single{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            CodeEditorField
          </code>{' '}
          component. Feature code passes a{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">mode</code> and the
          orchestrator picks the right editor, keeping the decision in one place.
        </p>

        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-semibold text-foreground">Single-line + literal</span>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                mode: literal
              </code>{' '}
              and line count is 1, render{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                CodeMirrorEditor
              </code>
              . Lightweight, optimised for{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                {'{{ variable }}'}
              </code>{' '}
              interpolation.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-semibold text-foreground">Expression mode</span>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                mode: expression
              </code>{' '}
              renders{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                MonacoEditor
              </code>
              . Full IntelliSense, type checking, and diagnostics for JS/TS expressions.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <span className="text-sm font-semibold text-foreground">Multi-line</span>
            <p className="text-sm text-muted-foreground">
              Any mode where line count exceeds 1, escalate to{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                MonacoEditor
              </code>{' '}
              regardless of mode. Prevents CodeMirror being used for complex scripts.
            </p>
          </div>
        </div>

        <div className="mb-8 h-px bg-border" />

        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Capability comparison
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          A full breakdown of what each editor supports. Use this when the decision table above
          doesn't cover your use case.
        </p>

        <div className="mb-10 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Feature</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Monaco</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  CodeMirror
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.feature}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.monaco}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.cm}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground/70">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Story: Monaco Editor
// ============================================================================

export const MonacoEditorStory = {
  name: 'Editor Monaco',
  parameters: { layout: 'fullscreen' },
  render: () => <MonacoEditorPage />,
};

// ============================================================================
// Story: CodeMirror Editor
// ============================================================================

export const CodeMirrorEditorStory = {
  name: 'Editor CodeMirror',
  parameters: { layout: 'fullscreen' },
  render: () => <CodeMirrorEditorPage />,
};

// ============================================================================
// Story: All Themes
// ============================================================================

const themeFamilies = ['Core', 'Core HC', 'Future'] as const;

export const AllThemes = {
  name: 'Themes',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Editor Themes</h2>
        <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
          Apollo ships editor themes for all six Apollo color themes. Each theme object is a static
          extraction of the corresponding Apollo semantic tokens so Monaco and CodeMirror can
          consume them at registration time.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          Import from{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            @uipath/apollo-wind/editor-themes
          </code>
          .
        </p>

        <div className="space-y-10">
          {themeFamilies.map((family) => {
            const configs = editorThemeConfigs.filter((c) => c.family === family);
            return (
              <div key={family}>
                <h3 className="mb-4 text-base font-semibold text-foreground">{family}</h3>
                <div className="grid grid-cols-2 gap-5">
                  {configs.map((cfg) => (
                    <div
                      key={cfg.key}
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full border border-border"
                          style={{ background: cfg.isDark ? '#ffffff20' : '#00000020' }}
                        />
                        <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                        <code className="ml-auto text-[11px] text-primary">{cfg.key}</code>
                      </div>

                      <div className="p-4">
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Monaco
                        </p>
                        <div className="mb-4">
                          <StaticMonacoPreview themeConfig={cfg} />
                        </div>

                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          CodeMirror
                        </p>
                        <LiveCodeMirrorEditor themeConfig={cfg} value={codemirrorSample} />
                      </div>
                      <ThemeTokenPanel themeConfig={cfg} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 h-px bg-border" />

        <div className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-foreground">Import reference</h3>
          <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
            <code>{`import {
  // Future
  apolloFutureDarkMonaco,    apolloFutureLightMonaco,
  apolloFutureDarkCodeMirror, apolloFutureLightCodeMirror,

  // Core
  apolloCoreDarkMonaco,      apolloCoreLightMonaco,
  apolloCoreDarkCodeMirror,  apolloCoreLightCodeMirror,

  // Core High Contrast
  apolloCoreDarkHCMonaco,    apolloCoreLightHCMonaco,
  apolloCoreDarkHCCodeMirror, apolloCoreLightHCCodeMirror,
} from '@uipath/apollo-wind/editor-themes';`}</code>
          </pre>
        </div>
      </div>
    </div>
  ),
};
