import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CodeBlockTheme } from './code-block';
import { CodeBlock } from './code-block';
import {
  apolloFutureDarkCodeMirror,
  apolloFutureDarkMonaco,
  apolloFutureLightCodeMirror,
  apolloFutureLightMonaco,
} from '../../editor-themes';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Components/Core/Code Block',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    language: {
      control: 'select',
      options: [
        'tsx',
        'typescript',
        'javascript',
        'json',
        'css',
        'html',
        'python',
        'bash',
        'sql',
        'yaml',
        'markdown',
      ],
    },
    theme: {
      control: 'select',
      options: [
        'dark',
        'light',
        'dark-hc',
        'light-hc',
        'future-dark',
        'future-light',
        'wireframe',
        'vertex',
        'canvas',
      ],
    },
    showLineNumbers: { control: 'boolean' },
    showCopyButton: { control: 'boolean' },
    wrapLines: { control: 'boolean' },
    fileName: { control: 'text' },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Sample code snippets
// ============================================================================

const tsxSample = `
import { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export function UserCard({ user }: { user: User }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{user.name}</h3>
      {isExpanded && (
        <p className="text-sm text-muted-foreground">{user.email}</p>
      )}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}
`.trim();

const jsSample = `
async function fetchUsers(page = 1, limit = 10) {
  const url = new URL('/api/users', window.location.origin);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(\`HTTP error — status: \${response.status}\`);
  }

  const { users, total } = await response.json();
  return { users, total, page, limit };
}
`.trim();

const jsonSample = `
{
  "name": "@uipath/apollo-wind",
  "version": "0.10.0",
  "description": "UiPath Apollo — Tailwind CSS design system",
  "dependencies": {
    "react": ">=18.0.0",
    "tailwindcss": "^4.1.0",
    "class-variance-authority": "^0.7.1",
    "lucide-react": "^0.555.0"
  },
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "rslib build"
  }
}
`.trim();

const cssSample = `
/* Apollo Wind — design token utilities */
@layer base {
  :root {
    --radius: 0.75rem;
    --color-background: var(--color-background);
    --color-foreground: var(--color-foreground);
  }

  * {
    border-color: var(--color-border-de-emp);
    box-sizing: border-box;
  }

  body {
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
  }
}
`.trim();

const pythonSample = `
from typing import Generator

def fibonacci(n: int) -> Generator[int, None, None]:
    """Yield the first n Fibonacci numbers."""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

result = list(fibonacci(10))
print(result)  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
`.trim();

const bashSample = `
#!/bin/bash
# Bootstrap the Apollo UI monorepo

set -e

echo "Installing dependencies..."
pnpm install

echo "Building packages..."
pnpm turbo build --filter=@uipath/apollo-core
pnpm turbo build --filter=@uipath/apollo-wind

echo "Starting Storybook..."
pnpm --filter @uipath/apollo-wind storybook
`.trim();

const sqlSample = `
SELECT
  u.id,
  u.name,
  COUNT(o.id)   AS order_count,
  SUM(o.total)  AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE
  u.created_at >= '2024-01-01'
  AND u.status = 'active'
GROUP BY u.id, u.name
HAVING SUM(o.total) > 500
ORDER BY total_spent DESC
LIMIT 10;
`.trim();

const htmlSample = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Apollo Wind</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="dark">
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
`.trim();

const longSample = `
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SortDirection = 'asc' | 'desc';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
}: TableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset to page 1 whenever the query or sort changes
  useEffect(() => {
    setPage(1);
  }, [query, sortKey, sortDir]);

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
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = Math.ceil(sorted.length / pageSize);

  const handleSort = useCallback(
    (key: keyof T) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  return (
    <div className="flex flex-col gap-4">
      {searchable && (
        <input
          ref={inputRef}
          className="rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-2 text-left font-medium text-foreground-subtle"
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.header}
                {col.sortable && sortKey === col.key && (
                  <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.map((row) => (
            <tr key={row.id} className="border-b border-border hover:bg-background-hover">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-subtle">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`.trim();

// ============================================================================
// Default — no `theme` prop: auto-follows the Apollo page theme
// ============================================================================

export const Default: Story = {
  args: {
    children: tsxSample,
    language: 'tsx',
    showLineNumbers: true,
    showCopyButton: true,
  },
};

// ============================================================================
// With File Name
// ============================================================================

export const WithFileName: Story = {
  name: 'With File Name',
  args: {
    children: tsxSample,
    language: 'tsx',
    fileName: 'UserCard.tsx',
    showLineNumbers: true,
    showCopyButton: true,
  },
};

// ============================================================================
// No Line Numbers
// ============================================================================

export const NoLineNumbers: Story = {
  name: 'No Line Numbers',
  args: {
    children: jsSample,
    language: 'javascript',
    showLineNumbers: false,
    showCopyButton: true,
  },
};

// ============================================================================
// No Copy Button
// ============================================================================

export const NoCopyButton: Story = {
  name: 'No Copy Button',
  args: {
    children: jsonSample,
    language: 'json',
    showLineNumbers: true,
    showCopyButton: false,
  },
};

// ============================================================================
// Wrap Long Lines
// ============================================================================

export const WrapLongLines: Story = {
  name: 'Wrap Long Lines',
  args: {
    children: `const result = await someVeryLongFunctionName({ parameterOne: 'value', parameterTwo: 42, parameterThree: true, parameterFour: 'another long value that pushes the line past the viewport width' });`,
    language: 'javascript',
    showLineNumbers: false,
    wrapLines: true,
  },
};

// ============================================================================
// Languages
// ============================================================================

export const Languages = {
  name: 'Languages',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          TypeScript / TSX
        </p>
        <CodeBlock language="tsx" showLineNumbers={false}>
          {tsxSample.split('\n').slice(0, 8).join('\n')}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          JavaScript
        </p>
        <CodeBlock language="javascript" showLineNumbers={false}>
          {jsSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          JSON
        </p>
        <CodeBlock language="json" showLineNumbers={false}>
          {jsonSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          CSS
        </p>
        <CodeBlock language="css" showLineNumbers={false}>
          {cssSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          Python
        </p>
        <CodeBlock language="python" showLineNumbers={false}>
          {pythonSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          Bash
        </p>
        <CodeBlock language="bash" showLineNumbers={false}>
          {bashSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          SQL
        </p>
        <CodeBlock language="sql" showLineNumbers={false}>
          {sqlSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
          HTML
        </p>
        <CodeBlock language="html" showLineNumbers={false}>
          {htmlSample}
        </CodeBlock>
      </div>
    </div>
  ),
};

// ============================================================================
// Long Code
// ============================================================================

export const LongCode: Story = {
  name: 'Long Code',
  args: {
    children: longSample,
    language: 'tsx',
    fileName: 'DataTable.tsx',
    showLineNumbers: true,
    showCopyButton: true,
  },
};

// ============================================================================
// All Themes
// ============================================================================

const THEME_LABELS: Record<CodeBlockTheme, string> = {
  // Standard
  dark: 'Dark',
  light: 'Light',
  'dark-hc': 'High Contrast Dark',
  'light-hc': 'High Contrast Light',
  // Future design language
  'future-dark': 'Future: Dark',
  'future-light': 'Future: Light',
  wireframe: 'Wireframe',
  vertex: 'Vertex',
  canvas: 'Canvas',
};

const preview = `
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
`.trim();

export const AllThemes = {
  name: 'All Themes',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      {(Object.keys(THEME_LABELS) as CodeBlockTheme[]).map((t) => (
        <div key={t}>
          <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">
            {THEME_LABELS[t]}
          </p>
          <CodeBlock language="tsx" fileName="Counter.tsx" theme={t} showLineNumbers={false}>
            {preview}
          </CodeBlock>
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Code Editors — display vs editing, orchestrator pattern, theme adapters
// ============================================================================

const monacoUsageDark = `import { apolloFutureDarkMonaco } from '@uipath/apollo-wind/editor-themes';
import * as monaco from 'monaco-editor';

// Register once at app startup
monaco.editor.defineTheme('apollo-future-dark', apolloFutureDarkMonaco);
monaco.editor.defineTheme('apollo-future-light', apolloFutureLightMonaco);

// Use in any editor instance
monaco.editor.create(containerEl, {
  theme: 'apollo-future-dark',
  language: 'typescript',
});`.trim();

const codemirrorUsageDark = `import { EditorView } from '@codemirror/view';
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
  '.cm-activeLineGutter': { color: ui.lineNumberActive },
  '.cm-matchingBracket': { outline: \`1px solid \${ui.matchingBracket}\` },
}, { dark: true });

const highlight = HighlightStyle.define([
  { tag: t.comment,                            color: syntax.comment, fontStyle: 'italic' },
  { tag: t.punctuation,                        color: syntax.punctuation },
  { tag: [t.keyword, t.operator],              color: syntax.keyword },
  { tag: [t.string, t.regexp],                 color: syntax.string },
  { tag: [t.number, t.integer],                color: syntax.number },
  { tag: [t.bool, t.null, t.className, t.typeName], color: syntax.literal },
  { tag: [t.propertyName, t.attributeName],    color: syntax.keyword },
  { tag: t.meta,                               color: syntax.meta },
  { tag: t.name,                               color: syntax.rest },
]);

export const apolloFutureDark = [theme, syntaxHighlighting(highlight)];`.trim();

const decisionRows = [
  {
    useCase: 'Show a code snippet or usage example',
    solution: 'CodeBlock',
    pkg: '@uipath/apollo-wind',
    notes: 'Read-only. No cursor or input.',
  },
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

export const CodeEditors = {
  name: 'Code Editors',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="future-dark min-h-screen w-full bg-background text-foreground">
      {/* ── Header ── */}
      <div className="mx-auto max-w-4xl px-8 pt-8">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Code in Apollo</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Apollo provides two distinct solutions depending on whether the user is{' '}
          <strong className="text-foreground">reading</strong> code or{' '}
          <strong className="text-foreground">writing</strong> it. Using the wrong tool introduces
          unnecessary weight or missing capabilities — the table below clarifies when to reach for
          each.
        </p>
        <div className="mb-8 h-px bg-border" />
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-8">
        {/* ── Decision table ── */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">When to use what</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Choose based on whether the user needs to read or write, and on the complexity of the
          editing task.
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

        {/* ── Orchestrator pattern ── */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          The orchestrator pattern
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          When building an expression or script field, use a single{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            CodeEditorField
          </code>{' '}
          component that picks the right editor internally. This keeps the decision out of feature
          code and makes it easy to change later.
        </p>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Single-line + literal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Mode is{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">literal</code> and
              line count is 1 → use{' '}
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Expression mode</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Mode is{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">expression</code>{' '}
              → use{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                MonacoEditor
              </code>
              . Full IntelliSense, type checking, and diagnostics for JS/TS expressions.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Multi-line</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Any mode where line count exceeds 1 → escalate to{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-primary">
                MonacoEditor
              </code>{' '}
              regardless of mode. Prevents CodeMirror from being used for complex scripts.
            </p>
          </div>
        </div>

        <div className="mb-8 h-px bg-border" />

        {/* ── Monaco theme adapter ── */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Monaco theme adapter
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Import{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            apolloFutureDarkMonaco
          </code>{' '}
          or{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            apolloFutureLightMonaco
          </code>{' '}
          from{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            @uipath/apollo-wind/editor-themes
          </code>
          . Each is a plain{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            IStandaloneThemeData
          </code>{' '}
          object — no Apollo runtime needed at the call site.
        </p>

        <div className="mb-3 grid grid-cols-4 gap-3 text-xs">
          {[
            {
              label: 'Keywords',
              color: apolloFutureDarkMonaco.colors['editor.foreground'],
              swatch: '#22d3ee',
              text: 'cyan-400',
            },
            { label: 'Strings', color: '#34d399', swatch: '#34d399', text: 'emerald-400' },
            { label: 'Numbers', color: '#fbbf24', swatch: '#fbbf24', text: 'amber-400' },
            { label: 'Literals', color: '#a78bfa', swatch: '#a78bfa', text: 'violet-400' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.swatch }}
              />
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <CodeBlock
          language="typescript"
          fileName="setup.ts"
          theme="future-dark"
          showLineNumbers={false}
          className="mb-8"
        >
          {monacoUsageDark}
        </CodeBlock>

        <div className="mb-8 h-px bg-border" />

        {/* ── CodeMirror theme adapter ── */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          CodeMirror theme adapter
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Import{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            apolloFutureDarkCodeMirror
          </code>{' '}
          or{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            apolloFutureLightCodeMirror
          </code>
          . Each object exposes{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">syntax</code> and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">ui</code> token
          groups that map directly to{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            HighlightStyle
          </code>{' '}
          and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">
            EditorView.theme
          </code>
          .
        </p>

        <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 font-semibold text-foreground">syntax tokens</p>
            <div className="grid grid-cols-3 gap-y-1.5">
              {Object.entries(apolloFutureDarkCodeMirror.syntax).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <code className="text-muted-foreground">{key}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 font-semibold text-foreground">ui tokens</p>
            <div className="grid grid-cols-2 gap-y-1.5">
              {Object.entries(apolloFutureDarkCodeMirror.ui).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-border/50"
                    style={{ backgroundColor: color }}
                  />
                  <code className="text-muted-foreground">{key}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          fileName="codemirror-theme.ts"
          theme="future-dark"
          showLineNumbers={false}
        >
          {codemirrorUsageDark}
        </CodeBlock>
      </div>
    </div>
  ),
};
