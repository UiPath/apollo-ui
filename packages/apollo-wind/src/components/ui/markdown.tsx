import * as React from 'react';
import ReactMarkdown, { type Components, type ExtraProps, type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import {
  CodeBlock,
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
  return classes.find((name) => name.startsWith('language-'))?.slice('language-'.length);
}

// Chat sits inside a host app, so following a link in place would drop the conversation. Only
// in-page anchors and mail or phone links stay in the current tab.
const opensInNewTab = (href: string | undefined) => !!href && !/^(#|mailto:|tel:)/i.test(href);

type MdastNode = { type: string; value?: string; children?: MdastNode[] };

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
   * render through `pre`, so override `pre` (or use `renderCodeActions`) to change them.
   */
  components?: Components;
  /** Extra remark plugins, run after GFM and math. */
  remarkPlugins?: Options['remarkPlugins'];
  /** Extra rehype plugins, run after KaTeX. */
  rehypePlugins?: Options['rehypePlugins'];
  /**
   * The source is still arriving. Shows a caret after the last text and marks the region busy.
   * Partial markdown is safe to pass: unclosed fences render as code and broken TeX as source.
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
  strings?: Partial<MarkdownStrings>;
}

export interface MarkdownCodeBlock {
  /** The block's source without the trailing newline. */
  code: string;
  /** The fence's info string as written, e.g. `ts` or `html`. */
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
  const { strings, codeWrap, renderCodeActions } = React.useContext(MarkdownContext);
  const codeNode = (node as HastNode | undefined)?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'code'
  );
  if (!codeNode) return <pre {...rest}>{children}</pre>;
  const block = { code: hastText(codeNode).replace(/\n$/, ''), language: languageOf(codeNode) };
  return (
    <CodeBlock
      code={block.code}
      language={block.language}
      wrap={codeWrap}
      actions={renderCodeActions?.(block)}
      strings={strings}
    />
  );
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
      }),
      [strings, images, codeWrap, renderCodeActions]
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
        remarkHtmlBreaks,
        ...(remarkPlugins ?? []),
      ],
      [remarkPlugins]
    );

    const mergedRehypePlugins = React.useMemo<Options['rehypePlugins']>(
      () => [
        [rehypeScopeFootnoteLabel, { prefix: footnotePrefix }],
        [rehypeKatex, { output: 'mathml', throwOnError: false, trust: false, strict: 'ignore' }],
        ...(rehypePlugins ?? []),
        ...(streaming ? [rehypeStreamingCursor] : []),
      ],
      [rehypePlugins, streaming, footnotePrefix]
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
          'flex min-w-0 flex-col gap-3 text-sm leading-relaxed break-words text-foreground [&_math]:text-[1.15em] [&>.katex]:overflow-x-auto [&>.katex]:py-1',
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
