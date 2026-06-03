import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  atomDark,
  nightOwl,
  nord,
  oneDark,
  oneLight,
  prism,
  vs,
} from 'react-syntax-highlighter/dist/esm/styles/prism/index.js';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

/**
 * All Apollo theme variants supported by CodeBlock.
 *
 * Standard (apollo-core):
 * - `'dark'` / `'light'`               — Default dark / light
 * - `'dark-hc'` / `'light-hc'`         — High contrast variants
 *
 * Future / Demo themes:
 * - `'future-dark'` / `'future-light'`  — Future zinc palette, cyan brand
 * - `'wireframe'`                        — Greyscale / prototyping
 * - `'vertex'`                           — Deep blue-grey, teal brand
 * - `'canvas'`                           — Apollo MUI dark, orange brand
 *
 * When no theme is passed the component auto-detects from the Apollo
 * `<body>` class and switches live when the theme changes.
 */
export type CodeBlockTheme =
  | 'dark'
  | 'light'
  | 'dark-hc'
  | 'light-hc'
  | 'future-dark'
  | 'future-light'
  | 'wireframe'
  | 'vertex'
  | 'canvas';

export interface CodeBlockProps {
  /** The code string to display */
  children: string;
  /** Programming language for syntax highlighting (e.g. 'tsx', 'python', 'sql') */
  language?: string;
  /** Show line numbers on the left */
  showLineNumbers?: boolean;
  /** Show copy-to-clipboard button in the header */
  showCopyButton?: boolean;
  /** Optional file name displayed in the header */
  fileName?: string;
  /**
   * Color scheme. When omitted the component auto-follows the active Apollo
   * page theme by watching the class on `<body>` — switches live.
   */
  theme?: CodeBlockTheme;
  /** Wrap long lines instead of scrolling horizontally */
  wrapLines?: boolean;
  className?: string;
}

// ============================================================================
// Apollo Future Prism themes
// Colors from the --code-* token spec in foundation/Future/colors.stories.tsx
// ============================================================================

// future-dark: zinc palette backgrounds, cyan keywords, emerald strings,
// amber numbers, violet literals — matching the Apollo Future dark token spec.
const apolloFutureDark = {
  'code[class*="language-"]': { color: '#a1a1aa', background: 'none', fontSize: '1em' }, // zinc-400  --code-rest
  'pre[class*="language-"]': { color: '#a1a1aa', background: 'none', fontSize: '1em' },
  comment: { color: '#52525b' }, // zinc-600  — muted below rest
  prolog: { color: '#52525b' },
  cdata: { color: '#52525b' },
  punctuation: { color: '#71717a' }, // zinc-500  --code-punctuation
  '.namespace': { opacity: '0.7' },
  property: { color: '#22d3ee' }, // cyan-400  --code-key
  tag: { color: '#22d3ee' },
  'attr-name': { color: '#22d3ee' },
  keyword: { color: '#22d3ee' },
  'keyword.module': { color: '#22d3ee' },
  'keyword.control-flow': { color: '#22d3ee' },
  atrule: { color: '#22d3ee' },
  'atrule.rule': { color: '#22d3ee' },
  function: { color: '#22d3ee' },
  'function.maybe-class-name': { color: '#22d3ee' },
  builtin: { color: '#22d3ee' },
  'class-name': { color: '#a78bfa' }, // violet-400  --code-literal
  'maybe-class-name': { color: '#a78bfa' },
  'imports.maybe-class-name': { color: '#a78bfa' },
  'exports.maybe-class-name': { color: '#a78bfa' },
  boolean: { color: '#a78bfa' },
  constant: { color: '#a78bfa' },
  symbol: { color: '#a78bfa' },
  regex: { color: '#a78bfa' },
  string: { color: '#34d399' }, // emerald-400  --code-string
  'attr-value': { color: '#34d399' },
  char: { color: '#34d399' },
  selector: { color: '#34d399' },
  inserted: { color: '#34d399' },
  number: { color: '#fbbf24' }, // amber-400  --code-number
  unit: { color: '#fbbf24' },
  operator: { color: '#71717a' }, // zinc-500  --code-punctuation
  'operator.arrow': { color: '#71717a' },
  'punctuation.interpolation-punctuation': { color: '#71717a' },
  entity: { color: '#a1a1aa', cursor: 'help' },
  variable: { color: '#a1a1aa' }, // zinc-400  --code-rest
  parameter: { color: '#a1a1aa' },
  console: { color: '#a1a1aa' },
  deleted: { color: '#ff6467' }, // red-400 — visual diff only
  important: { color: '#fbbf24', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

// future-light: same semantic mapping on the lighter zinc palette.
const apolloFutureLight = {
  'code[class*="language-"]': { color: '#52525b', background: 'none', fontSize: '1em' }, // zinc-600  --code-rest
  'pre[class*="language-"]': { color: '#52525b', background: 'none', fontSize: '1em' },
  comment: { color: '#a1a1aa' }, // zinc-400  — muted above rest
  prolog: { color: '#a1a1aa' },
  cdata: { color: '#a1a1aa' },
  punctuation: { color: '#71717a' }, // zinc-500  --code-punctuation
  '.namespace': { opacity: '0.7' },
  property: { color: '#0e7490' }, // cyan-700  --code-key
  tag: { color: '#0e7490' },
  'attr-name': { color: '#0e7490' },
  keyword: { color: '#0e7490' },
  'keyword.module': { color: '#0e7490' },
  'keyword.control-flow': { color: '#0e7490' },
  atrule: { color: '#0e7490' },
  'atrule.rule': { color: '#0e7490' },
  function: { color: '#0e7490' },
  'function.maybe-class-name': { color: '#0e7490' },
  builtin: { color: '#0e7490' },
  'class-name': { color: '#7c3aed' }, // violet-600  --code-literal
  'maybe-class-name': { color: '#7c3aed' },
  'imports.maybe-class-name': { color: '#7c3aed' },
  'exports.maybe-class-name': { color: '#7c3aed' },
  boolean: { color: '#7c3aed' },
  constant: { color: '#7c3aed' },
  symbol: { color: '#7c3aed' },
  regex: { color: '#7c3aed' },
  string: { color: '#047857' }, // emerald-700  --code-string
  'attr-value': { color: '#047857' },
  char: { color: '#047857' },
  selector: { color: '#047857' },
  inserted: { color: '#047857' },
  number: { color: '#b45309' }, // amber-700  --code-number
  unit: { color: '#b45309' },
  operator: { color: '#71717a' }, // zinc-500  --code-punctuation
  'operator.arrow': { color: '#71717a' },
  'punctuation.interpolation-punctuation': { color: '#71717a' },
  entity: { color: '#52525b', cursor: 'help' },
  variable: { color: '#52525b' }, // zinc-600  --code-rest
  parameter: { color: '#52525b' },
  console: { color: '#52525b' },
  deleted: { color: '#c10007' }, // red-700 — visual diff only
  important: { color: '#b45309', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

// ============================================================================
// Per-theme configuration
// ============================================================================

interface ThemeConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismStyle: Record<string, any>;
  bg: string;
  headerBg: string;
  labelColor: string;
  iconColor: string;
  lineNumberColor: string;
}

const THEME_CONFIG: Record<CodeBlockTheme, ThemeConfig> = {
  // ── Dark — Nord for the apollo-core blue-grey palette ────────────────────
  dark: {
    prismStyle: nord,
    bg: '#182027',
    headerBg: '#111920',
    labelColor: '#8ea1b1',
    iconColor: '#6b8899',
    lineNumberColor: '#2e3f4c',
  },
  // ── Light — VS Code Light on a clean white surface ───────────────────────
  light: {
    prismStyle: vs,
    bg: '#ffffff',
    headerBg: '#f0f4f8',
    labelColor: '#374151',
    iconColor: '#6b7280',
    lineNumberColor: '#c8d4de',
  },
  // ── Future dark — Apollo Future token spec (zinc palette, cyan/emerald/amber/violet) ──
  'future-dark': {
    prismStyle: apolloFutureDark,
    bg: '#18181b', // zinc-900  surface-raised
    headerBg: '#09090b', // zinc-950  surface — one step deeper than body
    labelColor: '#a1a1aa', // zinc-400  --code-rest / foreground-muted
    iconColor: '#71717a', // zinc-500  foreground-subtle
    lineNumberColor: '#52525b', // zinc-600  matches comment colour — most muted code text
  },
  // ── Future light — Apollo Future token spec (zinc palette, cyan/emerald/amber/violet) ──
  'future-light': {
    prismStyle: apolloFutureLight,
    bg: '#f4f4f5', // zinc-100  surface-raised
    headerBg: '#e4e4e7', // zinc-200  surface-overlay — one step deeper than body
    labelColor: '#71717a', // zinc-500  foreground-muted
    iconColor: '#a1a1aa', // zinc-400  foreground-subtle
    lineNumberColor: '#a1a1aa', // zinc-400  matches comment colour — most muted code text
  },
  // ── Wireframe — classic Prism on grey-50, minimal ────────────────────────
  wireframe: {
    prismStyle: prism,
    bg: '#f9fafb',
    headerBg: '#f3f4f6',
    labelColor: '#6b7280',
    iconColor: '#9ca3af',
    lineNumberColor: '#d1d5db',
  },
  // ── Vertex — Night Owl on deep oklch blue-grey, teal brand ───────────────
  vertex: {
    prismStyle: nightOwl,
    bg: 'oklch(0.21 0.03 258.5)',
    headerBg: 'oklch(0.188 0.028 258.5)',
    labelColor: '#a6b5c9',
    iconColor: '#7a90a8',
    lineNumberColor: 'oklch(0.32 0.03 258.5)',
  },
  // ── Canvas — Atom Dark for Apollo MUI dark, UiPath orange brand ──────────
  canvas: {
    prismStyle: atomDark,
    bg: '#182027',
    headerBg: '#111920',
    labelColor: '#8ea1b1',
    iconColor: '#6b8899',
    lineNumberColor: '#2e3f4c',
  },
  // ── High-contrast dark ───────────────────────────────────────────────────
  'dark-hc': {
    prismStyle: oneDark,
    bg: '#0a0a0a',
    headerBg: '#141414',
    labelColor: '#e4e4e4',
    iconColor: '#c8c8c8',
    lineNumberColor: '#505050',
  },
  // ── High-contrast light ──────────────────────────────────────────────────
  'light-hc': {
    prismStyle: oneLight,
    bg: '#ffffff',
    headerBg: '#e8e8e8',
    labelColor: '#111827',
    iconColor: '#374151',
    lineNumberColor: '#9ca3af',
  },
};

// Themes that have CSS custom-property scoping via a class name on the element.
// When an explicit `theme` prop is passed we wrap the component in a div carrying
// that class so that `future:` Tailwind variants and CSS vars resolve correctly
// regardless of the page's global theme.
const THEME_SCOPE_CLASS: Partial<Record<CodeBlockTheme, string>> = {
  'future-dark': 'future-dark',
  'future-light': 'future-light',
};

// ============================================================================
// Auto-detect Apollo theme from <body> class
// ============================================================================

// Check more specific / longer class names before short ones to avoid
// a class like "dark" matching inside "future-dark"
const BODY_CLASS_PRIORITY: CodeBlockTheme[] = [
  'future-dark',
  'future-light',
  'dark-hc',
  'light-hc',
  'dark',
  'light',
  'wireframe',
  'vertex',
  'canvas',
];

function getBodyTheme(): CodeBlockTheme {
  if (typeof document === 'undefined') return 'dark';
  const bodyClasses = document.body.classList;
  const htmlClasses = document.documentElement.classList;
  return (
    BODY_CLASS_PRIORITY.find((t) => bodyClasses.contains(t) || htmlClasses.contains(t)) ??
    'future-dark'
  );
}

function useApolloTheme(): CodeBlockTheme {
  const [theme, setTheme] = useState<CodeBlockTheme>(getBodyTheme);

  useEffect(() => {
    if (typeof document === 'undefined') {
      // In non-browser environments (e.g. SSR), skip observing
      return;
    }

    const observer = new MutationObserver(() => setTheme(getBodyTheme()));

    // Observe both body and documentElement to catch theme changes on either
    const targets: (HTMLElement | null)[] = [document.body, document.documentElement];

    targets.forEach((target) => {
      if (target) {
        observer.observe(target, { attributes: true, attributeFilter: ['class'] });
      }
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

// ============================================================================
// CodeBlock
// ============================================================================

/**
 * Syntax-highlighted code block built on react-syntax-highlighter (Prism engine).
 *
 * Supports 200+ languages, optional line numbers, a filename header, and a
 * one-click copy button. Automatically follows the active Apollo theme by
 * watching the body class — or accept an explicit `theme` prop to override.
 *
 * Supported themes: dark, light, dark-hc, light-hc, future-dark,
 * future-light, wireframe, vertex, canvas.
 */
export function CodeBlock({
  children,
  language = 'tsx',
  showLineNumbers = true,
  showCopyButton = true,
  fileName,
  theme,
  wrapLines = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectedTheme = useApolloTheme();
  const activeTheme = theme ?? detectedTheme;
  const config = THEME_CONFIG[activeTheme];

  const code = children.trim();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available — silent fail
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showHeader = !!(fileName || language || showCopyButton);

  // When an explicit future theme is passed, wrap in its scope class so that
  // `future:` Tailwind variants and CSS custom properties resolve correctly
  // regardless of the page's global theme.
  const scopeClass = theme ? THEME_SCOPE_CLASS[theme] : undefined;

  const block = (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border future:border-border-subtle font-mono text-sm',
        className
      )}
      style={{ background: config.bg }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      {showHeader && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-border future:border-border-subtle"
          style={{ background: config.headerBg }}
        >
          <span className="text-xs font-medium" style={{ color: config.labelColor }}>
            {fileName ?? language}
          </span>

          {showCopyButton && (
            <Button
              icon
              variant="ghost"
              size="2xs"
              style={{ color: config.iconColor }}
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          )}
        </div>
      )}

      {/* ── Code ───────────────────────────────────────────────── */}
      <SyntaxHighlighter
        language={language}
        style={config.prismStyle}
        showLineNumbers={showLineNumbers}
        wrapLines={wrapLines}
        wrapLongLines={wrapLines}
        customStyle={{
          margin: 0,
          border: 'none',
          borderRadius: 0,
          background: 'transparent',
          padding: '1rem',
          fontSize: 13,
          lineHeight: 1.6,
        }}
        lineNumberStyle={{
          color: config.lineNumberColor,
          minWidth: '2.5em',
          paddingRight: '1.25em',
          userSelect: 'none',
        }}
        codeTagProps={{ style: { fontFamily: 'inherit' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );

  return scopeClass ? <div className={scopeClass}>{block}</div> : block;
}
