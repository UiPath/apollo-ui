'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';

/**
 * A "the assistant is working" row for a conversation: a pulsing sparkle and a shimmering label.
 * Pass `messages` to cycle through progress labels ("Searching", "Reading files") every
 * `interval` ms with a crossfade.
 *
 * Screen readers get one stable name (`label`, else `strings.label`) on a `role="status"` root,
 * and the visual label is `aria-hidden`. Rotating labels are decoration, so announcing each one
 * would only add noise. Announce real progress with `LiveRegion` instead.
 *
 * Under `prefers-reduced-motion` the icon and shimmer are static and the labels do not rotate.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY)?.matches ?? false;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(getPrefersReducedMotion);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    if (!mql) return;
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

const thinkingIndicatorVariants = cva(
  'inline-flex max-w-full min-w-0 items-center text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'gap-1.5 text-xs [&_[data-slot=thinking-indicator-icon]]:size-3.5',
        md: 'gap-2 text-sm [&_[data-slot=thinking-indicator-icon]]:size-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ThinkingIndicatorStrings {
  /** Label shown, and announced, when neither `label` nor `messages` is given. */
  label: string;
}

export const DEFAULT_THINKING_INDICATOR_STRINGS: ThinkingIndicatorStrings = {
  label: 'Thinking',
};

export interface ThinkingIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof thinkingIndicatorVariants> {
  /** A single label. Also the accessible name when `messages` rotate. */
  label?: string;
  /** Labels to cycle through. The first shows immediately; reduced motion keeps it there. */
  messages?: string[];
  /** Milliseconds each of `messages` stays on screen. */
  interval?: number;
  /** Overrides for any subset of the English strings. An explicit `aria-label` wins over both. */
  strings?: Partial<ThinkingIndicatorStrings>;
}

const ThinkingIndicator = React.forwardRef<HTMLDivElement, ThinkingIndicatorProps>(
  (
    {
      className,
      size = 'md',
      label,
      messages,
      interval = 2500,
      strings,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const text = { ...DEFAULT_THINKING_INDICATOR_STRINGS, ...strings };
    const staticLabel = label ?? text.label;
    const labels = messages && messages.length > 0 ? messages : [staticLabel];
    const reducedMotion = usePrefersReducedMotion();
    const rotates = labels.length > 1 && !reducedMotion && interval > 0;
    const [index, setIndex] = React.useState(0);

    // Restart from the first label when the list changes length or rotation stops.
    React.useEffect(() => {
      setIndex(0);
      if (!rotates) return;
      const id = window.setInterval(() => {
        setIndex((current) => (current + 1) % labels.length);
      }, interval);
      return () => window.clearInterval(id);
    }, [rotates, labels.length, interval]);

    const activeIndex = index < labels.length ? index : 0;

    return (
      // biome-ignore lint/a11y/useSemanticElements: role="status" is the correct ARIA role for a progress indicator, not <output>
      <div
        ref={ref}
        data-slot="thinking-indicator"
        data-size={size}
        role="status"
        aria-label={ariaLabel ?? staticLabel}
        className={cn(thinkingIndicatorVariants({ size }), className)}
        {...props}
      >
        <Sparkles
          data-slot="thinking-indicator-icon"
          aria-hidden="true"
          className="shrink-0 text-primary animate-pulse motion-reduce:animate-none"
        />
        {/* Every label shares one grid cell so the row keeps the widest label's width and the
            swap is an opacity crossfade rather than a layout jump. */}
        <span data-slot="thinking-indicator-label" aria-hidden="true" className="grid min-w-0">
          {labels.map((item, i) => (
            <span
              key={i}
              data-active={i === activeIndex}
              className="shimmer col-start-1 row-start-1 truncate transition-opacity duration-300 data-[active=false]:opacity-0 motion-reduce:transition-none"
            >
              {item}
            </span>
          ))}
        </span>
      </div>
    );
  }
);
ThinkingIndicator.displayName = 'ThinkingIndicator';

export { ThinkingIndicator, thinkingIndicatorVariants };
