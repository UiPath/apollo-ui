import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib';

/**
 * Three dots with a staggered bounce, for compact waits inside a conversation such as loading
 * older messages or a typing hint. The dots take `currentColor`, so set the colour with a text
 * class. They hold still under `prefers-reduced-motion` (handled by `animate-loading-dot`).
 */

const loadingDotsVariants = cva(
  // The row is twice a dot's height so the bounce, which lifts a dot by its own height, stays
  // inside the box.
  'inline-flex shrink-0 items-end text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'h-2 gap-0.5 [&>[data-slot=loading-dot]]:size-1',
        md: 'h-3 gap-1 [&>[data-slot=loading-dot]]:size-1.5',
        lg: 'h-4 gap-1.5 [&>[data-slot=loading-dot]]:size-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const DOT_DELAYS = ['[animation-delay:0ms]', '[animation-delay:150ms]', '[animation-delay:300ms]'];

export interface LoadingDotsStrings {
  /** Accessible name of the status. */
  label: string;
}

export const DEFAULT_LOADING_DOTS_STRINGS: LoadingDotsStrings = {
  label: 'Loading',
};

export interface LoadingDotsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof loadingDotsVariants> {
  /** Overrides for any subset of the English strings. An explicit `aria-label` wins over `label`. */
  strings?: Partial<LoadingDotsStrings>;
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = 'md', strings, 'aria-label': ariaLabel, ...props }, ref) => {
    const text = { ...DEFAULT_LOADING_DOTS_STRINGS, ...strings };
    return (
      // biome-ignore lint/a11y/useSemanticElements: role="status" is the correct ARIA role for loading indicators, not <output>
      <div
        ref={ref}
        data-slot="loading-dots"
        data-size={size}
        role="status"
        aria-label={ariaLabel ?? text.label}
        className={cn(loadingDotsVariants({ size }), className)}
        {...props}
      >
        {DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            data-slot="loading-dot"
            aria-hidden="true"
            className={cn('animate-loading-dot rounded-full bg-current', delay)}
          />
        ))}
      </div>
    );
  }
);
LoadingDots.displayName = 'LoadingDots';

export { LoadingDots, loadingDotsVariants };
