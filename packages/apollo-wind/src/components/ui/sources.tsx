'use client';

import { ChevronDown, Link2 } from 'lucide-react';
import * as React from 'react';
import { cn, safeHref } from '@/lib';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

/**
 * The list of sources behind an assistant answer, collapsed behind a count. `Sources` owns the
 * trigger; put a `SourcesList` of `SourceItem`s inside. Items do not navigate on their own unless
 * given `href`; `onSelect` receives the item and the event, so a host can run its `citation-click`
 * pre-hook and call `event.preventDefault()` to stop a link. The payload drops an `href` that is
 * not http(s), mailto, tel or relative, so it is safe to open.
 */

export interface SourcesStrings {
  /** Trigger text. A function so a host can apply its own plural rules. */
  sourceCount: (count: number) => string;
  /** Screen reader hint on links that open a new tab. */
  opensInNewTab: string;
}

export const DEFAULT_SOURCES_STRINGS: SourcesStrings = {
  sourceCount: (count) => (count === 1 ? '1 source' : `${count} sources`),
  opensInNewTab: '(opens in a new tab)',
};

const SourcesStringsContext = React.createContext<SourcesStrings>(DEFAULT_SOURCES_STRINGS);

export interface SourcesProps extends React.ComponentPropsWithoutRef<typeof Collapsible> {
  /** Number of sources, shown in the trigger. */
  count: number;
  /** Overrides for any subset of the English strings. Also read by the `SourceItem`s inside. */
  strings?: Partial<SourcesStrings>;
}

const Sources = React.forwardRef<HTMLDivElement, SourcesProps>(
  ({ className, count, strings, children, ...props }, ref) => {
    const text = { ...DEFAULT_SOURCES_STRINGS, ...strings };
    return (
      <SourcesStringsContext.Provider value={text}>
        <Collapsible
          ref={ref}
          data-slot="sources"
          className={cn('group/sources flex w-full min-w-0 flex-col gap-2', className)}
          {...props}
        >
          <CollapsibleTrigger
            data-slot="sources-trigger"
            className="inline-flex h-7 w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-overlay hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5 [&_svg]:shrink-0"
          >
            <Link2 aria-hidden="true" />
            {text.sourceCount(count)}
            <ChevronDown
              aria-hidden="true"
              className="transition-transform group-data-[state=open]/sources:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            data-slot="sources-content"
            className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
          >
            {children}
          </CollapsibleContent>
        </Collapsible>
      </SourcesStringsContext.Provider>
    );
  }
);
Sources.displayName = 'Sources';

const SourcesList = React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      data-slot="sources-list"
      className={cn(
        'flex flex-col gap-0.5 rounded-xl border border-border-subtle bg-card p-1',
        className
      )}
      {...props}
    />
  )
);
SourcesList.displayName = 'SourcesList';

export interface SourceData {
  index: number | string;
  title: string;
  source?: string;
  snippet?: string;
  href?: string;
}

type SourceItemElementProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onSelect' | 'title' | 'type'
>;

export interface SourceItemProps extends SourceItemElementProps, SourceData {
  /** Leading icon, such as a favicon or file type. */
  icon?: React.ReactNode;
  onSelect?: (
    source: SourceData,
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => void;
}

/**
 * One source. A link when `href` is set and uses a safe protocol (new tab by default), otherwise a
 * button for `onSelect`.
 * The ref and extra props go to that link or button, not the wrapping `li`.
 */
const SourceItem = React.forwardRef<HTMLAnchorElement | HTMLButtonElement, SourceItemProps>(
  (
    {
      className,
      index,
      title,
      source,
      snippet,
      href,
      icon,
      onSelect,
      onClick,
      target = '_blank',
      rel,
      ...props
    },
    ref
  ) => {
    const text = React.useContext(SourcesStringsContext);
    // Source URLs usually come from model output, so an unsafe one renders as a button instead.
    const linkHref = safeHref(href);
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      (onClick as React.MouseEventHandler<HTMLElement> | undefined)?.(event);
      if (!event.defaultPrevented) {
        onSelect?.({ index, title, source, snippet, href: linkHref }, event);
      }
    };
    const itemClassName = cn(
      'flex w-full min-w-0 cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      className
    );
    const newTab = target === '_blank';

    const body = (
      <>
        <span
          data-slot="source-index"
          className="mt-0.5 flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-medium leading-none text-muted-foreground tabular-nums"
        >
          {index}
        </span>
        {icon && (
          <span
            data-slot="source-icon"
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_img]:size-4 [&_img]:rounded-sm [&_svg]:size-4"
          >
            {icon}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span data-slot="source-title" className="truncate font-medium text-foreground">
            {title}
          </span>
          {source && (
            <span data-slot="source-source" className="truncate text-xs text-muted-foreground">
              {source}
            </span>
          )}
          {snippet && (
            <span
              data-slot="source-snippet"
              className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
            >
              {snippet}
            </span>
          )}
        </span>
        {linkHref && newTab && <span className="sr-only">{text.opensInNewTab}</span>}
      </>
    );

    return (
      <li data-slot="source-item" className="min-w-0">
        {linkHref ? (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={linkHref}
            target={target}
            rel={rel ?? (newTab ? 'noopener noreferrer' : undefined)}
            className={itemClassName}
            onClick={handleClick}
            {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          >
            {body}
          </a>
        ) : (
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            type="button"
            className={itemClassName}
            onClick={handleClick}
            {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          >
            {body}
          </button>
        )}
      </li>
    );
  }
);
SourceItem.displayName = 'SourceItem';

export { Sources, SourcesList, SourceItem };
