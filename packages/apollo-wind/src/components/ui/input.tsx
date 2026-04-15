import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles (all themes)
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          // Future Dark / Future Light overrides
          'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:py-2 future:text-sm future:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] future:placeholder:text-foreground-muted future:placeholder:font-normal future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
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
