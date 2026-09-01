import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { drawSelection, EditorView, highlightActiveLine, lineNumbers } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import MonacoEditor, { type EditorProps } from '@monaco-editor/react';
import type { Meta } from '@storybook/react-vite';
import { Code2, Maximize2 } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ErrorAndValidationWorkbench } from '../../../../../apps/storybook/src/patterns/ErrorAndValidationWorkbench';
import { CanvasTakeoverModal } from '../../../../apollo-react/src/canvas/components/CanvasTakeoverModal/CanvasTakeoverModal';
import { NodePropertyPanel } from '../../../../apollo-react/src/canvas/components/NodePropertyPanel/NodePropertyPanel';
import { withCanvasProviders } from '../../../../apollo-react/src/canvas/storybook-utils';
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
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group';
import { LockableValueField } from './lockable-value-field';
import {
  PromptEditor,
  type PromptEditorAutoCompleteOption,
  type PromptEditorRef,
  type PromptEditorToken,
} from './prompt-editor';
import { VariablePicker, type VariablePickerItem } from './variable-picker';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Patterns/Code Editors',
  tags: ['!autodocs'],
  parameters: { layout: 'padded' },
  decorators: [withCanvasProviders({ fullscreen: false })],
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
  // These snippets are illustrative fragments, not complete programs, so
  // undeclared identifiers are expected. Disable only semantic validation —
  // syntax validation stays on so genuinely malformed code still surfaces.
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
  });
  monacoThemesRegistered = true;
}

function buildCMExtensions(tokens: ApolloCodeMirrorTheme, isDark: boolean, compact = false) {
  const { syntax, ui } = tokens;
  const theme = EditorView.theme(
    {
      '&': {
        height: '100%',
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
      '.cm-content': {
        padding: '12px 0',
        caretColor: ui.cursor,
        // CodeMirror's own base styles set `.cm-content { font-family: monospace }` at the
        // same specificity as the `&` rule above, which wins the cascade by source order and
        // silently overrides our font stack. `inherit` still overrides that default (picking
        // up the correct stack from the `&` rule on the parent `.cm-editor`) without repeating
        // the font stack literal in two places.
        fontFamily: 'inherit',
        fontSize: 'inherit',
      },
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
  onChange,
  onMount,
  options = {},
}: {
  themeConfig: ThemeConfig;
  height?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  onMount?: EditorProps['onMount'];
  options?: Record<string, unknown>;
}) {
  return (
    <MonacoEditor
      height={height}
      defaultLanguage="typescript"
      value={value ?? monacoSample}
      theme={themeConfig.monacoThemeName}
      beforeMount={registerAllMonacoThemes}
      onChange={onChange}
      onMount={onMount}
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
        // Suggestion/hover widgets render in a fixed overlay layer instead of being
        // clipped by the `overflow-hidden` containers these demos wrap the editor in.
        fixedOverflowWidgets: true,
        ...options,
      }}
    />
  );
}

function LiveCodeMirrorEditor({
  themeConfig,
  value,
  compact = false,
  height,
}: {
  themeConfig: ThemeConfig;
  value?: string;
  compact?: boolean;
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { cmTokens, isDark } = themeConfig;
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
    <div
      ref={containerRef}
      style={height ? { height } : undefined}
      className="overflow-hidden rounded-lg border border-border-subtle"
    />
  );
}

// ============================================================================
// Static Monaco preview — lightweight color swatch for the Themes page.
// Avoids mounting 6 simultaneous Monaco instances which causes white screens.
// ============================================================================

// Shared fixed height so the Monaco and CodeMirror previews on the Themes page
// always match, regardless of how many lines either one's sample wraps to.
const THEME_PREVIEW_HEIGHT = '128px';

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
      className="overflow-y-auto rounded-lg border border-border-subtle p-3 text-[13px] leading-5"
      style={{
        height: THEME_PREVIEW_HEIGHT,
        background: bg,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      }}
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

/** Monaco and CodeMirror previews stacked at the same fixed height, for consistent display. */
function ThemeEditorPreviewPair({ themeConfig }: { themeConfig: ThemeConfig }) {
  return (
    <>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Monaco
      </p>
      <div className="mb-4">
        <StaticMonacoPreview themeConfig={themeConfig} />
      </div>

      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        CodeMirror
      </p>
      <LiveCodeMirrorEditor
        themeConfig={themeConfig}
        value={codemirrorSample}
        height={THEME_PREVIEW_HEIGHT}
      />
    </>
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
        <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-muted p-3 text-[11px] leading-relaxed text-foreground">
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
        <InputGroup className="bg-surface-overlay">
          <InputGroupInput
            readOnly
            value={`workflow.status === "active" && user.role !== "viewer"`}
            placeholder="Type an expression…"
            aria-label="Expression"
            className="font-mono"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              icon
              aria-label="Switch to code editor"
              onClick={() => setMode('code')}
            >
              <Code2 />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <div className="overflow-hidden rounded-lg border border-primary">
          <div className="flex items-center justify-between border-b border-border-subtle bg-muted px-3 py-1.5">
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
        <InputGroup className="bg-surface-overlay">
          <InputGroupInput
            readOnly
            value={inputValue}
            placeholder="Type an expression…"
            aria-label="Expression"
            className="font-mono"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              icon
              aria-label="Switch to code editor"
              onClick={() => setMode('code')}
            >
              <Code2 />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <div className="overflow-hidden rounded-lg border border-primary">
          <div className="flex items-center justify-between border-b border-border-subtle bg-muted px-3 py-1.5">
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

function MonacoEditorPage() {
  const themeConfig = useEditorThemeConfig();
  return (
    <div className="min-h-screen w-full bg-surface text-foreground">
      <div className="mx-auto max-w-4xl px-8 pt-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">Monaco Editor</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Full-featured code editor powered by VS Code’s engine. Use it when users need
          IntelliSense, diagnostics, bracket matching, and multi-line editing. Import from{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            @uipath/apollo-wind/editor-themes
          </code>{' '}
          and register themes once at app startup.
        </p>
        <div className="my-10 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-16">
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
              What it is
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Monaco is the VS Code editor engine for multi-line scripts and expressions. It
              includes IntelliSense, diagnostics, bracket matching, search, and language services.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
              When to use it
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose Monaco when code is the primary task or users need rich TypeScript and
              JavaScript authoring. Use the Full, Compact, Input, Panel, and Takeover stories for
              layout guidance.
            </p>
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
          Reference implementation
        </h2>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          A representative full editor with Apollo theme registration and recommended sizing.
        </p>
        <div className="mb-4 overflow-hidden rounded-lg border border-border-subtle">
          <LiveMonacoEditor themeConfig={themeConfig} height="400px" value={monacoFullSample} />
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-surface p-4 text-xs leading-relaxed text-foreground">
          <code>{monacoFullUsage}</code>
        </pre>
        <div className="mt-10">
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            Style and behavior
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Use 13px text with a 20px line height for the standard editor, disable the minimap in
            embedded product surfaces, and use Apollo editor themes rather than application-level
            colors. Keep search, diagnostics, keyboard focus, and a clear exit action available when
            the editor expands beyond a field.
          </p>
        </div>
      </div>
    </div>
  );
}

function CodeMirrorEditorPage() {
  const themeConfig = useEditorThemeConfig();
  return (
    <div className="min-h-screen w-full bg-surface text-foreground">
      <div className="mx-auto max-w-4xl px-8 pt-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
          CodeMirror Editor
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
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
        <div className="my-10 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-16">
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
              What it is
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              CodeMirror is a lightweight, extensible editor for expressions and focused code input.
              Apollo provides syntax and UI tokens for building a native CodeMirror 6 integration.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
              When to use it
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose CodeMirror for lightweight expression fields, variable bindings, and focused
              script areas where Monaco’s bundle and language services are unnecessary.
            </p>
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
          Reference implementation
        </h2>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          A representative CodeMirror editor using Apollo’s theme tokens and full editor
          affordances.
        </p>
        <div className="mb-4">
          <LiveCodeMirrorEditor themeConfig={themeConfig} value={monacoSample} />
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-surface p-4 text-xs leading-relaxed text-foreground">
          <code>{cmFullUsage}</code>
        </pre>
        <div className="mt-10">
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            Style and behavior
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Use the same 13px / 20px editor rhythm as Monaco, wire Apollo syntax and UI tokens into
            CodeMirror extensions, and omit gutters for compact fields. Mount CodeMirror on demand
            for input editors so lightweight fields stay lightweight when users are only reading a
            value.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Story: Usage examples
// Dedicated stories make the usage guidance searchable without requiring users
// to discover the tabs inside the implementation reference pages.
// ============================================================================

function UsagePage({
  eyebrow,
  title,
  description,
  guidance,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  guidance: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-surface text-foreground">
      <div className="mx-auto max-w-4xl px-8 py-16">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {eyebrow}
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-lg leading-8 text-muted-foreground">{description}</p>
        <div className="my-10 h-px bg-border" />

        <div className="mb-10 rounded-xl border border-border-subtle bg-surface p-5">
          <p className="text-sm leading-6 text-muted-foreground">{guidance}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

function EditorComparison({ height, compact = false }: { height: string; compact?: boolean }) {
  const themeConfig = useEditorThemeConfig();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Monaco
        </p>
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          <LiveMonacoEditor
            themeConfig={themeConfig}
            height={height}
            value={compact ? monacoSample : monacoFullSample}
            options={
              compact
                ? {
                    lineNumbers: 'off',
                    glyphMargin: false,
                    folding: false,
                    renderLineHighlight: 'none',
                    padding: { top: 10, bottom: 10 },
                    fontSize: 12,
                    lineHeight: 18,
                  }
                : undefined
            }
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          CodeMirror
        </p>
        <LiveCodeMirrorEditor
          themeConfig={themeConfig}
          value={compact ? codemirrorSample : monacoSample}
          compact={compact}
          height={height}
        />
      </div>
    </div>
  );
}

function FullEditorUsagePage() {
  return (
    <UsagePage
      eyebrow="Usage / Full Editor"
      title="Full Editor"
      description="A focused, multi-line editing surface for scripts, policies, and automation logic."
      guidance="Use Full Editor when code is the primary task. Give it a stable height, show line numbers, and keep navigation features available. Monaco is the default when users need IntelliSense and diagnostics; CodeMirror is a lighter alternative for syntax-focused editing."
    >
      <EditorComparison height="360px" />
    </UsagePage>
  );
}

function CompactEditorUsagePage() {
  return (
    <UsagePage
      eyebrow="Usage / Compact Editor"
      title="Compact Editor"
      description="A constrained editing surface for expressions embedded inside property panels and sidebars."
      guidance="Use Compact Editor when the surrounding form remains the primary task. Remove line numbers and decorative gutters, preserve the editor's syntax and focus states, and keep the height predictable."
    >
      <EditorComparison height="148px" compact />
    </UsagePage>
  );
}

function InputEditorUsagePage() {
  const themeConfig = useEditorThemeConfig();
  const [lockableValue, setLockableValue] = useState('invoice.total');
  const [lockableMode, setLockableMode] = useState<'fixed' | 'expression'>('expression');
  const [lockableLocked, setLockableLocked] = useState(false);
  return (
    <UsagePage
      eyebrow="Usage / Input Editor"
      title="Input Editor"
      description="An expression field that starts compact and expands into code editing only when the user needs it."
      guidance="Use Input Editor for variable bindings and form fields where plain text is the fastest default. Keep the mode switch visible, preserve the value when changing modes, and return the user to the compact field when they are done editing."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Monaco input
          </p>
          <MonacoInputDemo themeConfig={themeConfig} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            CodeMirror input
          </p>
          <CodeMirrorInputDemo key={themeConfig.key} themeConfig={themeConfig} />
        </div>
      </div>
      <div className="mt-8 rounded-xl border border-border-subtle bg-surface-raised p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">Input editor in a lockable field</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Use this pattern when a value can be fixed, locked for review, or supplied as an
            expression. The field owns the mode and lock affordances while the editor provides the
            code-specific editing experience.
          </p>
        </div>
        <LockableValueField
          id="input-editor-lockable-example"
          label="Invoice total"
          value={lockableValue}
          onValueChange={setLockableValue}
          locked={lockableLocked}
          onLockedChange={setLockableLocked}
          mode={lockableMode}
          onModeChange={setLockableMode}
          fieldType="string"
          showFieldActions={false}
          renderExpressionEditor={({ value, onValueChange, readOnly, placeholder }) => (
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-md border border-border-subtle">
              <LiveMonacoEditor
                themeConfig={themeConfig}
                height="36px"
                value={value}
                onChange={(nextValue) => onValueChange?.(nextValue ?? '')}
                options={{
                  readOnly,
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  minimap: { enabled: false },
                  renderLineHighlight: 'none',
                  padding: { top: 8, bottom: 8 },
                  fontSize: 13,
                  lineHeight: 20,
                }}
              />
              {!value && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 truncate text-sm text-muted-foreground future:font-normal future:text-foreground-muted">
                  {placeholder}
                </span>
              )}
            </div>
          )}
        />
      </div>
    </UsagePage>
  );
}

// ============================================================================
// Editor Variables — inserting a variable via the Insert dropdown or by
// typing `$` directly in the editor. Both paths write the same token model.
// ============================================================================

const VARIABLE_TREE: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    type: 'object',
    children: [
      { id: 'vars-firstName', label: 'firstName', value: '$vars.firstName', type: 'string' },
      { id: 'vars-lastName', label: 'lastName', value: '$vars.lastName', type: 'string' },
      { id: 'vars-orderTotal', label: 'orderTotal', value: '$vars.orderTotal', type: 'number' },
    ],
  },
  {
    id: 'output',
    label: '$output',
    type: 'object',
    children: [
      { id: 'output-summary', label: 'summary', value: '$output.summary', type: 'string' },
    ],
  },
  {
    id: 'state',
    label: '$state',
    type: 'object',
    children: [
      { id: 'state-retryCount', label: 'retryCount', value: '$state.retryCount', type: 'number' },
    ],
  },
];

const VARIABLES_AUTOCOMPLETE_OPTIONS: PromptEditorAutoCompleteOption[] = [
  { type: 'input', value: 'vars.firstName' },
  { type: 'input', value: 'vars.lastName' },
  { type: 'input', value: 'vars.orderTotal' },
  { type: 'output', value: 'output.summary' },
  { type: 'state', value: 'state.retryCount' },
];

const VARIABLES_SAMPLE_VALUE: PromptEditorToken[] = [
  { type: 'text', value: 'Draft a follow-up for ' },
  { type: 'input', value: 'vars.firstName' },
  { type: 'text', value: ' about their order total of ' },
  { type: 'input', value: 'vars.orderTotal' },
  { type: 'text', value: '.' },
];

const VARIABLES_MONACO_SAMPLE = '$vars.firstName + " " + $vars.lastName';

/** Maps a picked variable-picker item (`$`-prefixed) to a prompt-editor token option (no `$`). */
function toPromptEditorOption(item: VariablePickerItem): PromptEditorAutoCompleteOption | null {
  if (!item.value) return null;
  const path = item.value.replace(/^\$/, '');
  return (
    VARIABLES_AUTOCOMPLETE_OPTIONS.find((option) => option.value === path) ?? {
      type: 'input',
      value: path,
    }
  );
}

function EditorVariablesUsagePage() {
  const promptEditorRef = useRef<PromptEditorRef | null>(null);
  const [promptValue, setPromptValue] = useState<PromptEditorToken[]>(VARIABLES_SAMPLE_VALUE);

  const themeConfig = useEditorThemeConfig();
  const monacoEditorRef = useRef<Parameters<NonNullable<EditorProps['onMount']>>[0] | null>(null);
  const insertIntoMonaco = (item: VariablePickerItem) => {
    const editor = monacoEditorRef.current;
    const selection = editor?.getSelection();
    if (!editor || !selection || !item.value) return;
    editor.executeEdits('insert-variable', [
      { range: selection, text: item.value, forceMoveMarkers: true },
    ]);
    editor.focus();
  };

  return (
    <UsagePage
      eyebrow="Usage / Editor Variables"
      title="Editor Variables"
      description="Two ways to bind a variable into an editor: pick one from the Insert dropdown, or type $ directly where the editor supports it."
      guidance="Both paths write into the same underlying value, so the editor stays the single source of truth regardless of entry point. PromptEditor exposes a ref-based insertVariableToken method; Monaco and CodeMirror don't have an equivalent built-in, so the Insert dropdown instead inserts the variable at the current cursor selection via the editor's own API."
    >
      <div className="rounded-xl border border-border-subtle bg-surface-raised p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Prompt</p>
          <VariablePicker
            items={VARIABLE_TREE}
            onSelect={(item) => {
              const option = toPromptEditorOption(item);
              if (option) promptEditorRef.current?.insertVariableToken(option);
            }}
          />
        </div>
        <PromptEditor
          editorRef={promptEditorRef}
          value={promptValue}
          onChange={setPromptValue}
          autoCompleteOptions={VARIABLES_AUTOCOMPLETE_OPTIONS}
          placeholder="Type $ or use Insert to add a variable…"
          ariaLabel="Prompt"
        />
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Try both: choose{' '}
          <span className="font-mono text-foreground">Insert → $vars → firstName</span> above, or
          type <span className="font-mono text-foreground">$</span> in the editor and pick from the
          menu that appears.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-border-subtle bg-surface-raised p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Expression</p>
          <VariablePicker items={VARIABLE_TREE} onSelect={insertIntoMonaco} />
        </div>
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          <LiveMonacoEditor
            themeConfig={themeConfig}
            height="120px"
            value={VARIABLES_MONACO_SAMPLE}
            onMount={(editor) => {
              monacoEditorRef.current = editor;
            }}
            options={{
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              renderLineHighlight: 'none',
              padding: { top: 10, bottom: 10 },
              fontSize: 13,
              lineHeight: 20,
            }}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Click into the editor to place your cursor, then choose{' '}
          <span className="font-mono text-foreground">Insert → $vars → firstName</span> above. It
          inserts at the cursor via{' '}
          <span className="font-mono text-foreground">editor.executeEdits</span>, the same pattern
          used by the Node Property Panel's Full Editor composition.
        </p>
      </div>
    </UsagePage>
  );
}

function CodeEditorRightPanel({
  onClose,
  onExpand,
}: {
  onClose: () => void;
  onExpand: () => void;
}) {
  const themeConfig = useEditorThemeConfig();
  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeLabel="Send email"
      nodeCategory="Gmail · Code editor"
      onClose={onClose}
      action={
        <button
          type="button"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Run
        </button>
      }
      className="h-full w-full"
      contentInset="0.875rem"
    >
      <div className="flex h-full min-h-0 flex-col gap-3 p-3">
        <div className="flex shrink-0 items-center justify-between">
          <p className="text-xs font-medium text-foreground">Expression</p>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand code editor"
            title="Expand code editor"
            className="grid size-6 place-items-center rounded text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
          >
            <Maximize2 size={14} strokeWidth={1.75} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border-subtle">
          <LiveMonacoEditor
            themeConfig={themeConfig}
            height="100%"
            value={monacoFullSample}
            options={{
              lineNumbers: 'on',
              glyphMargin: false,
              folding: false,
              renderLineHighlight: 'line',
              padding: { top: 12, bottom: 12 },
              fontSize: 13,
              lineHeight: 20,
            }}
          />
        </div>
        <p className="shrink-0 text-xs leading-5 text-muted-foreground">
          Use a full editor in a panel when the node’s code is the primary property being
          configured.
        </p>
      </div>
    </NodePropertyPanel>
  );
}

function UXPanelUsagePage() {
  const themeConfig = useEditorThemeConfig();
  const [takeoverOpen, setTakeoverOpen] = useState(false);

  return (
    <ErrorAndValidationWorkbench
      renderRightPanel={({ onClose }) => (
        <CodeEditorRightPanel onClose={onClose} onExpand={() => setTakeoverOpen(true)} />
      )}
      takeoverOverlay={
        <CanvasTakeoverModal
          open={takeoverOpen}
          title="Expression"
          onOpenChange={setTakeoverOpen}
          defaultExpanded
        >
          <div className="h-full p-4">
            <div className="h-full overflow-hidden rounded-lg border border-border-subtle">
              <LiveMonacoEditor themeConfig={themeConfig} height="100%" value={monacoFullSample} />
            </div>
          </div>
        </CanvasTakeoverModal>
      }
    />
  );
}

// ============================================================================
// Story: Overview
// ============================================================================

export const CodeEditors = {
  name: 'Overview',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="min-h-screen w-full bg-surface text-foreground">
      <div className="mx-auto max-w-4xl px-8 pt-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">Code in Apollo</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Apollo provides two editors for code input, each with a distinct role, package weight, and
          interaction model. Pick the one that matches the user's intent.
        </p>
        <div className="my-10 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-16">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">When to use what</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Start here. Pick the solution that matches the user's intent, then see its dedicated page
          for live demos and integration guidance.
        </p>

        <div className="mb-10 overflow-hidden rounded-lg border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-muted">
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
                <tr key={row.useCase} className="border-b border-border-subtle last:border-b-0">
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
          Choosing the editor pattern
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Apollo documents three integration patterns rather than adding another wrapper component:
          Full Editor for script authoring, Compact Editor for constrained panels, and Input Editor
          when users can switch between plain text and code. Feature code can compose these patterns
          with Monaco or CodeMirror while keeping the editor choice close to the field that owns it.
        </p>

        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5">
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
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5">
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
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5">
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

        <div className="mb-10 overflow-hidden rounded-lg border border-border-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-muted">
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
                <tr key={row.feature} className="border-b border-border-subtle last:border-b-0">
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
  name: 'Reference Monaco Editor',
  parameters: { layout: 'fullscreen' },
  render: () => <MonacoEditorPage />,
};

// ============================================================================
// Story: CodeMirror Editor
// ============================================================================

export const CodeMirrorEditorStory = {
  name: 'Reference CodeMirror Editor',
  parameters: { layout: 'fullscreen' },
  render: () => <CodeMirrorEditorPage />,
};

export const FullEditor = {
  name: 'Editor Full',
  parameters: { layout: 'fullscreen' },
  render: () => <FullEditorUsagePage />,
};

export const CompactEditor = {
  name: 'Editor Compact',
  parameters: { layout: 'fullscreen' },
  render: () => <CompactEditorUsagePage />,
};

export const InputEditor = {
  name: 'Editor Input',
  parameters: { layout: 'fullscreen' },
  render: () => <InputEditorUsagePage />,
};

export const EditorVariables = {
  name: 'Editor Variables',
  parameters: { layout: 'fullscreen' },
  render: () => <EditorVariablesUsagePage />,
};

export const UXPanel = {
  name: 'Layout Pattern',
  parameters: { layout: 'fullscreen' },
  render: () => <UXPanelUsagePage />,
};

// ============================================================================
// Story: All Themes
// ============================================================================

const themeFamilies = ['Core', 'Core HC', 'Future'] as const;

export const AllThemes = {
  name: 'Themes',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="min-h-screen w-full bg-surface text-foreground">
      <div className="mx-auto max-w-4xl px-8 py-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">Editor Themes</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Apollo ships editor themes for all six Apollo color themes. Each theme object is a static
          extraction of the corresponding Apollo semantic tokens so Monaco and CodeMirror can
          consume them at registration time.
        </p>
        <p className="mt-2 text-base leading-7 text-muted-foreground">
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
                      className="overflow-hidden rounded-xl border border-border-subtle bg-surface"
                    >
                      <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-overlay px-4 py-2.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full border border-border-subtle"
                          style={{ background: cfg.isDark ? '#ffffff20' : '#00000020' }}
                        />
                        <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                        <code className="ml-auto text-[11px] text-primary">{cfg.key}</code>
                      </div>

                      <div className="p-4">
                        <ThemeEditorPreviewPair themeConfig={cfg} />
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
          <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-surface p-4 text-xs leading-relaxed text-foreground">
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
