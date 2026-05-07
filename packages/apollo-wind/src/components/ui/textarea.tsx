import * as React from 'react';

import { cn } from '@/lib/index';

export type TextareaProps = React.ComponentProps<'textarea'>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles (all themes)
          'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          // Future Dark / Future Light overrides
          'future:rounded-xl future:border-0 future:bg-surface-raised future:text-sm future:placeholder:text-foreground-muted future:placeholder:font-normal future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
