import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash.js';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp.js';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css.js';
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff.js';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go.js';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java.js';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript.js';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json.js';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx.js';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown.js';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup.js';
import powershell from 'react-syntax-highlighter/dist/esm/languages/prism/powershell.js';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python.js';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql.js';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx.js';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript.js';
import vbnet from 'react-syntax-highlighter/dist/esm/languages/prism/vbnet.js';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml.js';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib';
import { copyTextToClipboard } from '@/lib/clipboard';

/**
 * A read-only, highlighted code sample for chat transcripts and docs. Highlighting is Prism via
 * the light build of react-syntax-highlighter (the same engine as the Material chat), with only
 * the languages below registered to keep the bundle small. For editable code use Monaco or
 * CodeMirror with the Apollo editor themes instead.
 */

// Deep imports carry `.js` so Node's ESM resolver (SSR, consumer test runners) can load them.
// C#, VB.NET and PowerShell cover UiPath workflow and Coded Automation snippets.
const LANGUAGES = {
  bash,
  csharp,
  css,
  diff,
  go,
  java,
  javascript,
  json,
  jsx,
  markdown,
  markup,
  powershell,
  python,
  sql,
  tsx,
  typescript,
  vbnet,
  yaml,
} as const;

type CodeBlockLanguage = keyof typeof LANGUAGES;

for (const [name, grammar] of Object.entries(LANGUAGES)) {
  SyntaxHighlighter.registerLanguage(name, grammar);
}

const LANGUAGE_ALIASES: Record<string, CodeBlockLanguage> = {
  'c#': 'csharp',
  cjs: 'javascript',
  cs: 'csharp',
  golang: 'go',
  htm: 'markup',
  html: 'markup',
  js: 'javascript',
  md: 'markdown',
  mjs: 'javascript',
  patch: 'diff',
  ps: 'powershell',
  ps1: 'powershell',
  pwsh: 'powershell',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  svg: 'markup',
  ts: 'typescript',
  vb: 'vbnet',
  'vb.net': 'vbnet',
  xml: 'markup',
  yml: 'yaml',
  zsh: 'bash',
};

function resolveLanguage(language: string | undefined): CodeBlockLanguage | undefined {
  const key = language?.trim().toLowerCase();
  if (!key) return undefined;
  const name = LANGUAGE_ALIASES[key] ?? key;
  return name in LANGUAGES ? (name as CodeBlockLanguage) : undefined;
}

/** Wraps a token color with a fallback for themes that do not define the `--code-*` set. */
const token = (name: string) => `var(--code-${name}, var(--foreground))`;

/**
 * Prism token styles on the apollo-wind `--code-*` variables, so light, dark and high-contrast
 * follow the theme class instead of a shipped Prism palette. Mirrors the CodeMirror mapping in
 * `editor-themes`: keywords and properties share `key`, booleans and types share `literal`.
 */
const codeBlockTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: token('rest'),
    background: 'none',
    fontFamily: 'var(--font-mono)',
    textAlign: 'left',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: token('rest'),
    background: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8125rem',
    lineHeight: 1.6,
    margin: 0,
    padding: '0.75rem 1rem',
    overflow: 'auto',
    tabSize: 2,
  },
  comment: { color: 'var(--foreground-muted)', fontStyle: 'italic' },
  prolog: { color: 'var(--foreground-muted)', fontStyle: 'italic' },
  doctype: { color: 'var(--foreground-muted)' },
  cdata: { color: 'var(--foreground-muted)' },
  punctuation: { color: token('punctuation') },
  operator: { color: token('key') },
  keyword: { color: token('key') },
  atrule: { color: token('key') },
  tag: { color: token('key') },
  property: { color: token('key') },
  'attr-name': { color: token('key') },
  selector: { color: token('key') },
  string: { color: token('string') },
  char: { color: token('string') },
  'attr-value': { color: token('string') },
  'template-string': { color: token('string') },
  regex: { color: token('string') },
  url: { color: token('string') },
  inserted: { color: token('string') },
  number: { color: token('number') },
  unit: { color: token('number') },
  boolean: { color: token('literal') },
  constant: { color: token('literal') },
  symbol: { color: token('literal') },
  builtin: { color: token('literal') },
  'class-name': { color: token('literal') },
  function: { color: token('literal') },
  entity: { color: token('literal') },
  deleted: { color: 'var(--error, var(--destructive))' },
  important: { fontWeight: 600 },
  bold: { fontWeight: 600 },
  italic: { fontStyle: 'italic' },
};

const lineNumberStyle: React.CSSProperties = {
  minWidth: '2.25em',
  paddingRight: '1em',
  color: 'var(--foreground-subtle)',
  textAlign: 'right',
  userSelect: 'none',
};

export interface CodeBlockStrings {
  /** Label of the copy button. */
  copy: string;
  /** Tooltip and status announcement right after a successful copy. */
  copied: string;
  /** Header label when no `language` is given. */
  plainText: string;
}

export const DEFAULT_CODE_BLOCK_STRINGS: CodeBlockStrings = {
  copy: 'Copy code',
  copied: 'Copied',
  plainText: 'Text',
};

const COPIED_RESET_MS = 2000;

export interface CodeBlockHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The source the copy button writes to the clipboard. */
  code: string;
  /** Shown as the label. Falls back to `strings.plainText`. */
  language?: string;
  strings?: Partial<CodeBlockStrings>;
}

/** The label row with the copy button. Extra actions passed as `children` sit before the copy. */
const CodeBlockHeader = React.forwardRef<HTMLDivElement, CodeBlockHeaderProps>(
  ({ code, language, strings, className, children, ...props }, ref) => {
    const text = { ...DEFAULT_CODE_BLOCK_STRINGS, ...strings };
    const [copied, setCopied] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    React.useEffect(() => () => clearTimeout(timer.current), []);

    const handleCopy = async () => {
      if (!(await copyTextToClipboard(code))) return;
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    };

    return (
      <div
        ref={ref}
        data-slot="code-block-header"
        className={cn(
          'flex items-center justify-between gap-2 border-b border-border-subtle py-1 pr-1 pl-4',
          className
        )}
        {...props}
      >
        <span
          data-slot="code-block-language"
          className="min-w-0 truncate text-xs font-medium text-muted-foreground"
        >
          {language?.trim() || text.plainText}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {children}
          <Button
            data-slot="code-block-copy"
            data-copied={copied || undefined}
            variant="ghost"
            size="2xs"
            icon
            // The name stays fixed: the status below announces the copy, so it is not read twice.
            aria-label={text.copy}
            title={copied ? text.copied : text.copy}
            onClick={handleCopy}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </Button>
          <output className="sr-only">{copied ? text.copied : ''}</output>
        </div>
      </div>
    );
  }
);
CodeBlockHeader.displayName = 'CodeBlockHeader';

interface CodeBlockBodyProps {
  code: string;
  language: CodeBlockLanguage | undefined;
  wrap: boolean;
  showLineNumbers: boolean;
}

// Memoised so a streaming Markdown parent only re-highlights the block whose code changed.
const CodeBlockBody = React.memo(function CodeBlockBody({
  code,
  language,
  wrap,
  showLineNumbers,
}: CodeBlockBodyProps) {
  return (
    <SyntaxHighlighter
      language={language ?? 'text'}
      style={codeBlockTheme}
      wrapLongLines={wrap}
      showLineNumbers={showLineNumbers}
      lineNumberStyle={lineNumberStyle}
      data-slot="code-block-body"
      data-wrap={wrap}
      // A horizontally scrolling region needs to be reachable by keyboard.
      tabIndex={wrap ? undefined : 0}
      className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      {code}
    </SyntaxHighlighter>
  );
});

export interface CodeBlockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The source to show. A single trailing newline is dropped. */
  code: string;
  /**
   * Prism language name or common alias (`ts`, `js`, `sh`, `py`, `yml`, `html`, ...). Unknown or
   * missing languages render as plain text; the header still shows what was passed.
   */
  language?: string;
  /** Wrap long lines instead of scrolling horizontally. */
  wrap?: boolean;
  showLineNumbers?: boolean;
  /** Hide the label and copy row, e.g. for a one-line snippet. */
  hideHeader?: boolean;
  /** Extra header actions, such as preview or expand, placed before the copy button. */
  actions?: React.ReactNode;
  strings?: Partial<CodeBlockStrings>;
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      code,
      language,
      wrap = false,
      showLineNumbers = false,
      hideHeader = false,
      actions,
      strings,
      className,
      ...props
    },
    ref
  ) => {
    const source = code.replace(/\n$/, '');
    const resolved = resolveLanguage(language);
    return (
      <div
        ref={ref}
        data-slot="code-block"
        data-language={resolved ?? 'text'}
        className={cn(
          'min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-surface-overlay text-foreground',
          className
        )}
        {...props}
      >
        {!hideHeader && (
          <CodeBlockHeader code={source} language={language} strings={strings}>
            {actions}
          </CodeBlockHeader>
        )}
        <CodeBlockBody
          code={source}
          language={resolved}
          wrap={wrap}
          showLineNumbers={showLineNumbers}
        />
      </div>
    );
  }
);
CodeBlock.displayName = 'CodeBlock';

export { CodeBlock, CodeBlockHeader };
