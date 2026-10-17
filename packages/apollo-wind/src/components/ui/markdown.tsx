import * as React from 'react';
import ReactMarkdown, { type Components, type ExtraProps, type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import {
  CodeBlock,
  type CodeBlockProps,
  type CodeBlockStrings,
  DEFAULT_CODE_BLOCK_STRINGS,
} from '@/components/ui/code-block';
import { cn } from '@/lib';

/**
 * Renders chat markdown (GFM tables, task lists, strikethrough, autolinks, footnotes, and TeX math)
 * on apollo-wind tokens. Elements are styled through the react-markdown `components` map, so a
 * host can swap any renderer (for example citations) without fighting a prose stylesheet.
 *
 * Math is emitted as MathML, as in the Material chat, so no KaTeX stylesheet or fonts are needed.
 * Inline math uses `$$...$$` inside a sentence; a single `$` stays literal so prices are safe.
 * Block math is a `$$` block or a ```math (also `latex`, `tex`) fence. A math block without its
 * closing line, still streaming or cut off, renders as code, so half a formula never shows as a
 * KaTeX error. A fenced block's language is the `language-*` class on its `<code>`, or
 * `data-language` for a math block that is still open. A host overriding `pre` or `code` should
 * read both; `renderCodeActions` receives it already resolved.
 * Raw HTML in the source is shown as text (except `<br>`, which becomes a line break), and unsafe
 * link protocols are dropped by react-markdown. Links open in a new tab, except in-page anchors.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function hastText(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(hastText).join('');
}

function languageOf(node: HastNode): string | undefined {
  const className = node.properties?.className;
  const classes = Array.isArray(className) ? className.map(String) : [];
  const fromClass = classes.find((name) => name.startsWith('language-'))?.slice('language-'.length);
  const dataLanguage = node.properties?.dataLanguage;
  return fromClass ?? (typeof dataLanguage === 'string' ? dataLanguage : undefined);
}

// Chat sits inside a host app, so following a link in place would drop the conversation. Only
// in-page anchors and mail or phone links stay in the current tab.
const opensInNewTab = (href: string | undefined) => !!href && !/^(#|mailto:|tel:)/i.test(href);

type MdastNode = {
  type: string;
  value?: string;
  lang?: string | null;
  meta?: string | null;
  position?: { start: { offset?: number }; end: { offset?: number } };
  data?: Record<string, unknown>;
  children?: MdastNode[];
};

const MATH_FENCE_LANGUAGES = new Set(['math', 'latex', 'tex']);
const OPENING_FENCE = /^[ \t]*(`{3,}|~{3,}|\${2,})/;
const CLOSING_FENCE = /^( *)(`{3,}|~{3,}|\${2,})[ \t]*$/;
const QUOTE_MARKERS = /^(?:[ \t]*>[ ]?)*/;

/** Splits a line's blockquote markers from the rest, with tabs expanded so indents compare. */
function unquote(line: string) {
  const markers = QUOTE_MARKERS.exec(line)?.[0] ?? '';
  const rest = line.slice(markers.length).replace(/\t/g, '    ');
  return { depth: markers.split('>').length - 1, rest };
}

/**
 * Whether a code fence or `$$` block has its closing line. Without one the parser runs the block
 * to the end of input, which is what a block still streaming (or cut off) looks like. A closer sits
 * in the same blockquotes as the opener, indented at most 3 columns past the opener's container
 * (a list item's content column), so deeper lines inside a fence are content.
 */
function hasClosingFence(node: MdastNode, source: string): boolean {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) return true;
  const lines = source.slice(start, end).split(/\r?\n|\r/);
  const open = OPENING_FENCE.exec(lines[0])?.[1];
  if (!open || lines.length < 2) return false;
  const lineStart =
    Math.max(source.lastIndexOf('\n', start - 1), source.lastIndexOf('\r', start - 1)) + 1;
  const container = unquote(source.slice(lineStart, start));
  const last = unquote(lines[lines.length - 1]);
  const [, indent = '', close = ''] = CLOSING_FENCE.exec(last.rest) ?? [];
  return (
    last.depth === container.depth &&
    indent.length <= container.rest.length + 3 &&
    close[0] === open[0] &&
    close.length >= open.length
  );
}

const isMathFence = (node: MdastNode) =>
  node.type === 'code' && MATH_FENCE_LANGUAGES.has(node.lang?.toLowerCase() ?? '');

/** The node remark-math makes for a `$$` block, which rehype-katex renders as display math. */
function displayMath(node: MdastNode): MdastNode {
  const value = node.value ?? '';
  return {
    type: 'math',
    value,
    position: node.position,
    data: {
      hName: 'pre',
      hChildren: [
        {
          type: 'element',
          tagName: 'code',
          properties: { className: ['language-math', 'math-display'] },
          children: [{ type: 'text', value }],
        },
      ],
    },
  };
}

/**
 * An open math block as code. rehype-katex renders any `language-math` code, so the node has no
 * `lang` (which is what makes that class) and the label rides only in `data-language`. A host
 * plugin that replaces `hProperties` then loses the label but can never bring the class back.
 * A `$$b = B` line parses as a block whose text is all meta, so keep it.
 */
function pendingMath(node: MdastNode): MdastNode {
  const value =
    node.type === 'math' ? [node.meta, node.value].filter(Boolean).join('\n') : node.value;
  return {
    type: 'code',
    lang: null,
    value: value ?? '',
    position: node.position,
    data: { hProperties: { dataLanguage: node.type === 'code' ? node.lang : 'math' } },
  };
}

/**
 * Renders ```math, ```latex and ```tex fences as display math, as the Material chat does, and
 * keeps math blocks (fenced or `$$`) as code until their closing line arrives.
 */
function remarkMathBlocks() {
  const visit = (node: MdastNode, source: string) => {
    node.children?.forEach((child, index, children) => {
      const fence = isMathFence(child);
      if (!fence && child.type !== 'math') {
        visit(child, source);
        return;
      }
      if (!hasClosingFence(child, source)) children[index] = pendingMath(child);
      else if (fence) children[index] = displayMath(child);
    });
  };
  return (tree: MdastNode, file: { value?: unknown }) => visit(tree, String(file.value ?? ''));
}

const BR_TAG = /^<br\s*\/?>$/i;

/** Models write `<br>` for line breaks in table cells. Raw HTML is not rendered, so map only that tag. */
function remarkHtmlBreaks() {
  const visit = (node: MdastNode) => {
    if (!node.children) return;
    node.children = node.children.map((child) =>
      child.type === 'html' && BR_TAG.test(child.value?.trim() ?? '') ? { type: 'break' } : child
    );
    node.children.forEach(visit);
  };
  return (tree: MdastNode) => visit(tree);
}

// Blocks the cursor descends into so it lands at the end of the deepest trailing text.
const CURSOR_CONTAINERS = new Set([
  'ul',
  'ol',
  'li',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
]);
const CURSOR_TEXT_BLOCKS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th']);

const CURSOR_CLASS =
  'ml-0.5 inline-block h-[1.1em] w-[0.45em] translate-y-[0.2em] rounded-[1px] bg-foreground animate-pulse motion-reduce:animate-none';

function lastContent(node: HastNode): HastNode | undefined {
  const children = node.children ?? [];
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child.type === 'element') return child;
    if (child.type === 'text' && child.value?.trim()) return child;
  }
  return undefined;
}

function findCursorHost(root: HastNode): HastNode {
  let node = root;
  for (;;) {
    const last = lastContent(node);
    if (last?.type !== 'element' || !last.tagName) return node;
    if (CURSOR_TEXT_BLOCKS.has(last.tagName)) return last;
    if (!CURSOR_CONTAINERS.has(last.tagName)) return node;
    node = last;
  }
}

/** Appends the streaming caret after the last rendered text, or after a trailing code block. */
function rehypeStreamingCursor() {
  return (tree: HastNode) => {
    const host = findCursorHost(tree);
    host.children = [
      ...(host.children ?? []),
      {
        type: 'element',
        tagName: 'span',
        properties: { dataSlot: 'markdown-cursor', ariaHidden: 'true', className: [CURSOR_CLASS] },
        children: [],
      },
    ];
  };
}

/**
 * `clobberPrefix` scopes footnote ids per instance, but mdast-util-to-hast hard-codes the
 * `footnote-label` id and the references that describe themselves by it, so scope those too.
 */
function rehypeScopeFootnoteLabel(options: { prefix: string }) {
  const LABEL = 'footnote-label';
  const scoped = `${options.prefix}${LABEL}`;
  const visit = (node: HastNode) => {
    const properties = node.properties;
    if (properties?.id === LABEL) properties.id = scoped;
    if (properties && Array.isArray(properties.ariaDescribedBy)) {
      properties.ariaDescribedBy = properties.ariaDescribedBy.map((ref) =>
        ref === LABEL ? scoped : ref
      );
    }
    node.children?.forEach(visit);
  };
  return (tree: HastNode) => visit(tree);
}

type RehypeKatexOptions = NonNullable<Parameters<typeof rehypeKatex>[0]>;

/**
 * rehype-katex with a fresh copy of `macros` for every render. KaTeX writes `\gdef` and friends
 * into the macros object it is given, so a shared one would let one message redefine a host macro
 * for every later message, and a frozen one would make KaTeX throw.
 */
function rehypeKatexPerRun(options: RehypeKatexOptions) {
  return (...args: Parameters<ReturnType<typeof rehypeKatex>>) =>
    rehypeKatex({ ...options, macros: { ...options.macros } })(...args);
}

export interface MarkdownStrings extends CodeBlockStrings {
  /** Heading of the generated footnotes section. */
  footnotes: string;
  /** Label of the link from a footnote back to its reference. */
  footnoteBack: string;
  /** Read by screen readers before a completed task list item. */
  taskDone: string;
  /** Read by screen readers before an open task list item. */
  taskOpen: string;
}

export const DEFAULT_MARKDOWN_STRINGS: MarkdownStrings = {
  ...DEFAULT_CODE_BLOCK_STRINGS,
  footnotes: 'Footnotes',
  footnoteBack: 'Back to content',
  taskDone: 'Done',
  taskOpen: 'Not done',
};

export interface MarkdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The markdown source. */
  children: string;
  /**
   * react-markdown renderers merged over the built-in ones. Use it with `remarkPlugins` to render
   * custom nodes such as citations or resource chips. `code` only styles inline code: fenced blocks
   * render through `pre`, so use `renderCodeBlock` or `renderCodeActions` to change them.
   */
  components?: Components;
  /** Extra remark plugins, run after GFM and math. */
  remarkPlugins?: Options['remarkPlugins'];
  /** Extra rehype plugins, run after KaTeX. */
  rehypePlugins?: Options['rehypePlugins'];
  /**
   * The source is still arriving. Shows a caret after the last text and marks the region busy.
   * Partial markdown is safe to pass: an unclosed fence renders as code, and so does a math block
   * without its closing line (still streaming or cut off) until it closes. Broken TeX shows as source.
   */
  streaming?: boolean;
  /**
   * Which images load automatically. Markdown in a chat comes from a model: a cross-origin image
   * URL can carry conversation data to a third party, and a same-origin one can fire an
   * authenticated GET, both without any click. By default no image loads; each renders as a link
   * the reader can choose to open. Opt in with `'same-origin'`, `'all'` for trusted content, or a
   * predicate for an allowlist. (react-markdown already drops `data:` and other unsafe URLs.)
   */
  images?: MarkdownImagePolicy;
  /** Wrap long lines in fenced code instead of scrolling horizontally. */
  codeWrap?: boolean;
  /** Extra header actions for each fenced code block (preview, expand), placed before the copy. */
  renderCodeActions?: (block: MarkdownCodeBlock) => React.ReactNode;
  /**
   * Renders each fenced code block instead of the default `CodeBlock`. `props` are what Markdown
   * would pass it (including the `renderCodeActions` actions), so `<CodeBlock {...props} body={...} />`
   * changes one part. Return a component element to keep state per block, such as a preview toggle.
   */
  renderCodeBlock?: (block: MarkdownCodeBlock, props: CodeBlockProps) => React.ReactNode;
  /** KaTeX options for math. Output stays MathML and `trust` stays off; these cannot be changed. */
  katexOptions?: MarkdownKatexOptions;
  strings?: Partial<MarkdownStrings>;
}

export interface MarkdownKatexOptions {
  /**
   * KaTeX's handling of non-standard LaTeX. Defaults to `'ignore'`. rehype-katex renders a formula
   * that fails strict mode again with strict mode off, so stricter values report through the
   * unified file messages but do not change what renders.
   */
  strict?: boolean | 'ignore' | 'warn' | 'error';
  /** Macros available to every formula, such as `{ '\\RR': '\\mathbb{R}' }`. */
  macros?: Record<string, string>;
}

export interface MarkdownCodeBlock {
  /** The block's source without the trailing newline. */
  code: string;
  /** The first word of the fence's info string as written (`ts`, `html`), or `math` for an open `$$` block. */
  language: string | undefined;
}

export type MarkdownImagePolicy = 'none' | 'same-origin' | 'all' | ((src: string) => boolean);

function isAllowedImageSrc(src: string, policy: MarkdownImagePolicy): boolean {
  if (policy === 'none') return false;
  if (policy === 'all') return true;
  if (typeof policy === 'function') return policy(src);
  try {
    const base = typeof window === 'undefined' ? 'https://relative.invalid' : window.location.href;
    return new URL(src, base).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

interface MarkdownContextValue {
  strings: MarkdownStrings;
  images: MarkdownImagePolicy;
  codeWrap: boolean;
  renderCodeActions?: (block: MarkdownCodeBlock) => React.ReactNode;
  renderCodeBlock?: (block: MarkdownCodeBlock, props: CodeBlockProps) => React.ReactNode;
}

// Renderers read per-instance options from context so their identities stay stable. A renderer
// recreated on render is a new component type, and React would remount the whole tree.
const MarkdownContext = React.createContext<MarkdownContextValue>({
  strings: DEFAULT_MARKDOWN_STRINGS,
  images: 'none',
  codeWrap: false,
});

// Lets an image inside a link render without nesting a second <a>.
const InsideLinkContext = React.createContext(false);

const LINK_CLASS =
  'font-medium text-foreground-link underline underline-offset-2 hover:no-underline';

function MarkdownLink({
  node: _node,
  className,
  href,
  children,
  ...rest
}: React.ComponentProps<'a'> & ExtraProps) {
  return (
    <a
      href={href}
      className={cn(LINK_CLASS, className)}
      {...(opensInNewTab(href) ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...rest}
    >
      <InsideLinkContext.Provider value>{children}</InsideLinkContext.Provider>
    </a>
  );
}

function MarkdownImage({
  node: _node,
  className,
  alt,
  src,
  ...rest
}: React.ComponentProps<'img'> & ExtraProps) {
  const { images } = React.useContext(MarkdownContext);
  const insideLink = React.useContext(InsideLinkContext);
  const source = typeof src === 'string' ? src : '';
  if (source && isAllowedImageSrc(source, images)) {
    return (
      <img
        alt={alt ?? ''}
        src={source}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn('h-auto max-w-full rounded-md', className)}
        {...rest}
      />
    );
  }
  const label = alt || source;
  // Inside a link, or with no usable URL, plain text avoids a nested or dead link.
  if (insideLink || !source) return <span data-slot="markdown-image-text">{label}</span>;
  return (
    <a
      data-slot="markdown-image-link"
      href={source}
      target="_blank"
      rel="noreferrer"
      className={LINK_CLASS}
    >
      {label}
    </a>
  );
}

function MarkdownInput({
  node: _node,
  className,
  type,
  checked,
  ...rest
}: React.ComponentProps<'input'> & ExtraProps) {
  const { strings } = React.useContext(MarkdownContext);
  if (type !== 'checkbox') return <input type={type} className={className} {...rest} />;
  // Read-only, so the box is hidden from assistive tech and the state is spoken once as text,
  // instead of "Done, checkbox, checked".
  return (
    <>
      <input
        type="checkbox"
        checked={checked}
        aria-hidden="true"
        tabIndex={-1}
        className={cn('mr-2 size-3.5 translate-y-0.5 accent-primary', className)}
        {...rest}
      />
      <span data-slot="markdown-task-state" className="sr-only">
        {checked ? strings.taskDone : strings.taskOpen}{' '}
      </span>
    </>
  );
}

function MarkdownPre({ node, children, ...rest }: React.ComponentProps<'pre'> & ExtraProps) {
  const { strings, codeWrap, renderCodeActions, renderCodeBlock } =
    React.useContext(MarkdownContext);
  const codeNode = (node as HastNode | undefined)?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'code'
  );
  if (!codeNode) return <pre {...rest}>{children}</pre>;
  const block = { code: hastText(codeNode).replace(/\n$/, ''), language: languageOf(codeNode) };
  const props: CodeBlockProps = {
    code: block.code,
    language: block.language,
    wrap: codeWrap,
    actions: renderCodeActions?.(block),
    strings,
  };
  return renderCodeBlock ? renderCodeBlock(block, props) : <CodeBlock {...props} />;
}

const BUILT_IN_COMPONENTS: Components = {
  h1: ({ node: _node, className, ...rest }) => (
    <h1 className={cn('text-xl font-semibold tracking-tight', className)} {...rest} />
  ),
  h2: ({ node: _node, className, ...rest }) => (
    <h2 className={cn('text-lg font-semibold tracking-tight', className)} {...rest} />
  ),
  h3: ({ node: _node, className, ...rest }) => (
    <h3 className={cn('text-base font-semibold', className)} {...rest} />
  ),
  h4: ({ node: _node, className, ...rest }) => (
    <h4 className={cn('text-sm font-semibold', className)} {...rest} />
  ),
  h5: ({ node: _node, className, ...rest }) => (
    <h5 className={cn('text-sm font-semibold', className)} {...rest} />
  ),
  h6: ({ node: _node, className, ...rest }) => (
    <h6 className={cn('text-sm font-semibold text-muted-foreground', className)} {...rest} />
  ),
  p: ({ node: _node, ...rest }) => <p {...rest} />,
  a: MarkdownLink,
  ul: ({ node: _node, className, ...rest }) => (
    <ul
      className={cn(
        'flex flex-col gap-1 pl-6',
        className?.includes('contains-task-list') ? 'list-none pl-1' : 'list-disc',
        'marker:text-muted-foreground',
        className
      )}
      {...rest}
    />
  ),
  ol: ({ node: _node, className, ...rest }) => (
    <ol
      className={cn(
        'flex list-decimal flex-col gap-1 pl-6 marker:text-muted-foreground',
        className
      )}
      {...rest}
    />
  ),
  li: ({ node: _node, className, ...rest }) => (
    <li
      className={cn(
        'pl-1 [&>ol]:mt-1 [&>p+p]:mt-2 [&>ul]:mt-1 [&>ul.contains-task-list]:pl-6',
        className
      )}
      {...rest}
    />
  ),
  input: MarkdownInput,
  blockquote: ({ node: _node, className, ...rest }) => (
    <blockquote
      className={cn(
        'flex flex-col gap-2 border-l-2 border-border pl-4 text-muted-foreground',
        className
      )}
      {...rest}
    />
  ),
  hr: ({ node: _node, className, ...rest }) => (
    <hr className={cn('border-border-subtle', className)} {...rest} />
  ),
  img: MarkdownImage,
  table: ({ node: _node, className, ...rest }) => (
    <div
      data-slot="markdown-table"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a wide table scrolls, so keyboard users must be able to reach it
      tabIndex={0}
      className="max-w-full overflow-x-auto rounded-lg border border-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table
        className={cn(
          'w-full border-collapse text-left [&_tr:last-child>td]:border-b-0',
          className
        )}
        {...rest}
      />
    </div>
  ),
  th: ({ node: _node, className, ...rest }) => (
    <th
      className={cn(
        'border-b border-border-subtle bg-surface-overlay px-3 py-2 font-semibold',
        className
      )}
      {...rest}
    />
  ),
  td: ({ node: _node, className, ...rest }) => (
    <td className={cn('border-b border-border-subtle px-3 py-2 align-top', className)} {...rest} />
  ),
  code: ({ node: _node, className, ...rest }) => (
    <code
      className={cn(
        'rounded-md bg-surface-overlay px-1.5 py-0.5 font-mono text-[0.875em]',
        className
      )}
      {...rest}
    />
  ),
  pre: MarkdownPre,
};

const Markdown = React.forwardRef<HTMLDivElement, MarkdownProps>(
  (
    {
      children,
      components,
      remarkPlugins,
      rehypePlugins,
      streaming = false,
      images = 'none',
      codeWrap = false,
      renderCodeActions,
      renderCodeBlock,
      katexOptions,
      strings,
      className,
      ...props
    },
    ref
  ) => {
    const context = React.useMemo<MarkdownContextValue>(
      () => ({
        strings: { ...DEFAULT_MARKDOWN_STRINGS, ...strings },
        images,
        codeWrap,
        renderCodeActions,
        renderCodeBlock,
      }),
      [strings, images, codeWrap, renderCodeActions, renderCodeBlock]
    );
    const { footnotes, footnoteBack } = context.strings;
    // Footnote ids must be unique per message, or every reference jumps to the first transcript match.
    const footnotePrefix = `markdown${React.useId().replace(/[^\w-]/g, '')}-`;

    const mergedComponents = React.useMemo<Components>(
      () => (components ? { ...BUILT_IN_COMPONENTS, ...components } : BUILT_IN_COMPONENTS),
      [components]
    );

    const mergedRemarkPlugins = React.useMemo<Options['remarkPlugins']>(
      () => [
        remarkGfm,
        [remarkMath, { singleDollarTextMath: false }],
        remarkMathBlocks,
        remarkHtmlBreaks,
        ...(remarkPlugins ?? []),
      ],
      [remarkPlugins]
    );

    const mergedRehypePlugins = React.useMemo<Options['rehypePlugins']>(
      () => [
        [rehypeScopeFootnoteLabel, { prefix: footnotePrefix }],
        [
          rehypeKatexPerRun,
          {
            strict: katexOptions?.strict ?? 'ignore',
            macros: katexOptions?.macros,
            // Fixed: MathML needs no stylesheet, and trust would let a model's TeX emit links.
            output: 'mathml',
            throwOnError: false,
            trust: false,
          },
        ],
        ...(rehypePlugins ?? []),
        ...(streaming ? [rehypeStreamingCursor] : []),
      ],
      [rehypePlugins, streaming, footnotePrefix, katexOptions?.strict, katexOptions?.macros]
    );

    const remarkRehypeOptions = React.useMemo(
      () => ({
        clobberPrefix: footnotePrefix,
        footnoteLabel: footnotes,
        footnoteBackLabel: footnoteBack,
      }),
      [footnotePrefix, footnotes, footnoteBack]
    );

    return (
      <div
        ref={ref}
        data-slot="markdown"
        data-streaming={streaming || undefined}
        aria-busy={streaming || undefined}
        className={cn(
          'flex min-w-0 flex-col gap-3 text-sm leading-relaxed break-words text-foreground [&_math]:text-[1.15em] [&>.katex]:overflow-x-auto [&>.katex]:overflow-y-hidden [&>.katex]:py-1',
          className
        )}
        {...props}
      >
        <MarkdownContext.Provider value={context}>
          <ReactMarkdown
            components={mergedComponents}
            remarkPlugins={mergedRemarkPlugins}
            rehypePlugins={mergedRehypePlugins}
            remarkRehypeOptions={remarkRehypeOptions}
          >
            {children}
          </ReactMarkdown>
        </MarkdownContext.Provider>
      </div>
    );
  }
);
Markdown.displayName = 'Markdown';

export { Markdown };
