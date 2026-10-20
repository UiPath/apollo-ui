import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib';

/**
 * The surface of a chat message, ported from shadcn/ui's chat components. `Bubble` positions and
 * colours; `BubbleContent` is the padded box the text lives in, so a bubble can also carry
 * reactions or actions outside that box. Use inside `MessageContent`, or standalone with `align`.
 *
 * Compact density: inside an ancestor with `data-density="compact"` the text drops to 12px, as
 * Material's does, and the padding tightens to 10px by 6px (Wind's own; Material keeps it).
 * There is no prop: the host opts in by setting the attribute (the Wind chat sets it on its root).
 * Compact sets CSS variables the base classes read, so a host className on the root wins in
 * both densities.
 */

const BubbleGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="bubble-group"
      className={cn('flex min-w-0 flex-col gap-2', className)}
      {...props}
    />
  )
);
BubbleGroup.displayName = 'BubbleGroup';

const bubbleVariants = cva(
  'group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end',
  {
    variants: {
      variant: {
        default:
          '[&>[data-slot=bubble-content]]:bg-primary [&>[data-slot=bubble-content]]:text-primary-foreground',
        secondary:
          '[&>[data-slot=bubble-content]]:bg-secondary [&>[data-slot=bubble-content]]:text-secondary-foreground',
        muted: '[&>[data-slot=bubble-content]]:bg-surface-overlay',
        outline:
          '[&>[data-slot=bubble-content]]:border-border [&>[data-slot=bubble-content]]:bg-background',
        ghost:
          '[&>[data-slot=bubble-content]]:rounded-none [&>[data-slot=bubble-content]]:border-0 [&>[data-slot=bubble-content]]:bg-transparent [&>[data-slot=bubble-content]]:p-0',
        destructive:
          '[&>[data-slot=bubble-content]]:bg-destructive/10 [&>[data-slot=bubble-content]]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bubbleVariants> {
  /** `end` pins the bubble to the trailing edge when it is not inside an `end`-aligned `Message`. */
  align?: 'start' | 'end';
}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ variant = 'default', align = 'start', className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  )
);
Bubble.displayName = 'Bubble';

export interface BubbleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const BubbleContent = React.forwardRef<HTMLDivElement, BubbleContentProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        data-slot="bubble-content"
        className={cn(
          'w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-(--bubble-padding-x,0.75rem) py-(--bubble-padding-y,0.5rem) text-(length:--bubble-font-size,0.875rem) leading-(--bubble-leading,1.625) break-words group-data-[align=end]/bubble:self-end in-data-[density=compact]:[--bubble-font-size:0.75rem] in-data-[density=compact]:[--bubble-leading:1.5] in-data-[density=compact]:[--bubble-padding-x:0.625rem] in-data-[density=compact]:[--bubble-padding-y:0.375rem]',
          className
        )}
        {...props}
      />
    );
  }
);
BubbleContent.displayName = 'BubbleContent';

const bubbleReactionsVariants = cva(
  'absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-surface-overlay px-1.5 py-0.5 text-sm ring-2 ring-card',
  {
    variants: {
      side: {
        top: 'top-0 -translate-y-3/4',
        bottom: 'bottom-0 translate-y-3/4',
      },
      align: {
        start: 'left-3',
        end: 'right-3',
      },
    },
    defaultVariants: {
      side: 'bottom',
      align: 'end',
    },
  }
);

export interface BubbleReactionsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bubbleReactionsVariants> {}

const BubbleReactions = React.forwardRef<HTMLDivElement, BubbleReactionsProps>(
  ({ side = 'bottom', align = 'end', className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  )
);
BubbleReactions.displayName = 'BubbleReactions';

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions, bubbleVariants };
