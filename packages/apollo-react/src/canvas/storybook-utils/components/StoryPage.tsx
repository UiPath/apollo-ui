import { cn, Tabs, TabsContent, TabsList, TabsTrigger } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';

/**
 * Documentation page chrome for canvas stories.
 *
 * A story that documents a concept rather than demonstrating one call site
 * reads better as a page: a lede, a live preview, then anatomy and usage. These
 * pieces supply that layout so each story only writes its own content. Pair
 * `StoryPage` with `StoryPreview` for the canvas and `StorySection` /
 * `StoryCollapsibleSection` for the prose below it.
 */

/** Shared body width so every section on a page lines up. */
const CONTAINER = 'mx-auto max-w-4xl px-8';

const HEADING = 'text-2xl font-bold tracking-tight text-foreground';

/**
 * Prose blocks accept rich content, so they render into a `div` rather than a
 * `p`: a caller passing several paragraphs would otherwise nest `p` in `p`.
 */
const PROSE = 'text-sm leading-relaxed text-muted-foreground [&>p+p]:mt-1.5';

export interface StoryPageProps {
  /** Storybook theme global, applied as a class to the page root. */
  theme: string;
  title: string;
  /** Lede below the title. Plain text, or `p` elements for several paragraphs. */
  description?: ReactNode;
  /** Preview and sections, in the order they should appear. */
  children?: ReactNode;
}

export function StoryPage({ theme, title, description, children }: StoryPageProps) {
  return (
    <div className={cn(theme, 'min-h-screen w-full bg-background text-foreground')}>
      <div className={cn(CONTAINER, 'pt-8')}>
        <h2 className={cn('mb-2', HEADING)}>{title}</h2>
        {description && <div className={cn('mb-6', PROSE)}>{description}</div>}
        <div className="mb-8 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

export interface StorySectionProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Rule above the heading, separating this section from the one before it. */
  divider?: boolean;
}

/** A titled block of documentation, always open. */
export function StorySection({ title, description, children, divider = true }: StorySectionProps) {
  return (
    <section className={cn(CONTAINER, 'pb-10')}>
      {divider && <div className="mb-10 h-px bg-border" />}
      <h2 className={cn('mb-2', HEADING)}>{title}</h2>
      {description && <div className={cn('mb-6', PROSE)}>{description}</div>}
      {children}
    </section>
  );
}

export interface StoryCollapsibleSectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

/**
 * A section that folds away. Use when a page has enough sections that showing
 * them all at once buries the preview; the caller owns the open state so it can
 * offer an expand-all control.
 */
export function StoryCollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: StoryCollapsibleSectionProps) {
  return (
    <div className={CONTAINER}>
      <div className="border-t border-border">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-foreground"
        >
          <h2 className={HEADING}>{title}</h2>
          <CanvasIcon icon={open ? 'chevron-up' : 'chevron-down'} size={16} />
        </button>
        {open && <div className="pb-8">{children}</div>}
      </div>
    </div>
  );
}

export interface StoryCardProps {
  /** Visual sample, centered in a fixed-height slot so cards align in a grid. */
  preview: ReactNode;
  title: string;
  /** Value chip beside the title, e.g. the prop value this card illustrates. */
  code?: string;
  description: ReactNode;
  /** Overrides the fixed anatomy-preview slot for larger live specimens. */
  previewClassName?: string;
}

/** One entry in an anatomy gallery: a sample, a name, and what it is for. */
export function StoryCard({ preview, title, code, description, previewClassName }: StoryCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className={cn('flex h-24 items-center justify-center', previewClassName)}>{preview}</div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-foreground">{title}</span>
          {code && <StoryCode>{code}</StoryCode>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/** Lets a dense interactive surface use the viewport while surrounding prose stays readable. */
export function StoryWideContent({ children }: { children?: ReactNode }) {
  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1600px] -translate-x-1/2">
      {children}
    </div>
  );
}

export interface StoryTab {
  value: string;
  label: string;
  content: ReactNode;
}

export interface StoryTabsProps {
  tabs: readonly StoryTab[];
  /** Accessible name for the tab list. */
  label?: string;
}

/** A documentation tab rail that keeps one dense comparison visible at a time. */
export function StoryTabs({ tabs, label = 'Comparisons' }: StoryTabsProps) {
  const firstTab = tabs[0];
  if (!firstTab) return null;

  return (
    <Tabs defaultValue={firstTab.value} className="w-full">
      <TabsList
        aria-label={label}
        className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-10 shrink-0 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** Inline code chip, for prop names and values mentioned in prose. */
export function StoryCode({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">{children}</code>;
}

/** Fenced code sample. Pass the source as a template literal child. */
export function StoryCodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-foreground">
      {children}
    </pre>
  );
}
