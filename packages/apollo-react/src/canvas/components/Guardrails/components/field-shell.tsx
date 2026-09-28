import { cn } from '@uipath/apollo-wind';
import * as React from 'react';

export interface FieldShellProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Renders the error border (uses the `error` token, matching aria-invalid controls). */
  invalid?: boolean;
}

/**
 * Input-look container for non-input controls (chip groups) in the guardrail forms.
 *
 * Tracks apollo-wind's field chrome deliberately, including the `future:` layer: fields there go
 * borderless on a raised surface with a larger radius, so a shell that kept a visible outline and
 * a `background` fill read as flat and out-of-place next to its own neighbours in the future and
 * dark themes. `InputGroup` is the same idea in apollo-wind — a container that looks like an input
 * but wraps non-input children — and this mirrors its treatment, error state included.
 */
const FieldShell = React.forwardRef<HTMLDivElement, FieldShellProps>(
  ({ invalid = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="guardrail-field-shell"
      className={cn(
        'rounded-md px-3 py-2 future:rounded-xl',
        'border border-input bg-transparent future:border-0 future:bg-surface-overlay',
        invalid && 'border-error ring-error/20 future:ring-1 future:ring-error/40',
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
