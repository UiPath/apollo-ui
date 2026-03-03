import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CodeBlockTheme } from './code-block';
import { CodeBlock } from './code-block';

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
      options: ['tsx', 'typescript', 'javascript', 'json', 'css', 'html', 'python', 'bash', 'sql', 'yaml', 'markdown'],
    },
    theme: {
      control: 'select',
      options: [
        'dark',
        'light',
        'future-dark',
        'future-light',
        'wireframe',
        'vertex',
        'canvas',
        'dark-hc',
        'light-hc',
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
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">TypeScript / TSX</p>
        <CodeBlock language="tsx" showLineNumbers={false}>
          {tsxSample.split('\n').slice(0, 8).join('\n')}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">JavaScript</p>
        <CodeBlock language="javascript" showLineNumbers={false}>
          {jsSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">JSON</p>
        <CodeBlock language="json" showLineNumbers={false}>
          {jsonSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">CSS</p>
        <CodeBlock language="css" showLineNumbers={false}>
          {cssSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">Python</p>
        <CodeBlock language="python" showLineNumbers={false}>
          {pythonSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">Bash</p>
        <CodeBlock language="bash" showLineNumbers={false}>
          {bashSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">SQL</p>
        <CodeBlock language="sql" showLineNumbers={false}>
          {sqlSample}
        </CodeBlock>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-subtle mb-2 uppercase tracking-wide">HTML</p>
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
    <button onClick={() => setCount(count + 1)}>
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
