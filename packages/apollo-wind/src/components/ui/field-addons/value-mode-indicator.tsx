import * as React from 'react';
import { cn } from '@/lib';
import { useValueModeStrings, type ValueMode } from './value-mode-strings';

export interface ValueModeIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: ValueMode;
  disabled?: boolean;
}

/**
 * The `=` ahead of an expression value. Renders nothing in literal mode: its absence is the signal
 * that the value is plain text. `className` takes alignment overrides, such as nudging the glyph
 * onto the first line of a growable editor.
 */
const ValueModeIndicator = React.forwardRef<HTMLDivElement, ValueModeIndicatorProps>(
  ({ mode, disabled, className, ...props }, ref) => {
    const strings = useValueModeStrings();
    if (mode !== 'expression') return null;

    return (
      <div
        ref={ref}
        data-slot="value-mode-indicator"
        // A named image, since screen readers would read the glyph as "equals" and `title` is not
        // announced reliably.
        role="img"
        aria-label={strings.expressionIndicator}
        title={strings.expressionIndicator}
        className={cn(
          'flex items-center justify-center px-2 font-mono text-sm font-medium text-muted-foreground',
          disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        <span aria-hidden="true">=</span>
      </div>
    );
  }
);
ValueModeIndicator.displayName = 'ValueModeIndicator';

export { ValueModeIndicator };
