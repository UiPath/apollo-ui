'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn, safeHref } from '@/lib';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

/**
 * An inline citation marker for chat prose, with a hover and focus preview of the source. It does
 * not navigate on its own: `onSelect` receives the citation and the event, so a host can run its
 * `citation-click` pre-hook and decide whether to open `href`. The payload drops an `href` that is
 * not http(s), mailto, tel or relative, so it is safe to open.
 *
 * Compact density: without a `size`, inside an ancestor with `data-density="compact"` it takes
 * the `sm` look (10px, Material's compact citation). An explicit `size` always wins.
 * There is no prop: the host opts in by setting the attribute (the Wind chat sets it on its root).
 * Compact sets CSS variables the base classes read, so a host className on the root wins in
 * both densities.
 */

export interface CitationData {
  /** The source number, usually 1-based. Shown in the pill unless `children` are given. */
  index: number | string;
  title?: string;
  snippet?: string;
  /** Where it came from: a domain, a file name or a page reference. */
  source?: string;
  href?: string;
}

export interface CitationStrings {
  /** Accessible name of the pill. */
  label: (index: string, title?: string) => string;
}

export const DEFAULT_CITATION_STRINGS: CitationStrings = {
  label: (index, title) => (title ? `Citation ${index}: ${title}` : `Citation ${index}`),
};

const citationVariants = cva(
  'mx-0.5 inline-flex cursor-pointer items-center justify-center rounded-full bg-muted align-text-top font-medium leading-none text-muted-foreground tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
  {
    variants: {
      size: {
        default:
          'h-(--citation-size,1.125rem) min-w-(--citation-size,1.125rem) px-(--citation-padding,0.375rem) text-(length:--citation-font-size,11px)',
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
  onSelect?: (citation: CitationData, event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Set false to skip the preview card even when there is content for it. */
  preview?: boolean;
  previewSide?: React.ComponentPropsWithoutRef<typeof HoverCardContent>['side'];
  /**
   * Called when the citation becomes active or inactive, so a host can mark the cited text. It
   * activates at once on hover or keyboard focus, and deactivates once neither applies and its
   * preview, if shown, has closed. The preview's close delay means one citation can deactivate after the next
   * activates. Also called with `false` if it unmounts active.
   */
  onActiveChange?: (active: boolean) => void;
  strings?: Partial<CitationStrings>;
}

// The `sm` look, for a citation without an explicit size inside a compact ancestor. It sets the
// variables `default` reads, so a host className on the root still wins.
const COMPACT_CITATION_CLASSES =
  'in-data-[density=compact]:[--citation-size:1rem] in-data-[density=compact]:[--citation-padding:0.25rem] in-data-[density=compact]:[--citation-font-size:10px]';

const Citation = React.forwardRef<HTMLButtonElement, CitationProps>(
  (
    {
      className,
      size: sizeProp,
      index,
      title,
      snippet,
      source,
      href,
      onSelect,
      onClick,
      onFocus,
      onBlur,
      onPointerEnter,
      onPointerLeave,
      preview = true,
      previewSide = 'top',
      onActiveChange,
      strings,
      'aria-label': ariaLabel,
      children,
      ...props
    },
    ref
  ) => {
    const text = { ...DEFAULT_CITATION_STRINGS, ...strings };
    const [open, setOpen] = React.useState(false);

    // Active while hovered, focused or showing its preview. The preview term bridges the gap
    // between the pill and the card, so the pointer can cross it without a flicker.
    const activity = React.useRef({ hovered: false, focused: false, previewOpen: false });
    const active = React.useRef(false);
    const onActiveChangeRef = React.useRef(onActiveChange);
    onActiveChangeRef.current = onActiveChange;
    const updateActivity = (patch: Partial<typeof activity.current>) => {
      Object.assign(activity.current, patch);
      const { hovered, focused, previewOpen } = activity.current;
      const next = hovered || focused || previewOpen;
      if (next === active.current) return;
      active.current = next;
      onActiveChangeRef.current?.(next);
    };

    // A click dismisses the preview until the pointer leaves or focus moves away. Without this,
    // the focus from the click lets the hover card reopen it after its open delay.
    const dismissed = React.useRef(false);
    const setPreviewOpen = (next: boolean) => {
      if (next && dismissed.current) return;
      setOpen(next);
      updateActivity({ previewOpen: next });
    };

    // A citation can unmount while active (streamed markdown re-renders), so let the host clear up.
    React.useEffect(
      () => () => {
        if (active.current) onActiveChangeRef.current?.(false);
      },
      []
    );
    const size = sizeProp ?? 'default';
    const name = ariaLabel ?? text.label(String(index), title || undefined);
    const hasPreview = preview && Boolean(title || snippet || source);

    const button = (
      <button
        ref={ref}
        type="button"
        data-slot="citation"
        data-size={size}
        aria-label={name}
        className={cn(
          citationVariants({ size }),
          sizeProp == null && COMPACT_CITATION_CLASSES,
          className
        )}
        onClick={(event) => {
          onClick?.(event);
          if (hasPreview) {
            dismissed.current = true;
            setPreviewOpen(false);
          }
          if (!event.defaultPrevented) {
            onSelect?.({ index, title, snippet, source, href: safeHref(href) }, event);
          }
        }}
        onFocus={(event) => {
          onFocus?.(event);
          // A click also focuses the button; counting that would keep it active after the pointer
          // leaves. Like MUI's tooltip, only keyboard focus counts.
          if (!event.currentTarget.matches(':focus-visible')) return;
          updateActivity({ focused: true });
          // HoverCard waits out its open delay on focus too; keyboard users get it at once.
          if (hasPreview) setPreviewOpen(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          dismissed.current = false;
          updateActivity({ focused: false });
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          updateActivity({ hovered: true });
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          dismissed.current = false;
          updateActivity({ hovered: false });
        }}
        {...props}
      >
        {children ?? index}
      </button>
    );

    if (!hasPreview) return button;

    return (
      <HoverCard open={open} onOpenChange={setPreviewOpen} openDelay={300} closeDelay={150}>
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
