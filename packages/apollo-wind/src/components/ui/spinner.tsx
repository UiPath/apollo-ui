import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      default: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    variant: {
      default: 'text-muted-foreground',
      primary: 'text-primary',
      foreground: 'text-foreground',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
  showLabel?: boolean;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, label = 'Loading', showLabel = false, ...props }, ref) => {
    return (
      // biome-ignore lint/a11y/useSemanticElements: role="status" is the correct ARIA role for loading indicators, not <output>
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn('flex items-center justify-center gap-2', className)}
        {...props}
      >
        <Loader2 className={cn(spinnerVariants({ size, variant }))} />
        {showLabel ? (
          <span className="text-sm text-muted-foreground">{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </div>
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner, spinnerVariants };
