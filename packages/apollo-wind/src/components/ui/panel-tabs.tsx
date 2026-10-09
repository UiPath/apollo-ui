import * as React from 'react';
import { cn } from '@/lib';
import {
  ScrollableTabsList,
  type ScrollableTabsListProps,
  Tabs,
  TabsContent,
  TabsTrigger,
} from './tabs';

/*
 * The tab shell of a side panel (properties, variables, input/output): a pinned
 * row of segmented pill tabs under the panel header and a scrolling content area
 * below it. Every spacing rule lives here so all panels stay aligned:
 *
 * - Horizontal: the host panel's content inset (`--mf-content-inset`, set by the
 *   panel; 0 without one) on the tab row and the content.
 * - Vertical: the tab row puts the tabs 12px below what sits above it (pt-3).
 *   Under a node header (16px bottom padding) that makes the visible gap from the
 *   node to the tabs (28px) match the one from the panel title text to the node. Content
 *   starts 12px below the tabs (row pb-0.5 = 2px + root gap-1 = 4px + content
 *   pt-1.5 = 6px). The strip itself is flush, so it also fits rows it shares with
 *   other controls (e.g. a tree toolbar) without changing their height.
 */

/** Root: a column whose content area fills the remaining height. */
const PanelTabs = React.forwardRef<
  React.ElementRef<typeof Tabs>,
  React.ComponentPropsWithoutRef<typeof Tabs>
>(({ className, ...props }, ref) => (
  <Tabs
    ref={ref}
    data-slot="panel-tabs"
    className={cn('flex min-h-0 flex-1 flex-col gap-1', className)}
    {...props}
  />
));
PanelTabs.displayName = 'PanelTabs';

/**
 * The tab strip alone, for a row that also holds other controls (e.g. a tree
 * toolbar). In a narrow panel it reveals prev/next chevrons and keeps the active
 * tab in view; in a wide one it reads as a plain strip.
 */
const PanelTabsStrip = React.forwardRef<
  React.ElementRef<typeof ScrollableTabsList>,
  ScrollableTabsListProps
>(({ className, containerClassName, scrollButtonClassName, ...props }, ref) => (
  <ScrollableTabsList
    ref={ref}
    data-slot="panel-tabs-strip"
    // Sized to its tabs, so controls sharing the row (e.g. an expanding search)
    // keep their space. PanelTabsList stretches it to fill its own row.
    containerClassName={cn('w-auto', containerClassName)}
    className={cn(
      'h-auto justify-start gap-0.5 rounded-lg bg-transparent p-0 text-muted-foreground',
      className
    )}
    scrollButtonClassName={cn('size-6 hover:bg-surface-overlay', scrollButtonClassName)}
    {...props}
  />
));
PanelTabsStrip.displayName = 'PanelTabsStrip';

interface PanelTabsListProps extends ScrollableTabsListProps {
  /** Content after the tabs, at the end of the row (e.g. a notes toggle). */
  trailing?: React.ReactNode;
  /** Classes for the row around the strip. */
  rowClassName?: string;
}

/** The pinned tab row: the strip, inset like the content, 12px below what sits above it. */
const PanelTabsList = React.forwardRef<React.ElementRef<typeof PanelTabsStrip>, PanelTabsListProps>(
  ({ trailing, rowClassName, className, containerClassName, ...props }, ref) => (
    <div
      data-slot="panel-tabs-list"
      className={cn(
        'flex shrink-0 items-center gap-2 pt-3 pb-0.5 [padding-inline:var(--mf-content-inset,0px)]',
        rowClassName
      )}
    >
      <PanelTabsStrip
        ref={ref}
        className={className}
        containerClassName={cn('flex-1', containerClassName)}
        {...props}
      />
      {trailing}
    </div>
  )
);
PanelTabsList.displayName = 'PanelTabsList';

/** A segmented pill tab. */
const PanelTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    data-slot="panel-tabs-trigger"
    className={cn(
      'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
PanelTabsTrigger.displayName = 'PanelTabsTrigger';

interface PanelTabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsContent> {
  /**
   * Wraps the children in the standard padding: the content inset, pt-1.5 (12px
   * below the tabs), and pb-6. Default true. Turn it off for content that pads
   * itself (its first block must then start with the same 6px).
   */
  padded?: boolean;
  /** Classes for the padded wrapper (e.g. its own vertical rhythm). */
  innerClassName?: string;
}

/** The active tab's content. It is the scroll container, so the tab row stays pinned. */
const PanelTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  PanelTabsContentProps
>(({ padded = true, innerClassName, className, children, ...props }, ref) => (
  <TabsContent
    ref={ref}
    data-slot="panel-tabs-content"
    className={cn('mt-0 min-h-0 flex-1 overflow-auto', className)}
    {...props}
  >
    {padded ? (
      <div
        className={cn('pt-1.5 pb-6 [padding-inline:var(--mf-content-inset,0px)]', innerClassName)}
      >
        {children}
      </div>
    ) : (
      children
    )}
  </TabsContent>
));
PanelTabsContent.displayName = 'PanelTabsContent';

export { PanelTabs, PanelTabsContent, PanelTabsList, PanelTabsStrip, PanelTabsTrigger };
export type { PanelTabsContentProps, PanelTabsListProps };
