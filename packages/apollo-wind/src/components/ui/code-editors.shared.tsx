// Shared Monaco demo helpers for Storybook stories (Code Editors patterns, Modal Code).
// Kept in one module because the TypeScript-defaults ref count below is global state:
// two copies would each restore defaults the other still depends on.
import MonacoEditor, { type EditorProps } from '@monaco-editor/react';
import { useEffect, useId, useRef, useState } from 'react';
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
// Theme registry — all Apollo editor themes in one place
// ============================================================================

export const editorThemeConfigs = [
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

export type ThemeConfig = (typeof editorThemeConfigs)[number];

// ============================================================================
// Sample code snippets
// ============================================================================

export const monacoFullSample =
  `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

export const monacoSample = `interface WorkflowNode {
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

// ============================================================================
// Shared helpers
// ============================================================================

let monacoThemesRegistered = false;

type MonacoInstance = Parameters<NonNullable<EditorProps['beforeMount']>>[0];
type TypescriptDefaults = MonacoInstance['languages']['typescript']['typescriptDefaults'];

export function registerAllMonacoThemes(monaco: MonacoInstance) {
  if (monacoThemesRegistered) return;
  for (const cfg of editorThemeConfigs) {
    monaco.editor.defineTheme(cfg.monacoThemeName, cfg.monacoThemeObj);
  }
  monacoThemesRegistered = true;
}

// TypeScript defaults are global to the Monaco instance, not per model, and Storybook
// reuses one preview runtime across stories. Apply the demo defaults while any demo
// editor is mounted and restore the previous ones when the last unmounts, so other
// stories' editors keep their own diagnostics.
let demoDefaultsUsers = 0;
let savedTypescriptDefaults: {
  diagnostics: ReturnType<TypescriptDefaults['getDiagnosticsOptions']>;
  compiler: ReturnType<TypescriptDefaults['getCompilerOptions']>;
} | null = null;

function acquireDemoTypescriptDefaults(monaco: MonacoInstance) {
  demoDefaultsUsers += 1;
  if (demoDefaultsUsers > 1) return;
  const ts = monaco.languages.typescript.typescriptDefaults;
  savedTypescriptDefaults = {
    diagnostics: ts.getDiagnosticsOptions(),
    compiler: ts.getCompilerOptions(),
  };
  // These snippets are illustrative fragments, not complete programs, so undeclared
  // identifiers are expected. Disable only semantic validation; syntax validation
  // stays on so genuinely malformed code still surfaces.
  ts.setDiagnosticsOptions({ ...ts.getDiagnosticsOptions(), noSemanticValidation: true });
  // The full sample is a React component, so parse models as TSX; otherwise syntax
  // validation flags every JSX line.
  ts.setCompilerOptions({
    ...ts.getCompilerOptions(),
    jsx: monaco.languages.typescript.JsxEmit.Preserve,
  });
}

function releaseDemoTypescriptDefaults(monaco: MonacoInstance) {
  demoDefaultsUsers -= 1;
  if (demoDefaultsUsers > 0 || !savedTypescriptDefaults) return;
  const ts = monaco.languages.typescript.typescriptDefaults;
  ts.setDiagnosticsOptions(savedTypescriptDefaults.diagnostics);
  ts.setCompilerOptions(savedTypescriptDefaults.compiler);
  savedTypescriptDefaults = null;
}

// ============================================================================
// Live Monaco editor
// ============================================================================

export function LiveMonacoEditor({
  themeConfig,
  height = '220px',
  value,
  onChange,
  onMount,
  language = 'typescript',
  options = {},
}: {
  themeConfig: ThemeConfig;
  height?: string;
  language?: 'typescript' | 'json';
  value?: string;
  onChange?: (value: string | undefined) => void;
  onMount?: EditorProps['onMount'];
  options?: Record<string, unknown>;
}) {
  // Each editor needs its own model; a `.tsx` URI lets TypeScript parse JSX.
  const extension = language === 'json' ? 'json' : 'tsx';
  const modelPath = `file:///editor-${useId().replace(/[^a-zA-Z0-9]/g, '')}.${extension}`;
  const monacoRef = useRef<MonacoInstance | null>(null);

  useEffect(
    () => () => {
      if (monacoRef.current) releaseDemoTypescriptDefaults(monacoRef.current);
      monacoRef.current = null;
    },
    []
  );

  return (
    <MonacoEditor
      height={height}
      path={modelPath}
      defaultLanguage={language}
      // Controlled only when the caller tracks edits; static samples stay uncontrolled so a
      // constant value can't be reconciled over what the user typed.
      {...(onChange ? { value: value ?? '' } : { defaultValue: value ?? monacoSample })}
      theme={themeConfig.monacoThemeName}
      beforeMount={(monaco) => {
        registerAllMonacoThemes(monaco);
        if (!monacoRef.current) {
          monacoRef.current = monaco;
          acquireDemoTypescriptDefaults(monaco);
        }
      }}
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

// ============================================================================
// Storybook theme sync
// ============================================================================

const futureDarkConfig = editorThemeConfigs[0];

function getStorybookThemeConfig(): ThemeConfig {
  const keys = editorThemeConfigs.map((c) => c.key);
  const found = Array.from(document.body.classList).find((c) =>
    keys.includes(c as ThemeConfig['key'])
  );
  return editorThemeConfigs.find((c) => c.key === found) ?? futureDarkConfig;
}

export function useEditorThemeConfig(): ThemeConfig {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getStorybookThemeConfig);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeConfig(getStorybookThemeConfig()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return themeConfig;
}
