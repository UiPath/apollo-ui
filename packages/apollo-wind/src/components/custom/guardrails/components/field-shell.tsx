import * as React from 'react';
import { cn } from '@/lib';

export interface FieldShellProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Renders the error border (uses the `error` token, matching aria-invalid controls). */
  invalid?: boolean;
}

/** Input-look container for non-input controls (chip groups) in the guardrail forms. */
const FieldShell = React.forwardRef<HTMLDivElement, FieldShellProps>(
  ({ invalid = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="guardrail-field-shell"
      className={cn(
        'rounded-md border border-input bg-background px-3 py-2',
        invalid && 'border-error',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
FieldShell.displayName = 'FieldShell';

export { FieldShell };
