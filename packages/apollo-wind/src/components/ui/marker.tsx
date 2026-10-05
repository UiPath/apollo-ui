import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib';

/**
 * A status line inside a conversation, ported from shadcn/ui's chat components: a system note, a
 * dated separator between turns, or a bordered row. `MarkerIcon` and `MarkerContent` are its parts.
 */

const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-left text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
  {
    variants: {
      variant: {
        default: '',
        separator:
          'before:mr-1 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ml-1 after:h-px after:min-w-0 after:flex-1 after:bg-border',
        border: 'border-b border-border pb-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface MarkerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof markerVariants> {
  asChild?: boolean;
}

const Marker = React.forwardRef<HTMLDivElement, MarkerProps>(
  ({ className, variant = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        data-slot="marker"
        data-variant={variant}
        className={cn(markerVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Marker.displayName = 'Marker';

const MarkerIcon = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn("size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    />
  )
);
MarkerIcon.displayName = 'MarkerIcon';

const MarkerContent = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="marker-content"
      className={cn(
        'min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        className
      )}
      {...props}
    />
  )
);
MarkerContent.displayName = 'MarkerContent';

export { Marker, MarkerIcon, MarkerContent, markerVariants };
