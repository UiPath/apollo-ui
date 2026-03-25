import * as React from 'react';
import { cn } from '@/lib';

const shadowSm = 'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]';

export interface FlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const FlowInput = React.forwardRef<HTMLInputElement, FlowInputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl bg-surface-overlay px-3 py-2',
        'text-sm text-foreground placeholder:text-foreground-muted placeholder:font-normal',
        shadowSm,
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
FlowInput.displayName = 'FlowInput';

// Wraps FlowInput with inline addons (icons, text). Takes ownership of the
// container styles — use FlowInput with className overrides inside.
const FlowInputGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center gap-2 overflow-hidden rounded-xl bg-surface-overlay px-3 py-2',
        shadowSm,
        'transition-colors',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        className
      )}
      {...props}
    />
  )
);
FlowInputGroup.displayName = 'FlowInputGroup';

// Inline slot for icons or text on either side of the input inside a group.
const FlowInputAddon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex shrink-0 items-center justify-center',
        'text-sm font-medium text-foreground-muted whitespace-nowrap',
        '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-foreground-muted',
        className
      )}
      {...props}
    />
  )
);
FlowInputAddon.displayName = 'FlowInputAddon';

export { FlowInput, FlowInputGroup, FlowInputAddon };
