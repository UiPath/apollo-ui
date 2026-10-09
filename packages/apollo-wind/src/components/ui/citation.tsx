'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

/**
 * An inline citation marker for chat prose, with a hover and focus preview of the source. It does
 * not navigate on its own: `onSelect` receives the citation and the event, so a host can run its
 * `citation-click` pre-hook and decide whether to open `href`.
 */

export interface CitationData {
  /** The marker shown in the pill, usually the 1-based source number. */
  index: number | string;
  title?: string;
  snippet?: string;
  /** Where it came from: a domain, a file name or a page reference. */
  source?: string;
  href?: string;
}

export interface CitationStrings {
  /** Accessible name without a title. `{index}` is replaced. */
  label: string;
  /** Accessible name with a title. `{index}` and `{title}` are replaced. */
  labelWithTitle: string;
}

export const DEFAULT_CITATION_STRINGS: CitationStrings = {
  label: 'Citation {index}',
  labelWithTitle: 'Citation {index}: {title}',
};

const citationVariants = cva(
  'mx-0.5 inline-flex cursor-pointer items-center justify-center rounded-full bg-muted align-text-top font-medium leading-none text-muted-foreground tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
  {
    variants: {
      size: {
        default: 'h-4.5 min-w-4.5 px-1.5 text-[11px]',
        sm: 'h-4 min-w-4 px-1 text-[10px]',
        lg: 'h-5 min-w-5 px-1.5 text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface CitationProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect' | 'title'>,
    CitationData,
    VariantProps<typeof citationVariants> {
  /** Text in the pill. Defaults to `index`. */
  label?: React.ReactNode;
  onSelect?: (citation: CitationData, event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Set false to skip the preview card even when there is content for it. */
  preview?: boolean;
  previewSide?: React.ComponentPropsWithoutRef<typeof HoverCardContent>['side'];
  strings?: Partial<CitationStrings>;
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

const Citation = React.forwardRef<HTMLButtonElement, CitationProps>(
  (
    {
      className,
      size = 'default',
      index,
      label,
      title,
      snippet,
      source,
      href,
      onSelect,
      onClick,
      onFocus,
      preview = true,
      previewSide = 'top',
      strings,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const text = { ...DEFAULT_CITATION_STRINGS, ...strings };
    const [open, setOpen] = React.useState(false);
    const values = { index: String(index), title: title ?? '' };
    const name = ariaLabel ?? fill(title ? text.labelWithTitle : text.label, values);
    const hasPreview = preview && Boolean(title || snippet || source);

    const button = (
      <button
        ref={ref}
        type="button"
        data-slot="citation"
        data-size={size}
        aria-label={name}
        className={cn(citationVariants({ size }), className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onSelect?.({ index, title, snippet, source, href }, event);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          // HoverCard waits out its open delay on focus too; keyboard users get it at once.
          if (hasPreview) setOpen(true);
        }}
        {...props}
      >
        {label ?? index}
      </button>
    );

    if (!hasPreview) return button;

    return (
      <HoverCard open={open} onOpenChange={setOpen} openDelay={300} closeDelay={150}>
        <HoverCardTrigger asChild>{button}</HoverCardTrigger>
        <HoverCardContent
          data-slot="citation-preview"
          side={previewSide}
          className="flex w-72 flex-col gap-1 p-3 text-sm"
        >
          {source && (
            <span data-slot="citation-source" className="truncate text-xs text-muted-foreground">
              {source}
            </span>
          )}
          {title && (
            <span data-slot="citation-title" className="line-clamp-2 font-medium">
              {title}
            </span>
          )}
          {snippet && (
            <span
              data-slot="citation-snippet"
              className="line-clamp-3 text-xs leading-relaxed text-muted-foreground"
            >
              {snippet}
            </span>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  }
);
Citation.displayName = 'Citation';

export { Citation, citationVariants };
