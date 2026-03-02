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
  vscDarkPlus,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

import { cn } from '@/lib';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

/**
 * All Apollo theme variants supported by CodeBlock.
 *
 * Standard:
 * - `'dark'` / `'light'`               — Apollo dark / light
 * - `'dark-hc'` / `'light-hc'`         — high-contrast variants
 *
 * Future design language (from themes.css):
 * - `'future-dark'` / `'future-light'`  — Future zinc palette, cyan brand
 * - `'core-dark'` / `'core-light'`      — Apollo Core blue palette
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
  | 'future-dark'
  | 'future-light'
  | 'core-dark'
  | 'core-light'
  | 'wireframe'
  | 'vertex'
  | 'canvas'
  | 'dark-hc'
  | 'light-hc';

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
  // ── Standard Apollo dark ─────────────────────────────────────────────────
  dark: {
    prismStyle: oneDark,
    bg: '#282c34',
    headerBg: '#21252b',
    labelColor: '#abb2bf',
    iconColor: '#9da5b4',
    lineNumberColor: '#495162',
  },
  // ── Standard Apollo light ────────────────────────────────────────────────
  light: {
    prismStyle: oneLight,
    bg: '#fafafa',
    headerBg: '#f0f0f0',
    labelColor: '#6b7280',
    iconColor: '#9ca3af',
    lineNumberColor: '#c0c0c0',
  },
  // ── Future dark — VS Code Dark+ for a modern zinc feel ───────────────────
  'future-dark': {
    prismStyle: vscDarkPlus,
    bg: '#18181b',
    headerBg: '#09090b',
    labelColor: '#a1a1aa',
    iconColor: '#71717a',
    lineNumberColor: '#3f3f46',
  },
  // ── Future light — VS Code Light for a clean zinc-50 feel ────────────────
  'future-light': {
    prismStyle: vs,
    bg: '#fafafa',
    headerBg: '#f4f4f5',
    labelColor: '#52525b',
    iconColor: '#71717a',
    lineNumberColor: '#d4d4d8',
  },
  // ── Core dark — Nord for the apollo-core blue-grey palette ───────────────
  'core-dark': {
    prismStyle: nord,
    bg: '#182027',
    headerBg: '#111920',
    labelColor: '#8ea1b1',
    iconColor: '#6b8899',
    lineNumberColor: '#2e3f4c',
  },
  // ── Core light — VS Code Light on a clean white surface ──────────────────
  'core-light': {
    prismStyle: vs,
    bg: '#ffffff',
    headerBg: '#f0f4f8',
    labelColor: '#374151',
    iconColor: '#6b7280',
    lineNumberColor: '#c8d4de',
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

// ============================================================================
// Auto-detect Apollo theme from <body> class
// ============================================================================

// Check more specific / longer class names before short ones to avoid
// a class like "dark" matching inside "future-dark"
const BODY_CLASS_PRIORITY: CodeBlockTheme[] = [
  'future-dark',
  'future-light',
  'core-dark',
  'core-light',
  'dark-hc',
  'light-hc',
  'wireframe',
  'vertex',
  'canvas',
  'dark',
  'light',
];

function getBodyTheme(): CodeBlockTheme {
  if (typeof document === 'undefined') return 'dark';
  const classList = document.body.classList;
  return BODY_CLASS_PRIORITY.find((t) => classList.contains(t)) ?? 'dark';
}

function useApolloTheme(): CodeBlockTheme {
  const [theme, setTheme] = useState<CodeBlockTheme>(getBodyTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getBodyTheme()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
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
 * Supported themes: dark, light, future-dark, future-light, core-dark,
 * core-light, wireframe, vertex, canvas, dark-hc, light-hc.
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

  return (
    <div
      className={cn('overflow-hidden rounded-lg border border-border font-mono text-sm', className)}
      style={{ background: config.bg }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      {showHeader && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-border"
          style={{ background: config.headerBg }}
        >
          <span className="text-xs font-medium" style={{ color: config.labelColor }}>
            {fileName ?? language}
          </span>

          {showCopyButton && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 [&_svg]:size-3.5 transition-colors"
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
}
