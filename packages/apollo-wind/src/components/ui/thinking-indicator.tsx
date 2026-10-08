'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Read on first render so a reduced-motion user never sees the first rotation start.
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(getPrefersReducedMotion);

  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
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
  /** Default visible label, and the accessible name unless `label` or `aria-label` is set. */
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
  /**
   * Replaces the pulsing sparkle; `null` or `false` shows the label alone. A custom icon brings
   * its own colour and animation and is sized by the indicator's `size`.
   */
  icon?: React.ReactNode;
}

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
const ThinkingIndicator = React.forwardRef<HTMLDivElement, ThinkingIndicatorProps>(
  (
    {
      className,
      size = 'md',
      label,
      messages,
      interval = 2500,
      strings,
      icon,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const text = { ...DEFAULT_THINKING_INDICATOR_STRINGS, ...strings };
    const staticLabel = label ?? text.label;
    const name = ariaLabel ?? staticLabel;
    const labels = messages && messages.length > 0 ? messages : [staticLabel];
    const reducedMotion = usePrefersReducedMotion();
    const rotates = labels.length > 1 && !reducedMotion && interval > 0;
    // Compares contents, not identity, so an inline `messages` array does not restart rotation.
    const rotationKey = `${rotates}\u0000${labels.join('\u0000')}`;
    const [index, setIndex] = React.useState(0);

    // Reset during render, not in an effect, so the stale label never paints before the first one.
    const [prevRotationKey, setPrevRotationKey] = React.useState(rotationKey);
    if (rotationKey !== prevRotationKey) {
      setPrevRotationKey(rotationKey);
      setIndex(0);
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: `rotationKey` is read only as a trigger: the timer restarts with new labels so the first one gets a full interval.
    React.useEffect(() => {
      if (!rotates) return;
      const id = window.setInterval(() => {
        setIndex((current) => (current + 1) % labels.length);
      }, interval);
      return () => window.clearInterval(id);
    }, [rotates, labels.length, interval, rotationKey]);

    const activeIndex = index < labels.length ? index : 0;

    return (
      // biome-ignore lint/a11y/useSemanticElements: role="status" is the correct ARIA role for a progress indicator, not <output>
      <div
        ref={ref}
        data-slot="thinking-indicator"
        data-size={size}
        role="status"
        aria-label={name}
        className={cn(thinkingIndicatorVariants({ size }), className)}
        {...props}
      >
        {icon !== null && icon !== false && (
          // The slot owns the size, so a custom icon is sized like the default without extra classes.
          <span
            data-slot="thinking-indicator-icon"
            aria-hidden="true"
            className="inline-flex shrink-0 items-center justify-center [&>svg]:size-full"
          >
            {icon ?? <Sparkles className="text-primary animate-pulse motion-reduce:animate-none" />}
          </span>
        )}
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
        {/* Readers skip `aria-label` on a status in browse mode, so the name is also real text. */}
        <span className="sr-only">{name}</span>
      </div>
    );
  }
);
ThinkingIndicator.displayName = 'ThinkingIndicator';

export { ThinkingIndicator, thinkingIndicatorVariants };
