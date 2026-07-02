import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'ghost';
  size?: 'default' | 'xs';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles (all themes)
          'flex w-full transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          // Size
          size === 'default' &&
            'h-9 rounded-md px-3 py-1 text-base placeholder:text-muted-foreground md:text-sm',
          size === 'xs' && 'h-6 rounded px-2 text-xs placeholder:text-muted-foreground',
          // Variant
          variant === 'default' && 'border border-input bg-transparent',
          variant === 'ghost' && 'border-0 bg-surface-overlay',
          // Future theme overrides apply only to the default variant + default size
          variant === 'default' &&
            size === 'default' &&
            'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:py-2 future:text-sm future:placeholder:text-foreground-muted future:placeholder:font-normal future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
